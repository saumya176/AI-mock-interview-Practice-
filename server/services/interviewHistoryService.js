const Interview = require('../models/Interview')
const {
  recordedInterviewMatchNormalized,
  toObjectId
} = require('../utils/interviewFilters')

function escapeRegExp(value = ''){
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function toObjectIdSafe(id){
  return toObjectId(id)
}

function buildDateMatch(startDate, endDate){
  const createdAt = {}
  if(startDate){
    const start = new Date(startDate)
    if(!Number.isNaN(start.getTime())) createdAt.$gte = start
  }
  if(endDate){
    const end = new Date(endDate)
    if(!Number.isNaN(end.getTime())){
      end.setHours(23,59,59,999)
      createdAt.$lte = end
    }
  }
  return Object.keys(createdAt).length ? { createdAt } : null
}

function normalizeArrayField(field){
  return {
    $cond: [
      { $isArray: field },
      field,
      {
        $cond: [
          { $gt: [ { $strLenCP: { $ifNull: [ field, '' ] } }, 0 ] },
          [ field ],
          []
        ]
      }
    ]
  }
}

function buildFilterStages({ search, role, difficulty, type, companyTarget, minScore, maxScore, startDate, endDate }){
  const stages = []
  if(search){
    const regex = new RegExp(escapeRegExp(search), 'i')
    stages.push({
      $match: {
        $or: [
          { role: regex },
          { companyTarget: regex },
          { interviewType: regex },
          { difficulty: regex },
          { weak: regex },
          { selectedSkills: regex },
          { 'generatedQuestions.question': regex }
        ]
      }
    })
  }
  if(role){
    stages.push({ $match: { role: { $regex: escapeRegExp(role), $options: 'i' } } })
  }
  if(difficulty){
    stages.push({ $match: { difficulty: { $regex: escapeRegExp(difficulty), $options: 'i' } } })
  }
  if(type){
    stages.push({ $match: { interviewType: { $regex: escapeRegExp(type), $options: 'i' } } })
  }
  if(companyTarget){
    stages.push({ $match: { companyTarget: { $regex: escapeRegExp(companyTarget), $options: 'i' } } })
  }
  const scoreFilter = {}
  if(minScore !== undefined && minScore !== null && minScore !== ''){
    const value = Number(minScore)
    if(!Number.isNaN(value)) scoreFilter.$gte = value
  }
  if(maxScore !== undefined && maxScore !== null && maxScore !== ''){
    const value = Number(maxScore)
    if(!Number.isNaN(value)) scoreFilter.$lte = value
  }
  if(Object.keys(scoreFilter).length){
    stages.push({ $match: { overallScore: scoreFilter } })
  }
  const dateMatch = buildDateMatch(startDate, endDate)
  if(dateMatch){ stages.push({ $match: dateMatch }) }
  return stages
}

async function getPreviousQuestionsForUser(userId, limit = 200){
  const items = await Interview.find({ user: userId }).sort({ createdAt: -1 }).limit(limit).lean()
  const questions = []
  for(const it of items){
    if(it.generatedQuestions && it.generatedQuestions.length){
      for(const q of it.generatedQuestions){
        if(q && q.question) questions.push(q.question)
      }
    }
  }
  return questions
}

async function getPreviousQuestionIdsForUser(userId, limit = 200){
  const items = await Interview.find({ user: userId }).sort({ createdAt: -1 }).limit(limit).lean()
  const ids = []
  for(const it of items){
    if(it.generatedQuestions && it.generatedQuestions.length){
      for(const q of it.generatedQuestions){
        if(q && q.id) ids.push(q.id)
        else if(q && q.question) ids.push(q.question)
      }
    }
  }
  return ids
}

async function getInterviewHistory(userId, query = {}){
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(50, Math.max(6, Number(query.limit) || 12))
  const sortBy = ['completedAt', 'createdAt', 'totalScore', 'role', 'companyTarget'].includes(query.sortBy) ? query.sortBy : 'completedAt'
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1
  const offset = (page - 1) * limit

  const pipeline = [
    { $match: { user: toObjectIdSafe(userId) } },
    { $addFields: {
      overallScore: { $ifNull: ['$overallScore', '$totalScore', '$score', 0] },
      technicalScore: { $ifNull: ['$technicalScore', 0] },
      communicationScore: { $ifNull: ['$communicationScore', 0] },
      confidenceScore: { $ifNull: ['$confidenceScore', 0] },
      completedAt: { $ifNull: ['$completedAt', '$createdAt'] },
      status: { $ifNull: ['$status', 'Completed'] },
      selectedSkills: { $ifNull: ['$selectedSkills', '$skills', []] },
      weakAreas: normalizeArrayField('$weakAreas'),
      strongAreas: normalizeArrayField('$strongAreas'),
      skills: { $ifNull: ['$skills', []] }
    } },
    { $match: recordedInterviewMatchNormalized() },
    { $sort: { interviewId: 1, overallScore: -1, createdAt: -1 } },
    { $group: {
      _id: { $ifNull: ['$interviewId', '$_id'] },
      doc: { $first: '$$ROOT' }
    } },
    { $replaceRoot: { newRoot: '$doc' } },
    ...buildFilterStages(query),
    { $sort: { [sortBy]: sortOrder, createdAt: -1 } },
    { $facet: {
      metadata: [{ $count: 'total' }],
      summary: [
        { $group: {
          _id: null,
          totalInterviews: { $sum: 1 },
          highestScore: { $max: '$overallScore' },
          averageScore: { $avg: '$overallScore' },
          totalPracticeMinutes: { $sum: { $ifNull: ['$duration', 0] } }
        } },
        { $project: { _id: 0, totalInterviews: 1, highestScore: 1, averageScore: 1, totalPracticeMinutes: 1 } }
      ],
      data: [
        { $skip: offset },
        { $limit: limit },
        { $project: {
          _id: 1,
          interviewId: 1,
          role: 1,
          interviewType: 1,
          difficulty: 1,
          selectedSkills: 1,
          skills: 1,
          overallScore: 1,
          technicalScore: 1,
          communicationScore: 1,
          confidenceScore: 1,
          completedAt: 1,
          status: 1,
          strengths: 1,
          weaknesses: 1,
          improvementSuggestions: 1,
          geminiReport: 1,
          generatedQuestions: 1
        } }
      ]
    } }
  ]

  const [result] = await Interview.aggregate(pipeline)
  const total = result?.metadata?.[0]?.total || 0
  const summary = result?.summary?.[0] || { totalInterviews: total, averageScore: 0, highestScore: 0, totalPracticeMinutes: 0 }
  // Round average and highest scores
  if(summary.averageScore) summary.averageScore = Math.round(summary.averageScore)
  if(summary.highestScore) summary.highestScore = Math.round(summary.highestScore)
  return {
    items: result?.data || [],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    summary
  }
}

async function getInterviewById(userId, id){
  const interview = await Interview.findOne({ _id: id, user: toObjectIdSafe(userId) }).lean()
  return interview
}

function arrayCounts(values = []){
  return values.reduce((acc, value) => {
    if(!value) return acc
    const normalized = Array.isArray(value) ? value : [value]
    for(const item of normalized){
      const trimmed = String(item).trim()
      if(!trimmed) continue
      acc[trimmed] = (acc[trimmed] || 0) + 1
    }
    return acc
  }, {})
}

async function getInterviewAnalytics(userId, query = {}){
  const rangeDays = Math.max(7, Math.min(180, Number(query.rangeDays) || 90))
  const since = new Date()
  since.setDate(since.getDate() - rangeDays)

  const basePipeline = [
    { $match: { user: toObjectIdSafe(userId), createdAt: { $gte: since } } },
    { $addFields: {
      overallScore: { $ifNull: ['$overallScore', '$score', 0] },
      technicalScore: { $ifNull: ['$technicalScore', 0] },
      communicationScore: { $ifNull: ['$communicationScore', 0] },
      confidenceScore: { $ifNull: ['$confidenceScore', 0] },
      problemSolvingScore: { $ifNull: ['$problemSolvingScore', 0] },
      weakAreas: normalizeArrayField('$weakAreas'),
      strongAreas: normalizeArrayField('$strongAreas'),
      skills: { $ifNull: ['$skills', []] },
      companyTarget: { $ifNull: ['$companyTarget', 'General'] },
      interviewType: { $ifNull: ['$interviewType', '$type', 'Interview'] }
    } },
    { $sort: { createdAt: 1 } }
  ]

  const docs = await Interview.aggregate([...basePipeline])
  const totalInterviews = docs.length
  const totalPracticeMinutes = docs.reduce((sum, item) => sum + (Number(item.duration) || 0), 0)
  const highestScore = docs.reduce((max, item) => Math.max(max, Number(item.overallScore) || 0), 0)
  const averageScore = totalInterviews ? docs.reduce((sum, item) => sum + (Number(item.overallScore) || 0), 0) / totalInterviews : 0

  const skillCounts = arrayCounts(docs.flatMap((item) => item.skills || []))
  const weakCounts = arrayCounts(docs.flatMap((item) => item.weakAreas || []))

  const strongestSkill = Object.entries(skillCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A'
  const weakestFocusArea = Object.entries(weakCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A'

  const trendMap = docs.reduce((acc, item) => {
    const day = item.createdAt.toISOString().slice(0,10)
    const record = acc[day] || { date: day, averageScore: 0, count: 0 }
    record.averageScore += Number(item.overallScore) || 0
    record.count += 1
    acc[day] = record
    return acc
  }, {})

  const trend = Object.values(trendMap)
    .sort((a,b)=>a.date.localeCompare(b.date))
    .map((record) => ({ date: record.date, averageScore: record.count ? Number((record.averageScore / record.count).toFixed(1)) : 0, interviews: record.count }))

  const skillGrowth = Object.entries(skillCounts)
    .map(([skill, count]) => {
      const scoreSum = docs.reduce((total, item) => {
        if(Array.isArray(item.skills) && item.skills.includes(skill)){
          return total + (Number(item.overallScore) || 0)
        }
        return total
      }, 0)
      return { skill, averageScore: count ? Number((scoreSum / count).toFixed(1)) : 0, sessions: count }
    })
    .sort((a,b)=>b.averageScore - a.averageScore)
    .slice(0,6)

  const heatmapCounts = docs.reduce((acc, item) => {
    const day = item.createdAt.toISOString().slice(0,10)
    acc[day] = (acc[day] || 0) + 1
    return acc
  }, {})

  const practiceHeatmap = []
  for(let i = rangeDays - 1; i >= 0; i -= 1){
    const date = new Date()
    date.setDate(date.getDate() - i)
    const day = date.toISOString().slice(0,10)
    practiceHeatmap.push({ date: day, count: heatmapCounts[day] || 0 })
  }

  return {
    summary: {
      totalInterviews,
      totalPracticeHours: Number((totalPracticeMinutes / 60).toFixed(1)),
      highestScore,
      averageScore: Number(averageScore.toFixed(1)),
      strongestSkill,
      weakestFocusArea,
      averageTechnical: totalInterviews ? Number((docs.reduce((sum,item)=>sum + (Number(item.technicalScore)||0),0) / totalInterviews).toFixed(1)) : 0,
      averageCommunication: totalInterviews ? Number((docs.reduce((sum,item)=>sum + (Number(item.communicationScore)||0),0) / totalInterviews).toFixed(1)) : 0,
      averageConfidence: totalInterviews ? Number((docs.reduce((sum,item)=>sum + (Number(item.confidenceScore)||0),0) / totalInterviews).toFixed(1)) : 0,
      averageProblemSolving: totalInterviews ? Number((docs.reduce((sum,item)=>sum + (Number(item.problemSolvingScore)||0),0) / totalInterviews).toFixed(1)) : 0
    },
    trend,
    skillGrowth,
    practiceHeatmap,
    recentInterviews: docs.slice(-6).reverse()
  }
}

module.exports = { getPreviousQuestionsForUser, getPreviousQuestionIdsForUser, getInterviewHistory, getInterviewById, getInterviewAnalytics }
