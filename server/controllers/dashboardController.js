const { loadInterviews, buildOverview, buildWeeklyPerformance, buildRadarData, buildScoreDistribution, buildTypeBreakdown, buildRecommendations, formatRecentInterviews, loadDashboardSummary } = require('../services/dashboardService')

function parseRange(range){
  if(!range) return 30
  const value = Number(range)
  if([7,14,30,90,180].includes(value)) return value
  return 30
}

async function overview(req,res,next){
  try{
    const userId = req.user._id
    const rangeDays = parseRange(req.query.range)
    const interviews = await loadInterviews(userId)
    const data = buildOverview(interviews, rangeDays)
    res.json(data)
  }catch(e){
    next(e)
  }
}

async function charts(req,res,next){
  try{
    const userId = req.user._id
    const rangeDays = parseRange(req.query.range)
    const interviews = await loadInterviews(userId)
    const filtered = interviews.filter((item)=> new Date(item.createdAt) >= new Date(new Date().setDate(new Date().getDate() - rangeDays + 1)))
    const weeklyPerformance = buildWeeklyPerformance(interviews, rangeDays)
    const radarData = buildRadarData(interviews)
    const scoreDistribution = buildScoreDistribution(filtered.length ? filtered : interviews)
    const interviewTypeData = buildTypeBreakdown(interviews)
    res.json({ weeklyPerformance, radarData, scoreDistribution, interviewTypeData })
  }catch(e){
    next(e)
  }
}

async function recommendations(req,res,next){
  try{
    const userId = req.user._id
    const rangeDays = parseRange(req.query.range)
    const interviews = await loadInterviews(userId)
    const overviewData = buildOverview(interviews, rangeDays)
    const items = buildRecommendations(interviews, overviewData)
    res.json({ recommendations: items })
  }catch(e){
    next(e)
  }
}

async function recentInterviews(req,res,next){
  try{
    const userId = req.user._id
    const limit = Number(req.query.limit) || 8
    const interviews = await loadInterviews(userId)
    const results = formatRecentInterviews(interviews, limit)
    res.json({ recentInterviews: results })
  }catch(e){
    next(e)
  }
}

async function summary(req,res,next){
  try{
    const userId = req.user._id
    const summaryData = await loadDashboardSummary(userId)
    res.json(summaryData)
  }catch(e){
    next(e)
  }
}

async function stats(req,res,next){
  try{
    const userId = req.user._id
    const rangeDays = parseRange(req.query.range)
    const interviews = await loadInterviews(userId)
    const overviewData = buildOverview(interviews, rangeDays)
    const chartData = {
      weeklyPerformance: buildWeeklyPerformance(interviews, rangeDays),
      radarData: buildRadarData(interviews),
      scoreDistribution: buildScoreDistribution(interviews),
      interviewTypeData: buildTypeBreakdown(interviews)
    }
    const recs = buildRecommendations(interviews, overviewData)
    const recent = formatRecentInterviews(interviews, 8)
    res.json({ overview: overviewData, ...chartData, recommendations: recs, recentInterviews: recent })
  }catch(e){
    next(e)
  }
}

module.exports = { overview, charts, recommendations, recentInterviews, summary, stats }
