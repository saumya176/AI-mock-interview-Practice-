import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useInterview } from '../context/InterviewContext'
import { saveInterview, updateInterview } from '../services/interviews'
import { saveLocalInterview } from '../utils/interviewStorage'
import { formatOverallScore, formatQuestionScore, normalizeOverallScore, normalizeQuestionScore } from '../utils/format'

export default function Results(){
  const { session, questions, answers, results } = useInterview()
  const [saved, setSaved] = useState(false)
  const reportData = results
  const fallbackUsed = Boolean(reportData?.fallbackUsed)

  const overallScore = reportData?.overallScore != null
    ? normalizeOverallScore(reportData.overallScore)
    : 0
  const reportQuestions = Array.isArray(reportData?.questions) ? reportData.questions : []
  const strengths = Array.isArray(reportData?.strengths) && reportData.strengths.length
    ? Array.from(new Set(reportData.strengths.map((item) => String(item).trim()).filter(Boolean)))
    : Array.isArray(reportData?.strongAreas) && reportData.strongAreas.length
      ? Array.from(new Set(reportData.strongAreas.map((item) => String(item).trim()).filter(Boolean)))
    : Array.isArray(results?.strongAreas) && results.strongAreas.length
      ? Array.from(new Set(results.strongAreas.map((item) => String(item).trim()).filter(Boolean)))
      : Array.isArray(reportQuestions.flatMap((item) => Array.isArray(item?.strengths) ? item.strengths : []).filter(Boolean)) && reportQuestions.flatMap((item) => Array.isArray(item?.strengths) ? item.strengths : []).filter(Boolean).length
        ? Array.from(new Set(reportQuestions.flatMap((item) => Array.isArray(item?.strengths) ? item.strengths : []).filter(Boolean).map((item) => String(item).trim())))
        : []
  const weaknesses = Array.isArray(reportData?.weaknesses) ? reportData.weaknesses : []
  const improvementSuggestions = Array.isArray(reportData?.improvements) ? reportData.improvements : Array.isArray(reportData?.suggestions) ? reportData.suggestions : []
  const weakestFocus = weaknesses[0] || 'N/A'

  useEffect(()=>{
    if(saved) return
    const saveInterviewRecord = async () => {
      const payload = {
        interviewId: session?.interviewId,
        role: session?.config?.role,
        interviewType: session?.config?.type || session?.config?.interviewType,
        difficulty: session?.config?.difficulty,
        selectedSkills: session?.config?.selectedSkills || [],
        duration: session?.config?.duration || Math.max(0, Math.round((Date.now() - (session?.startedAt || Date.now())) / 60000)),
        totalScore: overallScore,
        technicalScore: Number(reportData?.technicalScore ?? results?.technicalScore ?? 0),
        communicationScore: Number(reportData?.communicationScore ?? results?.communicationScore ?? 0),
        confidenceScore: Number(reportData?.confidenceScore ?? results?.confidenceScore ?? 0),
        completedAt: new Date().toISOString(),
        status: 'Completed',
        strengths,
        weaknesses,
        improvementSuggestions,
        questions: questions.map((q) => {
          const answer = answers[q.id] || {}
          const evaluation = answer.evaluation || {}
          const questionReport = reportQuestions.find((item) =>
            item.questionId === q.id ||
            item.questionId === q.text ||
            item.questionId === (q.question || '') ||
            item.question === q.text ||
            item.question === q.question ||
            item.question === (q.text || q.question || '')
          ) || null
          return {
            questionId: q.id,
            question: q.text || q.question || '',
            answer: answer.text || questionReport?.answer || '',
            score: Number(questionReport?.score ?? evaluation.score ?? 0),
            feedback: questionReport?.feedback || evaluation.feedback || '',
            expectedPoints: Array.isArray(questionReport?.expectedPoints) ? questionReport.expectedPoints : [],
            coveredPoints: Array.isArray(questionReport?.coveredPoints) ? questionReport.coveredPoints : Array.isArray(evaluation.coveredPoints) ? evaluation.coveredPoints : [],
            missedPoints: Array.isArray(questionReport?.missedPoints) ? questionReport.missedPoints : Array.isArray(evaluation.missedPoints) ? evaluation.missedPoints : [],
            strengths: Array.isArray(questionReport?.strengths) ? questionReport.strengths : Array.isArray(evaluation.strengths) ? evaluation.strengths : [],
            weaknesses: Array.isArray(questionReport?.weaknesses) ? questionReport.weaknesses : Array.isArray(evaluation.weaknesses) ? evaluation.weaknesses : []
          }
        }),
        feedback: {
          overall: overallScore,
          strengths,
          weaknesses
        },
        createdAt: session?.startedAt ? new Date(session.startedAt).toISOString() : new Date().toISOString(),
        transcript: ''
      }

      try{
        if(session?.interviewId){
          try {
            await updateInterview(session.interviewId, payload)
          } catch (updateError) {
            const res = await saveInterview({ ...payload, interviewId: session.interviewId })
            if(res?.data?._id){
              payload._id = res.data._id
              payload.id = res.data._id
              payload.createdAt = res.data.createdAt || payload.createdAt
            }
          }
        } else {
          const res = await saveInterview(payload)
          if(res?.data?._id){
            payload._id = res.data._id
            payload.id = res.data._id
            payload.createdAt = res.data.createdAt || payload.createdAt
          }
        }
      }catch(e){
        // ignore save failures while still showing results
      }finally{
        saveLocalInterview(payload)
        setSaved(true)
      }
    }
    saveInterviewRecord()
  }, [saved, session?.interviewId, overallScore, results, questions.length, weakestFocus, questions, session?.config, answers, session?.startedAt])

  if (!reportData || !questions.length) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <h1 className="text-2xl font-semibold">No results yet</h1>
        <p className="text-slate-600">Complete an interview to see your AI-evaluated results here.</p>
        <Button as={Link} to="/setup">Start Interview</Button>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h1 className="text-2xl font-semibold">Results</h1>
        <Button as={Link} to="/feedback" className="bg-slate-800 hover:bg-slate-900">View Feedback</Button>
      </div>
      {fallbackUsed ? (
        <p className="mb-4 text-sm text-amber-700">Gemini was unavailable — scores use local evaluation. Set GEMINI_MODEL=gemini-2.5-flash-lite in server .env and restart.</p>
      ) : (
        <p className="mb-4 text-sm text-emerald-700">
          Evaluated by Gemini{reportData?.geminiModel ? ` (${reportData.geminiModel})` : ''} — synced with Feedback page.
        </p>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-lg font-medium">Overall Score</h3>
          <div className="text-4xl font-bold mt-2">{formatOverallScore(overallScore)}</div>
        </Card>
        <Card>
          <h3 className="text-lg font-medium">Strengths</h3>
          <ul className="list-disc pl-5 mt-2 text-sm text-slate-700">
            {strengths.length > 0 ? strengths.map((s, index) => <li key={`${s}-${index}`}>{s}</li>) : <li>No strengths captured.</li>}
          </ul>
        </Card>
      </div>
      <section className="mt-6">
        <h2 className="font-semibold mb-2">Question-wise Feedback</h2>
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const questionText = q.text || q.question || q.prompt || q.title || 'Question text unavailable'
            const reportEntry = reportQuestions.find((item) =>
              item.questionId === q.id ||
              item.questionId === q.text ||
              item.questionId === (q.question || '') ||
              item.question === q.text ||
              item.question === q.question
            ) || null
            const answerText = answers[q.id]?.text || reportEntry?.answer || 'No answer provided'
            const scoreValue = normalizeQuestionScore(reportEntry?.score ?? answers[q.id]?.evaluation?.score)
            const feedbackText = reportEntry?.feedback || answers[q.id]?.evaluation?.feedback || ''
            const expectedPoints = Array.isArray(reportEntry?.expectedPoints) && reportEntry.expectedPoints.length
              ? reportEntry.expectedPoints
              : Array.isArray(answers[q.id]?.evaluation?.expectedPoints) && answers[q.id].evaluation.expectedPoints.length
                ? answers[q.id].evaluation.expectedPoints
                : Array.isArray(q.expectedTopics) && q.expectedTopics.length
                  ? q.expectedTopics
                  : []
            const coveredPoints = Array.isArray(reportEntry?.coveredPoints) && reportEntry.coveredPoints.length
              ? reportEntry.coveredPoints
              : Array.isArray(answers[q.id]?.evaluation?.coveredPoints) && answers[q.id].evaluation.coveredPoints.length
                ? answers[q.id].evaluation.coveredPoints
                : []
            const missedPoints = Array.isArray(reportEntry?.missedPoints) && reportEntry.missedPoints.length
              ? reportEntry.missedPoints
              : Array.isArray(answers[q.id]?.evaluation?.missedPoints) && answers[q.id].evaluation.missedPoints.length
                ? answers[q.id].evaluation.missedPoints
                : []

            return (
              <Card key={q.id} className="p-4">
                <div className="font-medium text-slate-900">{idx + 1}. {questionText}</div>
                <div className="mt-2 text-sm text-slate-700">Answer: {answerText}</div>
                <div className="mt-2 text-sm text-slate-700">
                  {scoreValue != null ? (
                    <>
                      <div className="font-semibold text-slate-900">Score: {formatQuestionScore(scoreValue)}</div>
                      <div className="text-slate-700 mt-1">{feedbackText || 'No feedback available.'}</div>
                      {coveredPoints.length > 0 ? (
                        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-emerald-700 font-semibold">✓ Covered Concepts</p>
                          <ul className="mt-2 list-disc pl-5 text-emerald-900 space-y-1">
                            {coveredPoints.map((point, pointIndex) => <li key={`${q.id}-covered-${pointIndex}`}>{point}</li>)}
                          </ul>
                        </div>
                      ) : null}
                      {missedPoints.length > 0 ? (
                        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-rose-700 font-semibold">✗ Missing Concepts</p>
                          <ul className="mt-2 list-disc pl-5 text-rose-900 space-y-1">
                            {missedPoints.map((point, pointIndex) => <li key={`${q.id}-missed-${pointIndex}`}>{point}</li>)}
                          </ul>
                        </div>
                      ) : null}
                      {expectedPoints.length > 0 ? (
                        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-amber-700 font-semibold">Expected Answer Topics</p>
                          <ul className="mt-2 list-disc pl-5 text-amber-900 space-y-1">
                            {expectedPoints.map((point, pointIndex) => <li key={`${q.id}-${pointIndex}`}>{point}</li>)}
                          </ul>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="text-slate-600">No evaluation available</div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
