const STORAGE_KEY = 'interviewHistory'

function isPlaceholderInterview(item = {}){
  const score = Number(item.overallScore ?? item.totalScore ?? item.score ?? 0)
  const hasQuestions = Array.isArray(item.questions) && item.questions.length > 0
  const hasGeneratedQuestions = Array.isArray(item.generatedQuestions) && item.generatedQuestions.length > 0
  const hasGeminiQuestions = Array.isArray(item.geminiReport?.questions) && item.geminiReport.questions.length > 0
  const hasSkills = (Array.isArray(item.selectedSkills) && item.selectedSkills.length > 0) || (Array.isArray(item.skills) && item.skills.length > 0)
  const hasAnswerText = (Array.isArray(item.questions) && item.questions.some((q) => String(q?.answer || '').trim() || String(q?.feedback || '').trim()))
    || (Array.isArray(item.geminiReport?.questions) && item.geminiReport.questions.some((q) => String(q?.answer || '').trim() || String(q?.feedback || '').trim()))

  return !(hasQuestions || hasGeneratedQuestions || hasGeminiQuestions || hasSkills || hasAnswerText || score > 0)
}

function normalizeInterview(item){
  const id = item._id || item.id || item.localId || `local-${Date.now()}`
  const createdAt = item.createdAt || item.date || new Date().toISOString()
  return {
    ...item,
    id,
    _id: item._id || item.id || id,
    date: typeof createdAt === 'string' ? createdAt : createdAt.toISOString(),
    createdAt: typeof createdAt === 'string' ? createdAt : createdAt.toISOString()
  }
}

export function loadLocalInterviews(){
  if(typeof window === 'undefined') return []
  try{
    const raw = localStorage.getItem(STORAGE_KEY)
    const items = raw ? JSON.parse(raw) : []
    return Array.isArray(items)
      ? items.map(normalizeInterview).filter((item) => !isPlaceholderInterview(item))
      : []
  }catch(e){
    return []
  }
}

export function saveLocalInterview(interview){
  if(typeof window === 'undefined') return null
  try{
    const items = loadLocalInterviews()
    const normalized = normalizeInterview(interview)
    const existingIndex = items.findIndex((item)=> item._id === normalized._id || item.id === normalized.id)
    if(existingIndex >= 0){
      items[existingIndex] = { ...items[existingIndex], ...normalized }
    } else {
      items.push(normalized)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    return normalized
  }catch(e){
    return null
  }
}

export function mergeInterviewHistory(serverInterviews){
  const safeServerInterviews = Array.isArray(serverInterviews)
    ? serverInterviews.map(normalizeInterview).filter((item) => !isPlaceholderInterview(item))
    : []
  return safeServerInterviews
}

export function pruneInvalidLocalInterviews(){
  if(typeof window === 'undefined') return 0
  try{
    const raw = localStorage.getItem(STORAGE_KEY)
    const items = raw ? JSON.parse(raw) : []
    if(!Array.isArray(items)) return 0

    const validItems = items
      .map(normalizeInterview)
      .filter((item) => !isPlaceholderInterview(item))

    if(validItems.length !== items.length){
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validItems))
    }
    return items.length - validItems.length
  }catch(e){
    return 0
  }
}

function formatDayLabel(date){
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(date).getDay()]
}

function normalizeDateKey(date){
  return new Date(date).toISOString().slice(0,10)
}

function buildStreak(dateKeys){
  const unique = Array.from(new Set(dateKeys)).sort((a,b)=> b.localeCompare(a))
  let streak = 0
  let previous = null
  for(const currentKey of unique){
    if(!previous){
      streak = 1
      previous = currentKey
      continue
    }
    const currentDate = new Date(currentKey)
    const previousDate = new Date(previous)
    const diffDays = Math.round((previousDate - currentDate) / (1000 * 60 * 60 * 24))
    if(diffDays === 1){
      streak += 1
      previous = currentKey
    } else if(diffDays === 0){
      continue
    } else {
      break
    }
  }
  return streak
}

function buildWeeklyProgress(interviews){
  const today = new Date()
  return Array.from({ length: 7 }).map((_, idx)=>{
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - idx))
    const key = normalizeDateKey(date)
    const entries = interviews.filter((item)=> normalizeDateKey(item.createdAt) === key)
    const score = entries.length
      ? Math.round(entries.reduce((sum, item)=> sum + (item.score || 0), 0) / entries.length)
      : 0
    return { day: formatDayLabel(date), score }
  })
}

function buildTopicBreakdown(interviews){
  const topicMap = new Map()
  interviews.forEach((interview)=>{
    const score = interview.score || 0
    const questions = Array.isArray(interview.questions) ? interview.questions : []
    questions.forEach((question)=>{
      const candidates = []
      if(question.category) candidates.push(String(question.category))
      if(Array.isArray(question.expectedTopics)) candidates.push(...question.expectedTopics.map(String))
      candidates.forEach((topic)=>{
        if(!topic) return
        const key = topic.trim()
        if(!key) return
        const entry = topicMap.get(key) || { total:0, count:0 }
        entry.total += score
        entry.count += 1
        topicMap.set(key, entry)
      })
    })
  })
  return Array.from(topicMap.entries())
    .map(([subject, { total, count }]) => ({ subject, score: count ? Math.round(total / count) : 0 }))
    .sort((a,b)=> b.score - a.score)
}

function buildRecommendations(interviews, overview, skillBreakdown){
  const recommendations = []
  const weakAreas = interviews
    .map((item)=> item.weak || item.feedback?.weakest)
    .filter(Boolean)
  const mostCommonWeak = weakAreas.reduce((acc, weak)=>{
    acc[weak] = (acc[weak] || 0) + 1
    return acc
  }, {})
  const topWeak = Object.entries(mostCommonWeak).sort((a,b)=> b[1] - a[1])[0]?.[0]

  if(topWeak){
    recommendations.push(`Focus on ${topWeak} improvements from your recent interviews.`)
  }

  if(overview.technicalAccuracy != null){
    recommendations.push(`Practice technical questions until your technical accuracy exceeds ${Math.max(overview.technicalAccuracy, 70)}%`)
  }

  if(overview.communication != null){
    if(overview.communication < 85){
      recommendations.push('Practice behavioral answers and storytelling to improve communication confidence.')
    } else {
      recommendations.push('Reinforce communication strength with timed mock answers.')
    }
  }

  if(skillBreakdown.length){
    const weakestSkill = skillBreakdown[skillBreakdown.length - 1]
    if(weakestSkill){
      recommendations.push(`Review ${weakestSkill.subject} concepts and examples to strengthen that weak area.`)
    }
  }

  return recommendations.slice(0, 3)
}

export function buildLocalDashboardMetrics(interviews){
  const items = Array.isArray(interviews) ? interviews : []
  const total = items.length
  const avgScore = total ? Math.round(items.reduce((sum, item)=> sum + (item.score || 0), 0) / total) : 0
  const technical = items.filter((item)=> item.config?.type === 'Technical')
  const behavioral = items.filter((item)=> item.config?.type === 'Behavioral')
  const technicalAccuracy = technical.length ? Math.round(technical.reduce((sum, item)=> sum + (item.score || 0), 0) / technical.length) : avgScore
  const communication = behavioral.length ? Math.round(behavioral.reduce((sum, item)=> sum + (item.score || 0), 0) / behavioral.length) : avgScore
  const dateKeys = items.map((item)=> normalizeDateKey(item.createdAt))
  const overview = {
    avgScore,
    interviewsCompleted: total,
    technicalAccuracy,
    communication,
    streak: buildStreak(dateKeys)
  }
  const weeklyProgress = buildWeeklyProgress(items)
  const skillBreakdown = buildTopicBreakdown(items)
  const recommendations = buildRecommendations(items, overview, skillBreakdown)
  return { overview, weeklyProgress, skillBreakdown, recommendations }
}
