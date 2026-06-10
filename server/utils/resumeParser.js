const pdf = require('pdf-parse')
const mammoth = require('mammoth')

function normalizeText(text){
  return (text||'').replace(/\r/g,'\n').replace(/\n{2,}/g,'\n\n').trim()
}

async function parseResume(buffer, mimeType, filename){
  // mimeType: 'application/pdf' or 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  let text = ''
  if(!buffer) return { rawText: '', projects:[], technologies:[], skills:[], experience:[], education:[], achievements:[] }

  try{
    if(mimeType && mimeType.includes('pdf') || filename && filename.toLowerCase().endsWith('.pdf')){
      const data = await pdf(buffer)
      text = data.text || ''
    } else {
      // try docx via mammoth
      const res = await mammoth.extractRawText({ buffer })
      text = res.value || ''
    }
  }catch(e){
    // fallback to buffer to string
    text = buffer.toString('utf8')
  }

  text = normalizeText(text)

  // crude heuristics to pull sections
  const lower = text.toLowerCase()
  const sections = {}
  const lines = text.split(/\n/)
  
  // simple regex-based extraction
  const projects = []
  const technologies = new Set()
  const skills = new Set()
  const experience = []
  const education = []
  const achievements = []

  // identify lines mentioning project, experience, education, skills, achievements
  for(const ln of lines){
    const l = ln.trim()
    if(!l) continue
    const low = l.toLowerCase()
    if(/project(s)?[:\-]/.test(low) || low.startsWith('project') || low.includes('projects') ){
      projects.push(l)
    }
    if(/experience[:\-]/.test(low) || low.match(/\b(years?)\b/) && low.match(/\d/)){
      experience.push(l)
    }
    if(/education|degree|bachelor|master|school|university/.test(low)){
      education.push(l)
    }
    if(/skill(s)?[:\-]|technolog(y|ies)[:\-]|proficient|proficiency|familiar with/.test(low)){
      // split comma separated
      const parts = l.split(/[:,\-]/).slice(1).join(' ').split(/,|;|\||\band\b/).map(s=>s.trim()).filter(Boolean)
      parts.forEach(p=>{
        p.split(/\s+\//).forEach(t=>{
          if(t) technologies.add(t)
        })
      })
      parts.forEach(p=>{ if(p) skills.add(p) })
    }
    if(/achievement|awards|honor(s)?/.test(low)){
      achievements.push(l)
    }
    // quick technology detection
    const techMatches = l.match(/\b(JavaScript|TypeScript|Python|Java|C#|C\+\+|React|Node|Express|MongoDB|SQL|Postgres|Docker|Kubernetes|AWS|GCP|TensorFlow|PyTorch|NumPy|Pandas|Mongoose)\b/ig)
    if(techMatches){ techMatches.forEach(t=>technologies.add(t)) }
  }

  // fallback: try to extract skills block by searching "skills" section
  const skillsMatch = text.match(/skills[:\-\n\s]*([\s\S]{0,400})/i)
  if(skillsMatch && skillsMatch[1]){
    const list = skillsMatch[1].split(/\n|,|;|\||\band\b/).slice(0,40).map(s=>s.trim()).filter(Boolean)
    list.forEach(s=>skills.add(s))
  }

  return {
    rawText: text,
    projects: projects.slice(0,10),
    technologies: Array.from(technologies).slice(0,50),
    skills: Array.from(skills).slice(0,50),
    experience: experience.slice(0,10),
    education: education.slice(0,10),
    achievements: achievements.slice(0,10)
  }
}

module.exports = { parseResume }
