const mongoose = require('mongoose')

function normalizeScore(value) {
  const score = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0
}

function isMeaningfulText(value) {
  const text = String(value ?? '').trim()
  if (!text) return false
  const normalized = text.toLowerCase()
  return !['na', 'n/a', 'none', 'not answered', 'unknown'].includes(normalized)
}

/** MongoDB match: interviews the user actually completed or saved with results. */
function recordedInterviewMatch() {
  return {
    $or: [
      { 'questions.0': { $exists: true } },
      { 'geminiReport.questions.0': { $exists: true } },
      { overallScore: { $gt: 0 } },
      { totalScore: { $gt: 0 } },
      { score: { $gt: 0 } }
    ]
  }
}

function isRecordedInterview(item = {}) {
  const score = normalizeScore(item.overallScore ?? item.totalScore ?? item.score ?? 0)
  const hasSavedQuestions = Array.isArray(item.questions) && item.questions.length > 0
  const hasGeminiQuestions = Array.isArray(item.geminiReport?.questions) && item.geminiReport.questions.length > 0

  if (!hasSavedQuestions && !hasGeminiQuestions && score <= 0) return false

  if (String(item.status || '').toLowerCase() === 'inprogress') {
    const hasAnswerText = (Array.isArray(item.questions) && item.questions.some((entry) => isMeaningfulText(entry?.answer) || isMeaningfulText(entry?.feedback)))
      || (Array.isArray(item.geminiReport?.questions) && item.geminiReport.questions.some((entry) => isMeaningfulText(entry?.answer) || isMeaningfulText(entry?.feedback)))
    return hasAnswerText || score > 0
  }

  return true
}

function dedupeInterviews(interviews) {
  const map = new Map()

  interviews.forEach((item) => {
    const key = String(item.interviewId || item._id || '')
    if (!key) return

    const existing = map.get(key)
    if (!existing) {
      map.set(key, item)
      return
    }

    const existingScore = normalizeScore(existing.overallScore ?? existing.totalScore ?? existing.score ?? 0)
    const itemScore = normalizeScore(item.overallScore ?? item.totalScore ?? item.score ?? 0)
    const existingDate = new Date(existing.completedAt || existing.createdAt || 0).getTime()
    const itemDate = new Date(item.completedAt || item.createdAt || 0).getTime()

    if (itemScore > existingScore || (itemScore === existingScore && itemDate > existingDate)) {
      map.set(key, item)
    }
  })

  return Array.from(map.values())
}

function sortInterviewsDesc(interviews) {
  return [...interviews].sort((a, b) => {
    const dateA = new Date(a.completedAt || a.createdAt || 0).getTime()
    const dateB = new Date(b.completedAt || b.createdAt || 0).getTime()
    return dateB - dateA
  })
}

function buildSummary(interviews) {
  const scores = interviews.map((item) => normalizeScore(item.overallScore ?? item.totalScore ?? item.score ?? 0))
  const totalInterviews = interviews.length
  const averageScore = scores.length
    ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
    : 0
  const highestScore = scores.length ? Math.max(...scores) : 0
  const totalPracticeMinutes = interviews.reduce((sum, item) => sum + (Number(item.duration) || 0), 0)

  return { totalInterviews, averageScore, highestScore, totalPracticeMinutes }
}

function toObjectId(id) {
  try {
    return new mongoose.Types.ObjectId(id)
  } catch {
    return id
  }
}

async function loadRecordedInterviews(userId, Interview) {
  const pipeline = [
    { $match: { user: toObjectId(userId) } },
    {
      $addFields: {
        overallScore: { $ifNull: ['$overallScore', '$totalScore', '$score', 0] },
        completedAt: { $ifNull: ['$completedAt', '$createdAt'] },
        status: { $ifNull: ['$status', 'Completed'] }
      }
    },
    { $match: recordedInterviewMatch() },
    { $sort: { interviewId: 1, overallScore: -1, createdAt: -1 } },
    {
      $group: {
        _id: { $ifNull: ['$interviewId', '$_id'] },
        doc: { $first: '$$ROOT' }
      }
    },
    { $replaceRoot: { newRoot: '$doc' } },
    { $sort: { completedAt: -1, createdAt: -1 } }
  ]

  const interviews = await Interview.aggregate(pipeline)
  return sortInterviewsDesc(interviews.filter(isRecordedInterview))
}

function formatRecentInterview(item) {
  const completedAt = item.completedAt || item.createdAt || null
  return {
    id: item._id,
    _id: item._id,
    role: item.role || item.config?.role || 'Unknown Role',
    type: item.interviewType || item.type || item.config?.type || 'Mixed',
    difficulty: item.difficulty || item.config?.difficulty || 'medium',
    score: normalizeScore(item.overallScore ?? item.totalScore ?? item.score ?? 0),
    overallScore: normalizeScore(item.overallScore ?? item.totalScore ?? item.score ?? 0),
    date: completedAt,
    completedAt,
    createdAt: item.createdAt || completedAt,
    status: item.status || 'Completed',
    duration: item.duration || item.config?.duration || 0,
    selectedSkills: item.selectedSkills || item.skills || []
  }
}

/** Use after $addFields normalizes overallScore. */
function recordedInterviewMatchNormalized() {
  return {
    $or: [
      { 'questions.0': { $exists: true } },
      { 'geminiReport.questions.0': { $exists: true } },
      { overallScore: { $gt: 0 } }
    ]
  }
}

module.exports = {
  normalizeScore,
  isMeaningfulText,
  isRecordedInterview,
  recordedInterviewMatch,
  recordedInterviewMatchNormalized,
  dedupeInterviews,
  sortInterviewsDesc,
  buildSummary,
  loadRecordedInterviews,
  formatRecentInterview,
  toObjectId
}
