const mongoose = require('mongoose')
const Interview = require('../models/Interview')
const Answer = require('../models/Answer')
const {
  getInterviewHistory,
  getInterviewById,
  getInterviewAnalytics
} = require('../services/interviewHistoryService')

async function createInterview(req,res,next){
  try{
    const payload = {
      user: req.user._id,
      interviewId: req.body.interviewId || req.body._id,
      role: req.body.role,
      interviewType: req.body.interviewType || req.body.type,
      difficulty: req.body.difficulty,
      selectedSkills: req.body.selectedSkills || req.body.skills || [],
      duration: req.body.duration,
      totalScore: req.body.totalScore ?? req.body.overallScore ?? req.body.score,
      overallScore: req.body.overallScore ?? req.body.totalScore ?? req.body.score,
      score: req.body.score ?? req.body.overallScore ?? req.body.totalScore,
      technicalScore: req.body.technicalScore,
      communicationScore: req.body.communicationScore,
      confidenceScore: req.body.confidenceScore,
      status: req.body.status || 'Completed',
      completedAt: req.body.completedAt ? new Date(req.body.completedAt) : req.body.createdAt ? new Date(req.body.createdAt) : new Date(),
      strengths: req.body.strengths || req.body.strongAreas || [],
      weaknesses: req.body.weaknesses || req.body.weakAreas || [],
      improvementSuggestions: req.body.improvementSuggestions || [],
      questions: req.body.questions || [],
      feedback: req.body.feedback,
      transcript: req.body.transcript,
      config: req.body.config,
      companyTarget: req.body.companyTarget,
      resumeAnalysis: req.body.resumeAnalysis,
      generatedQuestions: req.body.generatedQuestions
    }

    const query = { user: req.user._id }
    if (req.body._id) {
      query._id = req.body._id
    } else if (payload.interviewId && mongoose.Types.ObjectId.isValid(payload.interviewId)) {
      query._id = payload.interviewId
    } else if (payload.interviewId) {
      query.interviewId = payload.interviewId
    }

    const iv = await Interview.findOneAndUpdate(query, payload, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    })

    res.json(iv)
  }catch(e){next(e)}
}

async function saveAnswer(req,res,next){
  try{
    const ans = await Answer.create({ interview: req.params.id, ...req.body })
    res.json(ans)
  }catch(e){next(e)}
}

async function updateInterview(req,res,next){
  try{
    const updates = {}
    if(req.body.score != null) updates.score = req.body.score
    if(req.body.totalScore != null) updates.totalScore = req.body.totalScore
    if(req.body.overallScore != null) updates.overallScore = req.body.overallScore
    if(req.body.overallScore != null || req.body.totalScore != null) updates.score = req.body.score ?? req.body.overallScore ?? req.body.totalScore
    if(req.body.technicalScore != null) updates.technicalScore = req.body.technicalScore
    if(req.body.communicationScore != null) updates.communicationScore = req.body.communicationScore
    if(req.body.confidenceScore != null) updates.confidenceScore = req.body.confidenceScore
    if(req.body.status != null) updates.status = req.body.status
    if(req.body.completedAt != null) updates.completedAt = new Date(req.body.completedAt)
    if(req.body.weak != null) updates.weak = req.body.weak
    if(req.body.feedback != null) updates.feedback = req.body.feedback
    if(req.body.questions != null) updates.questions = req.body.questions
    if(req.body.strengths != null) updates.strengths = req.body.strengths
    if(req.body.weaknesses != null) updates.weaknesses = req.body.weaknesses
    if(req.body.improvementSuggestions != null) updates.improvementSuggestions = req.body.improvementSuggestions
    if(req.body.selectedSkills != null) updates.selectedSkills = req.body.selectedSkills
    if(req.body.difficulty != null) updates.difficulty = req.body.difficulty
    if(req.body.role != null) updates.role = req.body.role
    if(req.body.interviewType != null) updates.interviewType = req.body.interviewType
    if(req.body.duration != null) updates.duration = req.body.duration
    if(req.body.companyTarget != null) updates.companyTarget = req.body.companyTarget
    if(req.body.resumeAnalysis != null) updates.resumeAnalysis = req.body.resumeAnalysis
    if(req.body.generatedQuestions != null) updates.generatedQuestions = req.body.generatedQuestions
    if(req.body.config != null) updates.config = req.body.config
    if(req.body.transcript != null) updates.transcript = req.body.transcript
    if(req.body.createdAt != null) updates.createdAt = new Date(req.body.createdAt)
    const iv = await Interview.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, updates, { new: true })
    if(!iv) return res.status(404).json({ message: 'Interview not found' })
    res.json(iv)
  }catch(e){next(e)}
}

async function history(req,res,next){
  try{
    const items = await getInterviewHistory(req.user._id, req.query)
    res.json(items)
  }catch(e){next(e)}
}

async function details(req,res,next){
  try{
    const interview = await getInterviewById(req.user._id, req.params.id)
    if(!interview) return res.status(404).json({ message: 'Interview not found' })
    res.json(interview)
  }catch(e){next(e)}
}

async function analytics(req,res,next){
  try{
    const stats = await getInterviewAnalytics(req.user._id, req.query)
    res.json(stats)
  }catch(e){next(e)}
}

async function deleteInterview(req,res,next){
  try{
    const interview = await Interview.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    if(!interview) return res.status(404).json({ message: 'Interview not found' })
    res.json({ success: true, id: req.params.id })
  }catch(e){next(e)}
}

module.exports = { createInterview, saveAnswer, updateInterview, history, details, analytics, deleteInterview }
