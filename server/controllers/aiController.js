const Interview = require('../models/Interview')
const { generate } = require('../services/interviewGenerator')
const { evaluateCandidateAnswer, evaluateInterview } = require('../services/geminiService')
const { getPreviousQuestionsForUser } = require('../services/interviewHistoryService')

async function generateQuestions(req,res,next){
  try{
    const userId = req.user && req.user._id
    const config = req.body.config || req.body || {}
    const previousQuestions = userId ? await getPreviousQuestionsForUser(userId) : []

    const gen = await generate({ userId, config, previousQuestions })

    const iv = await Interview.create({
      user: userId,
      role: config.role,
      interviewType: config.type || config.interviewType,
      difficulty: config.difficulty,
      duration: config.duration,
      selectedSkills: config.selectedSkills || config.skills || [],
      status: 'InProgress',
      resumeAnalysis: gen.resumeAnalysis,
      generatedQuestions: gen.questions
    })

    return res.json({ resumeAnalysis: gen.resumeAnalysis, questions: gen.questions, interviewId: iv._id })
  }catch(e){ next(e) }
}

async function evaluateAnswer(req,res,next){
  try{
    const { question, answer, role, difficulty, expectedTopics } = req.body
    if(!question) {
      return res.status(400).json({ error: 'question is required' })
    }

    const normalizedAnswer = String(answer ?? '').trim()
    const evaluation = await evaluateCandidateAnswer({
      question,
      answer: normalizedAnswer,
      role: role || 'Software Engineer',
      difficulty: difficulty || 'medium',
      expectedTopics: expectedTopics || []
    })

    return res.json({
      score: Number.isFinite(Number(evaluation?.score)) ? Number(evaluation.score) : 0,
      feedback: String(evaluation?.feedback || 'No feedback returned by Gemini.'),
      fallbackUsed: Boolean(evaluation?.fallbackUsed)
    })
  }catch(e){ next(e) }
}

async function finalReport(req,res,next){
  try{
    const { answers, role, interviewId } = req.body

    // Build questions array for Gemini: each item should include questionId, question, answer, expectedTopics
    const questions = Object.values(answers || {}).map((item) => ({
      questionId: item?.question?.id || item?.questionId || item?.id || '',
      question: item?.question?.question || item?.question?.text || item?.question || '',
      answer: item?.answer || '',
      expectedTopics: item?.question?.expectedTopics || item?.expectedTopics || []
    }))

    if(!questions.length) return res.status(400).json({ error: 'answers are required' })

    // Call Gemini to get the strict JSON schema
    const report = await evaluateInterview({ role: role || 'Software Engineer', questions })

    const questionLookup = new Map(
      questions.map((item) => [item.questionId || item.id || '', item])
    )

    const normalizedQuestions = Array.isArray(report?.questions)
      ? report.questions.map((item) => {
          const original = questionLookup.get(item.questionId || '') || {}
          return {
            questionId: item.questionId || original.questionId || original.id || '',
            question: original.question || '',
            answer: original.answer || '',
            score: Number.isFinite(Number(item?.score)) ? Number(item.score) : 0,
            feedback: String(item?.feedback || 'No feedback returned by Gemini.')
          }
        })
      : []

    const normalizedReport = {
      ...report,
      strengths: Array.isArray(report?.strengths) ? report.strengths : [],
      improvements: Array.isArray(report?.improvements) ? report.improvements : [],
      questions: normalizedQuestions,
      fallbackUsed: Boolean(report?.fallbackUsed),
      geminiModel: report?.geminiModel || null
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('SAVED INTERVIEW:', { interviewId, questionsCount: normalizedQuestions.length })
    }
    
    // Save report to interview if interviewId provided
    if(interviewId){
      await Interview.findByIdAndUpdate(interviewId, {
        status: 'Completed',
        completedAt: new Date(),
        geminiReport: normalizedReport,
        overallScore: normalizedReport.overallScore,
        totalScore: normalizedReport.overallScore,
        score: normalizedReport.overallScore,
        strengths: normalizedReport.strengths,
        improvements: normalizedReport.improvements,
        questions: normalizedReport.questions
      })
    }
    
    return res.json(normalizedReport)
  }catch(e){ next(e) }
}

module.exports = { generateQuestions, evaluateAnswer, finalReport }
