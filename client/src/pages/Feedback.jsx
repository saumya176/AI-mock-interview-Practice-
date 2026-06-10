import React from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/ui/Card'
import { FaLightbulb } from 'react-icons/fa'
import { useInterview } from '../context/InterviewContext'
import { formatOverallScore, formatQuestionScore, normalizeQuestionScore } from '../utils/format'
import Button from '../components/ui/Button'

function findQuestionReport(reportData, q) {
  return reportData?.questions?.find((item) =>
    item.questionId === q.id
    || item.questionId === q.text
    || item.questionId === (q.question || '')
    || item.question === q.text
    || item.question === q.question
  ) || null
}

export default function Feedback(){
  const { questions, answers, results } = useInterview()
  const reportData = results

  if (!reportData || !questions.length) {
    return (
      <div className="max-w-xl mx-auto text-center space-y-4 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">No feedback available yet</h1>
        <p className="text-slate-600">Complete an interview to see AI-generated feedback here. Results and feedback use the same evaluation.</p>
        <Button as={Link} to="/setup">Start Interview</Button>
      </div>
    )
  }

  const fallbackUsed = Boolean(reportData?.fallbackUsed)
  const strengthsToShow = Array.isArray(reportData?.strengths) ? reportData.strengths.filter(Boolean) : []
  const improvementsToShow = Array.isArray(reportData?.improvements) ? reportData.improvements.filter(Boolean) : []

  const feedbackCards = [
    {
      title: 'AI Overall Score',
      value: reportData?.overallScore != null ? formatOverallScore(reportData.overallScore, { asPercent: false }) : '—',
      description: 'Same score shown on the Results page.',
      icon: <FaLightbulb />
    },
    {
      title: 'Strengths',
      value: `${strengthsToShow.length}`,
      description: 'Top themes from your interview performance.',
      icon: <FaLightbulb />
    },
    {
      title: 'Improvement Areas',
      value: `${improvementsToShow.length}`,
      description: 'Specific areas to improve next time.',
      icon: <FaLightbulb />
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">AI Interview Feedback</p>
          <h1 className="text-3xl font-semibold text-slate-900">Feedback Hub</h1>
          {fallbackUsed ? (
            <p className="mt-2 text-sm text-amber-700">Gemini was unavailable — showing local evaluation. Use GEMINI_MODEL=gemini-2.5-flash-lite in server .env.</p>
          ) : (
            <p className="mt-2 text-sm text-emerald-700">
              AI evaluation from Gemini{reportData?.geminiModel ? ` (${reportData.geminiModel})` : ''} — synced with your Results page.
            </p>
          )}
        </div>
        <Button as={Link} to="/results" className="bg-slate-800 hover:bg-slate-900">View Results</Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {feedbackCards.map((item) => (
          <Card key={item.title} className="p-6 bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{item.title}</p>
                <p className="mt-3 text-4xl font-semibold text-slate-900">{item.value}</p>
              </div>
              <div className="rounded-2xl bg-orange-100 p-3 text-orange-600 text-2xl">{item.icon}</div>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-600">{item.description}</p>
          </Card>
        ))}
      </div>

      {(strengthsToShow.length > 0 || improvementsToShow.length > 0) && (
        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="p-6 bg-slate-50 border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Strengths</h2>
            <ul className="mt-3 list-disc list-inside text-slate-700 space-y-2">
              {strengthsToShow.map((item, i) => <li key={`strength-${i}`}>{item}</li>)}
            </ul>
          </Card>
          <Card className="p-6 bg-slate-50 border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Areas to Improve</h2>
            <ul className="mt-3 list-disc list-inside text-slate-700 space-y-2">
              {improvementsToShow.map((item, i) => <li key={`improve-${i}`}>{item}</li>)}
            </ul>
          </Card>
        </section>
      )}

      <section>
        <h2 className="font-semibold mb-2">Question-wise Feedback</h2>
        <div className="space-y-4">
          {questions.map((q) => {
            const questionReport = findQuestionReport(reportData, q)
            const questionText = q.question || q.text || questionReport?.question || 'Question text unavailable'
            const answerText = answers[q.id]?.text || questionReport?.answer || 'No answer provided'
            const scoreValue = normalizeQuestionScore(questionReport?.score ?? 0)
            const feedbackText = questionReport?.feedback || 'No feedback available.'

            return (
              <Card key={q.id} className="p-5 rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-orange-600">Question feedback</p>
                    <div className="mt-2 text-lg font-semibold text-slate-900">{questionText}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">Answer: {answerText || 'No answer provided'}</div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Score</p>
                    <div className="mt-2 text-2xl font-semibold text-slate-900">{formatQuestionScore(scoreValue)}</div>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{feedbackText}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
