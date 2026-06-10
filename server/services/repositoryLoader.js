const fs = require('fs').promises
const path = require('path')

const REPO_ROOT = path.join(__dirname, '..', '..', 'question-repositories')

const ROLE_NORMALIZATION = {
  'frontend developer': 'frontend',
  'backend developer': 'backend',
  'full stack developer': 'fullstack',
  'java developer': 'java',
  'devops engineer': 'devops',
  'data analyst': 'data-analyst',
  'dsa': 'dsa',
  'hr': 'hr'
}

const ROLE_REPOSITORIES = {
  frontend: ['frontend'],
  backend: ['backend'],
  fullstack: ['frontend', 'backend', 'fullstack'],
  java: ['java'],
  devops: ['devops'],
  'data-analyst': ['data-analyst'],
  dsa: ['dsa'],
  hr: ['hr']
}

const REPOSITORY_FILES = {
  frontend: {
    'React': 'react.json',
    'JavaScript': 'javascript.json',
    'HTML': 'html.json',
    'CSS': 'css.json'
  },
  backend: {
    'Node.js': 'nodejs.json',
    'Express': 'express.json',
    'MongoDB': 'mongodb.json',
    'Authentication': 'authentication.json',
    'REST API': 'rest-api.json'
  },
  fullstack: {
    'API Integration': 'api-integration.json',
    'Frontend-Backend Flow': 'frontend-backend-flow.json'
  },
  java: {
    'Core Java': 'core-java.json',
    'OOPS': 'oops.json',
    'Collections': 'collections.json',
    'Multithreading': 'multithreading.json',
    'Spring Boot': 'springboot.json'
  },
  devops: {
    'Docker': 'docker.json',
    'Kubernetes': 'kubernetes.json',
    'CI/CD': 'cicd.json',
    'AWS': 'aws-basics.json'
  },
  'data-analyst': {
    'SQL': 'sql.json',
    'Python': 'python.json',
    'Excel': 'excel.json',
    'Statistics': 'statistics.json',
    'Power BI': 'powerbi.json'
  },
  dsa: {
    'Arrays': 'arrays.json',
    'Strings': 'strings.json',
    'Linked List': 'linkedlist.json',
    'Trees': 'trees.json',
    'Graphs': 'graphs.json',
    'Sorting': 'sorting.json',
    'Searching': 'searching.json'
  },
  hr: {
    'Behavioral': 'behavioral.json',
    'Project Discussion': 'project-discussion.json'
  }
}

const DEFAULT_SKILLS = {
  frontend: ['React', 'JavaScript', 'HTML', 'CSS'],
  backend: ['Node.js', 'Express', 'MongoDB', 'Authentication', 'REST API'],
  fullstack: ['React', 'JavaScript', 'Node.js', 'MongoDB', 'API Integration'],
  java: ['Core Java', 'OOPS', 'Collections', 'Multithreading', 'Spring Boot'],
  devops: ['Docker', 'Kubernetes', 'CI/CD', 'AWS'],
  'data-analyst': ['SQL', 'Python', 'Excel', 'Statistics', 'Power BI'],
  dsa: ['Arrays', 'Strings', 'Linked List', 'Trees', 'Graphs'],
  hr: ['Behavioral', 'Project Discussion']
}

const INTERVIEW_TYPE_SKILLS = {
  hr: ['Behavioral', 'Project Discussion'],
  mixed: ['Behavioral', 'Project Discussion'],
  dsa: Object.keys(REPOSITORY_FILES.dsa)
}

function normalizeRole(role) {
  if (!role) return 'frontend'
  const key = String(role).trim().toLowerCase()
  return ROLE_NORMALIZATION[key] || key
}

function normalizeType(interviewType) {
  if (!interviewType) return 'technical'
  return String(interviewType).trim().toLowerCase()
}

function findSkillFile(skill, repoNames) {
  if (!skill) return null
  const normalizedSkill = String(skill).trim().toLowerCase()
  for (const repo of repoNames) {
    const mapping = REPOSITORY_FILES[repo] || {}
    for (const [skillKey, filename] of Object.entries(mapping)) {
      if (skillKey.toLowerCase() === normalizedSkill) {
        return { repo, filename }
      }
    }
  }
  return null
}

function getDefaultSkillFiles(roleRepos) {
  const files = []
  roleRepos.forEach((repo) => {
    const skills = DEFAULT_SKILLS[repo] || []
    skills.forEach((skill) => {
      const file = findSkillFile(skill, [repo])
      if (file) files.push(file)
    })
  })
  return files
}

function getRepositoryFilesForConfig(config) {
  const roleKey = normalizeRole(config.role)
  const interviewType = normalizeType(config.interviewType || config.type)
  const selectedSkills = Array.isArray(config.selectedSkills) ? config.selectedSkills : []
  const roleRepos = ROLE_REPOSITORIES[roleKey] || ['frontend']

  const files = []

  selectedSkills.forEach((skill) => {
    const file = findSkillFile(skill, roleRepos)
    if (file) files.push(file)
  })

  if (files.length === 0) {
    files.push(...getDefaultSkillFiles(roleRepos))
  }

  if (interviewType === 'hr' || interviewType === 'mixed') {
    const hrFiles = Object.entries(REPOSITORY_FILES.hr).map(([, filename]) => ({ repo: 'hr', filename }))
    hrFiles.forEach((entry) => files.push(entry))
  }

  if (interviewType === 'dsa') {
    const dsaFiles = selectedSkills.length
      ? selectedSkills.map((skill) => findSkillFile(skill, ['dsa'])).filter(Boolean)
      : Object.entries(REPOSITORY_FILES.dsa).map(([, filename]) => ({ repo: 'dsa', filename }))
    dsaFiles.forEach((entry) => files.push(entry))
  }

  const uniqueFiles = []
  const seen = new Set()
  files.forEach(({ repo, filename }) => {
    const key = `${repo}/${filename}`
    if (!seen.has(key)) {
      seen.add(key)
      uniqueFiles.push({ repo, filename })
    }
  })

  return uniqueFiles
}

async function loadQuestionsFromFiles(files) {
  const questionSets = await Promise.all(files.map(async ({ repo, filename }) => {
    const filePath = path.join(REPO_ROOT, repo, filename)
    try {
      const raw = await fs.readFile(filePath, 'utf8')
      const parsed = JSON.parse(raw)
      return (Array.isArray(parsed) ? parsed : []).map((question) => ({
        ...question,
        sourceRepo: repo,
        sourceFile: filename,
        skill: question.skill || question.category || null,
        type: question.type || (repo === 'hr' ? 'hr' : 'technical')
      }))
    } catch (error) {
      console.warn(`Unable to load questions from ${filePath}:`, error.message)
      return []
    }
  }))
  return questionSets.flat()
}

function shuffle(array) {
  return array
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item)
}

function normalizeQuestion(question, index) {
  const text = String(question.question || question.text || '').trim()
  return {
    id: question.id || `${question.sourceRepo}-${index}-${Buffer.from(text).toString('base64').slice(0, 8)}`,
    question: text,
    difficulty: String(question.difficulty || 'medium').toLowerCase(),
    type: String(question.type || 'technical').toLowerCase(),
    category: question.category || question.skill || question.type || 'technical',
    expectedTopics: Array.isArray(question.expectedTopics) ? question.expectedTopics : [],
    sourceRepo: question.sourceRepo,
    sourceFile: question.sourceFile,
    skill: question.skill || question.category || null,
    followUps: Array.isArray(question.followUps) ? question.followUps : []
  }
}

function normalizeSkillName(value) {
  return String(value || '').trim().toLowerCase()
}

function matchesSkill(question, skill) {
  if (!skill) return false
  const needle = normalizeSkillName(skill)
  return [question.skill, question.category, question.sourceFile]
    .filter(Boolean)
    .some((value) => normalizeSkillName(value).includes(needle))
}

function buildSelectionBuckets(questions, config) {
  const questionCount = Number(config.questionCount) || 10
  const interviewType = normalizeType(config.interviewType || config.type)
  const selectedSkills = Array.isArray(config.selectedSkills) ? config.selectedSkills : []
  const techCount = interviewType === 'mixed' ? Math.max(1, questionCount - 2) : interviewType === 'hr' ? 0 : questionCount
  const hrCount = interviewType === 'mixed' ? 2 : interviewType === 'hr' ? Math.min(3, questionCount) : 0

  const skillPools = selectedSkills.length
    ? selectedSkills.map((skill) => ({
      name: skill,
      matcher: (q) => matchesSkill(q, skill),
      target: Math.max(1, Math.floor(techCount / selectedSkills.length))
    }))
    : [{ name: 'technical', matcher: (q) => q.type === 'technical', target: techCount }]

  let remainder = techCount - skillPools.reduce((sum, bucket) => sum + bucket.target, 0)
  for (let index = 0; remainder > 0 && index < skillPools.length; index += 1) {
    skillPools[index].target += 1
    remainder -= 1
  }

  const buckets = [...skillPools]
  if (hrCount > 0) {
    buckets.push({
      name: 'hr',
      matcher: (q) => q.type === 'hr',
      target: hrCount
    })
  }

  if (!selectedSkills.length && interviewType === 'technical') {
    buckets.push({ name: 'general', matcher: (q) => q.type === 'technical', target: techCount })
  }

  return buckets
}

function selectBalancedQuestions(questions, config) {
  const questionCount = Number(config.questionCount) || 10
  const buckets = buildSelectionBuckets(questions, config)
  const selected = []
  const selectedIds = new Set()

  buckets.forEach((bucket) => {
    const candidates = shuffle(questions.filter((q) => !selectedIds.has(q.id) && bucket.matcher(q)))
    candidates.slice(0, bucket.target).forEach((item) => {
      selected.push(item)
      selectedIds.add(item.id)
    })
  })

  if (selected.length < questionCount) {
    const fallback = shuffle(questions.filter((q) => !selectedIds.has(q.id))).slice(0, questionCount - selected.length)
    fallback.forEach((item) => {
      selected.push(item)
      selectedIds.add(item.id)
    })
  }

  return selected.slice(0, questionCount)
}

async function loadQuestionsForConfig(config) {
  const files = getRepositoryFilesForConfig(config)
  const questions = await loadQuestionsFromFiles(files)
  return questions.map(normalizeQuestion)
}

module.exports = {
  getRepositoryFilesForConfig,
  loadQuestionsForConfig,
  loadQuestionsFromFiles,
  normalizeQuestion,
  buildSelectionBuckets,
  selectBalancedQuestions
}
