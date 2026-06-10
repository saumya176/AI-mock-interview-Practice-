const Interview = require('../models/Interview')
const {
  normalizeScore,
  isMeaningfulText,
  buildSummary,
  loadRecordedInterviews,
  formatRecentInterview
} = require('../utils/interviewFilters')

function titleCase(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/(^|\s)([a-z])/g, (match, prefix, letter) => `${prefix}${letter.toUpperCase()}`)
}

function getRangeDate(range) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - range + 1)
  return date
}

function extractWeakTopics(interview) {
  const topics = new Set()
  const add = (value) => {
    if (!value) return
    const text = String(value).trim()
    if (!text) return
    topics.add(titleCase(text))
  }

  if (Array.isArray(interview.weakAreas)) interview.weakAreas.forEach(add)
  if (interview.weak) add(interview.weak)
  if (Array.isArray(interview.weaknesses)) interview.weaknesses.forEach(add)
  if (Array.isArray(interview.questions)) {
    interview.questions.forEach((question) => {
      if (question.category) add(question.category)
      if (question.score != null && Number(question.score) <= 60) {
        if (question.category) add(question.category)
      }
      if (Array.isArray(question.weaknesses)) question.weaknesses.forEach(add)
    })
  }
  if (!topics.size && Array.isArray(interview.selectedSkills)) interview.selectedSkills.forEach(add)
  if (!topics.size && Array.isArray(interview.skills)) interview.skills.forEach(add)

  return Array.from(topics)
}

function buildFocusAreas(interviews, maxAreas = 3) {
  const counts = {}

  interviews.forEach((interview) => {
    const score = normalizeScore(interview.overallScore)
    const weight = Math.max(5, 100 - score)
    const topics = extractWeakTopics(interview)

    topics.forEach((topic) => {
      counts[topic] = (counts[topic] || 0) + weight
    })
  })

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([topic]) => topic)
    .slice(0, maxAreas)

  if (sorted.length) return sorted

  const fallback = interviews
    .slice()
    .sort((a, b) => normalizeScore(a.overallScore) - normalizeScore(b.overallScore))[0]

  if (!fallback) return []

  return Array.from(
    new Set([
      ...(Array.isArray(fallback.weakAreas) ? fallback.weakAreas : []),
      fallback.weak,
      ...(Array.isArray(fallback.selectedSkills) ? fallback.selectedSkills : []),
      ...(Array.isArray(fallback.skills) ? fallback.skills : [])
    ].filter(Boolean))
  )
    .map(titleCase)
    .slice(0, maxAreas)
}

function buildImprovementSuggestions(interviews, averageScore, focusAreas = []) {
  if (!interviews.length) {
    return [
      'Start your first interview to generate real feedback.',
      'Practice explaining answers with concrete examples.',
      'Review past questions and note recurring topics.'
    ]
  }

  const suggestions = []

  if (interviews.length < 4) {
    suggestions.push('Complete more mock interviews to get stronger insights.')
  }

  if (focusAreas[0]) {
    suggestions.push(`Focus on ${focusAreas[0]} in your next practice session.`)
  }

  if (averageScore < 60) {
    suggestions.push('Strengthen programming fundamentals with short daily practice.')
  } else if (averageScore < 75) {
    suggestions.push('Practice clearer answer structure and explain each step.')
  } else {
    suggestions.push('Keep consistent practice and repeat what worked well.')
  }

  suggestions.push('Use feedback from previous interviews to target weak topics.')

  return Array.from(new Set(suggestions)).slice(0, 4)
}

function uniqueSortedDates(dates) {
  return Array.from(new Set(dates)).sort((a, b) => b.localeCompare(a))
}

function buildStreak(dateKeys) {
  const unique = uniqueSortedDates(dateKeys)
  let current = 0
  let longest = 0
  let previousDate = null

  for (const day of unique) {
    const date = new Date(day)
    if (!previousDate) {
      current = 1
    } else {
      const diff = Math.round((new Date(previousDate) - date) / (1000 * 60 * 60 * 24))
      if (diff === 1) {
        current += 1
      } else if (diff === 0) {
        continue
      } else {
        longest = Math.max(longest, current)
        current = 1
      }
    }
    previousDate = day
  }

  longest = Math.max(longest, current)
  return { current, longest }
}

function formatDayLabel(date) {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(date).getDay()]
}

function buildWeeklyPerformance(interviews, rangeDays = 30) {
  const start = getRangeDate(rangeDays)
  const buckets = {}

  interviews.forEach((interview) => {
    const date = new Date(interview.createdAt)
    if (isNaN(date)) return
    if (date < start) return
    const key = date.toISOString().slice(0, 10)
    buckets[key] = buckets[key] || { sum: 0, count: 0 }
    buckets[key].sum += normalizeScore(interview.overallScore)
    buckets[key].count += 1
  })

  const days = []
  for (let i = rangeDays - 1; i >= 0; i -= 1) {
    const entry = new Date(start)
    entry.setDate(start.getDate() + i)
    const key = entry.toISOString().slice(0, 10)
    const bucket = buckets[key]
    const value = bucket && bucket.count ? Math.round(bucket.sum / bucket.count) : 0
    days.push({ date: key, label: formatDayLabel(entry), value })
  }

  return days
}

function buildTypeBreakdown(interviews) {
  const counts = { Technical: 0, Behavioral: 0, Mixed: 0, Other: 0 }

  interviews.forEach((item) => {
    const type = String(item.interviewType || item.type || item.config?.type || 'Other').trim()
    if (type.match(/technical/i)) counts.Technical += 1
    else if (type.match(/behavioral/i)) counts.Behavioral += 1
    else if (type.match(/mixed/i)) counts.Mixed += 1
    else counts.Other += 1
  })

  return Object.entries(counts)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }))
}

function buildScoreDistribution(interviews) {
  const scores = { technical: [], communication: [], confidence: [], problemSolving: [] }

  interviews.forEach((item) => {
    scores.technical.push(normalizeScore(item.technicalScore || item.overallScore || 0))
    scores.communication.push(normalizeScore(item.communicationScore || item.overallScore || 0))
    scores.confidence.push(normalizeScore(item.confidenceScore || item.overallScore || 0))
    scores.problemSolving.push(normalizeScore(item.problemSolvingScore || item.overallScore || 0))
  })

  const avg = (arr) => (arr.length ? Math.round(arr.reduce((sum, v) => sum + v, 0) / arr.length) : 0)

  return [
    { name: 'Technical', value: avg(scores.technical) },
    { name: 'Communication', value: avg(scores.communication) },
    { name: 'Confidence', value: avg(scores.confidence) },
    { name: 'Problem Solving', value: avg(scores.problemSolving) }
  ]
}

const radarCategories = [
  { label: 'React', keywords: ['react', 'redux', 'next', 'vite', 'jsx', 'tsx'] },
  { label: 'DSA', keywords: ['data structure', 'algorithm', 'dsa', 'sorting', 'graph', 'tree', 'dynamic programming', 'heap'] },
  { label: 'Communication', keywords: ['communication', 'storytelling', 'presentation', 'clarity', 'behavioral'] },
  { label: 'Leadership', keywords: ['leadership', 'team', 'management', 'ownership', 'collaboration', 'mentor'] },
  { label: 'Problem Solving', keywords: ['debugging', 'problem solving', 'analysis', 'optimization', 'logic', 'strategy'] },
  { label: 'System Design', keywords: ['system design', 'architecture', 'scalability', 'api design', 'microservices', 'database design'] }
]

function buildRadarData(interviews) {
  if (!interviews.length) {
    return radarCategories.map((item) => ({ subject: item.label, score: 40 }))
  }

  const normalizeText = (value = '') => String(value).toLowerCase()

  return radarCategories.map((category) => {
    let total = 0
    let count = 0

    interviews.forEach((interview) => {
      const values = [
        ...(Array.isArray(interview.skills) ? interview.skills : []),
        ...(Array.isArray(interview.weakAreas) ? interview.weakAreas : []),
        ...(Array.isArray(interview.strongAreas) ? interview.strongAreas : []),
        interview.role || '',
        interview.companyTarget || ''
      ].map(normalizeText)

      const questionTopics = ([]).concat(interview.questions || []).flatMap((question) => {
        const fields = []
        if (question.category) fields.push(question.category)
        if (question.question) fields.push(question.question)
        if (Array.isArray(question.expectedTopics)) fields.push(...question.expectedTopics)
        return fields.map(normalizeText)
      })

      const allText = [...values, ...questionTopics].join(' ')
      const isMatch = category.keywords.some((keyword) => allText.includes(keyword))
      if (isMatch) {
        total += normalizeScore(interview.overallScore)
        count += 1
      }
    })

    const score = count ? Math.round(total / count) : 45
    return { subject: category.label, score: Math.max(20, Math.min(100, score)) }
  })
}

function buildRecommendations(interviews, overview) {
  const focusAreas = buildFocusAreas(interviews, 3)
  return buildImprovementSuggestions(interviews, overview?.averageScore || 0, focusAreas)
}

function formatRecentInterviews(interviews, limit = 8) {
  return interviews
    .slice(0, limit)
    .map(formatRecentInterview)
}

async function loadDashboardSummary(userId) {
  const interviews = await loadRecordedInterviews(userId, Interview)
  const summaryStats = buildSummary(interviews)
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  startOfWeek.setHours(0, 0, 0, 0)

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const roleCounts = interviews.reduce((acc, item) => {
    const role = String(item.role || item.config?.role || 'Unknown Role').trim() || 'Unknown Role'
    acc[role] = (acc[role] || 0) + 1
    return acc
  }, {})

  const skillCounts = interviews.reduce((acc, item) => {
    const skills = [
      ...(Array.isArray(item.selectedSkills) ? item.selectedSkills : []),
      ...(Array.isArray(item.skills) ? item.skills : [])
    ].filter((entry) => isMeaningfulText(entry))

    skills.forEach((skill) => {
      acc[skill] = (acc[skill] || 0) + 1
    })

    return acc
  }, {})

  const roles = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])
  const skills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1])
  const difficultyBreakdown = { easy: 0, medium: 0, hard: 0 }

  interviews.forEach((item) => {
    const label = String(item.difficulty || 'medium').toLowerCase()
    if (label in difficultyBreakdown) {
      difficultyBreakdown[label] += 1
    }
  })

  const recentInterviews = formatRecentInterviews(interviews, 5)

  return {
    totalInterviews: summaryStats.totalInterviews,
    completedInterviews: summaryStats.totalInterviews,
    averageScore: summaryStats.averageScore,
    highestScore: summaryStats.highestScore,
    totalPracticeMinutes: summaryStats.totalPracticeMinutes,
    rolesExplored: roles.length,
    skillsPracticed: skills.length,
    mostPracticedRole: roles[0]?.[0] || '',
    mostPracticedSkill: skills[0]?.[0] || '',
    recentInterviews,
    interviewsThisWeek: interviews.filter((item) => new Date(item.completedAt || item.createdAt) >= startOfWeek).length,
    interviewsThisMonth: interviews.filter((item) => new Date(item.completedAt || item.createdAt) >= startOfMonth).length,
    difficultyBreakdown,
    topSkills: skills.slice(0, 5).map(([name]) => name)
  }
}

async function loadInterviews(userId) {
  return loadRecordedInterviews(userId, Interview)
}

function buildTrendMetric(currentList, previousList) {
  const average = (arr) => (arr.length ? arr.reduce((sum, v) => sum + v, 0) / arr.length : 0)
  const currentAvg = average(currentList)
  const previousAvg = average(previousList)
  if (previousAvg === 0) return currentAvg ? 100 : 0
  return Math.round(((currentAvg - previousAvg) / previousAvg) * 100)
}

function getLastPeriods(interviews) {
  const sorted = [...interviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const chunk = Math.max(1, Math.min(3, Math.floor(sorted.length / 2)))
  return {
    latest: sorted.slice(0, chunk),
    previous: sorted.slice(chunk, chunk * 2)
  }
}

function buildOverview(interviews, rangeDays) {
  const filtered = rangeDays ? interviews.filter((item) => new Date(item.createdAt) >= getRangeDate(rangeDays)) : interviews
  const valid = filtered.filter((item) => item.overallScore != null)
  const totalInterviews = filtered.length
  const averageScore = valid.length ? Math.round(valid.reduce((sum, item) => sum + normalizeScore(item.overallScore), 0) / valid.length) : 0
  const bestScore = valid.length ? Math.max(...valid.map((item) => normalizeScore(item.overallScore))) : 0
  const totalPracticeTime = filtered.reduce((sum, item) => sum + (Number(item.duration) || 0), 0)
  const focusAreas = buildFocusAreas(filtered, 3)
  const improvementSuggestions = buildImprovementSuggestions(filtered, averageScore, focusAreas)

  return {
    totalInterviews,
    averageScore,
    bestScore,
    totalPracticeTime,
    focusAreas,
    improvementSuggestions
  }
}

module.exports = {
  loadInterviews,
  buildOverview,
  buildWeeklyPerformance,
  buildRadarData,
  buildScoreDistribution,
  buildTypeBreakdown,
  buildRecommendations,
  formatRecentInterviews,
  loadDashboardSummary,
  buildFocusAreas,
  buildImprovementSuggestions,
  extractWeakTopics
}
