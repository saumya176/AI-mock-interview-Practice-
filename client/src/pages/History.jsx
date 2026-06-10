import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { FaSearch, FaArrowLeft, FaArrowRight, FaDownload } from 'react-icons/fa'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import { deleteInterview, fetchInterviewDetail, fetchInterviewHistory } from '../services/interviews'
import { formatDate, formatQuestionScore } from '../utils/format'
import { pruneInvalidLocalInterviews } from '../utils/interviewStorage'

const PAGE_LIMIT = 12

const statusClass = (score) => {
  if (score >= 85) return 'bg-emerald-100 text-emerald-700'
  if (score >= 70) return 'bg-amber-100 text-amber-700'
  return 'bg-rose-100 text-rose-700'
}

function formatMinutes(minutes) {
  if (minutes == null) return '—'
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const remainder = minutes % 60
    return `${hours}h ${remainder}m`
  }
  return `${minutes} mins`
}

export default function History() {
  const [history, setHistory] = useState([])
  const [summary, setSummary] = useState({ totalInterviews: 0, averageScore: 0, highestScore: 0, totalPracticeMinutes: 0 })
  const [meta, setMeta] = useState({ page: 1, limit: PAGE_LIMIT, totalPages: 1, total: 0 })
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [selectedInterview, setSelectedInterview] = useState(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 250)
    return () => window.clearTimeout(timer)
  }, [search])

  const loadHistory = useCallback(async () => {
    setLoading(true)
    try {
      pruneInvalidLocalInterviews()
      const res = await fetchInterviewHistory({ page, limit: PAGE_LIMIT, search: debouncedSearch })
      const payload = res.data || {}
      const serverItems = Array.isArray(payload.items) ? payload.items : []

      setHistory(serverItems)
      setMeta({
        page: payload.page || 1,
        limit: payload.limit || PAGE_LIMIT,
        totalPages: payload.totalPages || 1,
        total: payload.total ?? 0
      })

      const serverSummary = payload.summary || {}
      setSummary({
        totalInterviews: serverSummary.totalInterviews ?? payload.total ?? 0,
        averageScore: Math.round(serverSummary.averageScore ?? 0),
        highestScore: Math.round(serverSummary.highestScore ?? 0),
        totalPracticeMinutes: serverSummary.totalPracticeMinutes || 0
      })
    } catch (e) {
      setHistory([])
      setMeta({ page: 1, limit: PAGE_LIMIT, totalPages: 1, total: 0 })
      setSummary({ totalInterviews: 0, averageScore: 0, highestScore: 0, totalPracticeMinutes: 0 })
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const openInterview = async (id) => {
    setDetailLoading(true)
    try {
      const res = await fetchInterviewDetail(id)
      setSelectedInterview(res.data)
    } catch (e) {
      setSelectedInterview(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const clearSearch = () => {
    setSearch('')
    setDebouncedSearch('')
    setPage(1)
  }

  const handleDeleteInterview = async (id) => {
    const confirmed = window.confirm('Delete this interview from your history?')
    if (!confirmed) return

    setDeletingId(id)
    try {
      await deleteInterview(id)
      if (selectedInterview && (selectedInterview._id === id || selectedInterview.id === id)) {
        setSelectedInterview(null)
      }
      await loadHistory()
    } catch (e) {
      console.error('Failed to delete interview', e)
    } finally {
      setDeletingId(null)
    }
  }

  const handleDownloadSummary = () => {
    const summaryData = history.map(item => ({
      Role: item.role || 'Interview',
      Type: item.interviewType || 'General',
      Difficulty: item.difficulty || 'Medium',
      Skills: (item.selectedSkills || item.skills || []).join(', ') || 'N/A',
      Score: `${item.overallScore ?? 'N/A'}%`,
      Date: formatDate(item.completedAt || item.createdAt),
      Status: item.status || 'Completed'
    }))

    const csvContent = [
      ['Role', 'Type', 'Difficulty', 'Skills', 'Score', 'Date', 'Status'],
      ...summaryData.map(row => [row.Role, row.Type, row.Difficulty, row.Skills, row.Score, row.Date, row.Status])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `interview-summary-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const summaryCards = useMemo(() => [
    { label: 'Total Interviews', value: summary.totalInterviews, description: 'Completed sessions' },
    { label: 'Average Score', value: `${summary.averageScore ?? 0}%`, description: 'Average performance' },
    { label: 'Highest Score', value: `${summary.highestScore ?? 0}%`, description: 'Top result' }
  ], [summary])

  const detailQuestions = useMemo(() => {
    if (!selectedInterview) return []
    if (Array.isArray(selectedInterview.geminiReport?.questions) && selectedInterview.geminiReport.questions.length) {
      return selectedInterview.geminiReport.questions
    }
    if (Array.isArray(selectedInterview.questions) && selectedInterview.questions.length) {
      return selectedInterview.questions
    }
    return []
  }, [selectedInterview])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Interview archive</p>
          <h1 className="text-3xl font-semibold text-slate-900">Interview History</h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-96">
            <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search role, type, skill..."
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            />
          </div>
          <button
            type="button"
            onClick={clearSearch}
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <Card key={item.label} className="bg-slate-50 border-slate-200 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{item.label}</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{item.value}</p>
            <p className="mt-2 text-sm text-slate-500">{item.description}</p>
          </Card>
        ))}
      </div>

      <Card className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Previous interviews</p>
            <h2 className="text-xl font-semibold text-slate-900">All recorded sessions</h2>
          </div>
          <button
            type="button"
            onClick={() => handleDownloadSummary()}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <FaDownload /> Download Summary
          </button>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-2">
          <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Difficulty</th>
                <th className="px-4 py-3 text-left">Skills</th>
                <th className="px-4 py-3 text-left">Score</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr><td colSpan="9" className="p-8 text-center text-slate-500">Loading interviews...</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan="9" className="p-8 text-center text-slate-500">No interviews recorded yet.</td></tr>
              ) : history.map((item) => (
                <tr key={item._id || item.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-4 font-medium text-slate-900">{item.role || 'Interview'}</td>
                  <td className="px-4 py-4 text-slate-700">{item.interviewType || 'General'}</td>
                  <td className="px-4 py-4 text-slate-700">{item.difficulty || 'Medium'}</td>
                  <td className="px-4 py-4 text-slate-700 max-w-[180px] truncate">{(item.selectedSkills || item.skills || []).slice(0, 3).join(', ') || 'N/A'}</td>
                  <td className="px-4 py-4 font-semibold text-emerald-600">{item.overallScore != null ? `${item.overallScore}%` : 'N/A'}</td>
                  <td className="px-4 py-4 text-slate-700">{formatDate(item.completedAt || item.createdAt)}</td>
                  <td className="px-4 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(item.overallScore ?? 0)}`}>{item.status || 'Completed'}</span></td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => openInterview(item._id || item.id)} className="rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-400">View Details</button>
                      <button
                        type="button"
                        onClick={() => handleDeleteInterview(item._id || item.id)}
                        disabled={deletingId === (item._id || item.id)}
                        className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === (item._id || item.id) ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-2 py-3 text-sm text-slate-600">
          <span>{meta.total} interviews found</span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage(Math.max(1, page - 1))} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 transition disabled:cursor-not-allowed disabled:opacity-50">
              <FaArrowLeft /> Prev
            </button>
            <button type="button" disabled={page >= meta.totalPages} onClick={() => setPage(Math.min(meta.totalPages, page + 1))} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 transition disabled:cursor-not-allowed disabled:opacity-50">
              Next <FaArrowRight />
            </button>
          </div>
        </div>
      </Card>

      <Modal open={Boolean(selectedInterview)} onClose={() => setSelectedInterview(null)}>
        {detailLoading ? (
          <div className="py-20 text-center text-slate-500">Loading interview details…</div>
        ) : selectedInterview ? (
          <div className="space-y-6">
            {/* Header with Overall Score */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{selectedInterview.role || 'Interview session'}</p>
                <h2 className="text-2xl font-semibold text-slate-900">{selectedInterview.interviewType || 'Mock interview'}</h2>
              </div>
              <div className="space-y-2 rounded-3xl bg-gradient-to-br from-emerald-50 to-blue-50 p-4 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm uppercase font-semibold text-emerald-700">Overall Score</span>
                  <span className="text-4xl font-bold text-emerald-600">{(selectedInterview.geminiReport?.overallScore ?? selectedInterview.overallScore ?? selectedInterview.totalScore ?? selectedInterview.score) != null ? `${selectedInterview.geminiReport?.overallScore ?? selectedInterview.overallScore ?? selectedInterview.totalScore ?? selectedInterview.score}%` : 'N/A'}</span>
                </div>
                <p className="text-xs text-slate-600">{formatDate(selectedInterview.completedAt || selectedInterview.createdAt)}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Questions & Feedback</h3>
              <div className="space-y-4">
                {detailQuestions.length > 0 ? (
                  detailQuestions.map((q, index) => {
                    const questionText = selectedInterview.generatedQuestions?.find(gq => gq.id === q.questionId)?.question || q.question || `Question ${index + 1}`
                    return (
                      <div key={q.questionId || index} className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-orange-300 transition">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-semibold text-slate-500 uppercase">Q{index + 1}</span>
                              <span className="text-2xl font-bold text-emerald-600">{q.score != null ? formatQuestionScore(q.score) : 'N/A'}</span>
                            </div>
                            <p className="font-semibold text-slate-900 mb-3">{questionText}</p>
                          </div>
                        </div>
                        
                        {/* Answer */}
                        <div className="mt-3 bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-500 font-semibold">Your answer</p>
                          <p className="mt-1 text-sm text-slate-700 leading-relaxed">{q.answer || 'No answer provided'}</p>
                        </div>

                        {/* Feedback */}
                        <div className="mt-3 bg-blue-50 rounded-lg p-3 border border-blue-100">
                          <p className="text-xs uppercase tracking-[0.16em] text-blue-700 font-semibold">Feedback</p>
                          <p className="mt-1 text-sm text-blue-900 leading-relaxed">{q.feedback || 'No feedback available.'}</p>
                        </div>

                        {/* Expected Points */}
                        {q.expectedPoints && q.expectedPoints.length > 0 && (
                          <div className="mt-3 bg-amber-50 rounded-lg p-3 border border-amber-100">
                            <p className="text-xs uppercase tracking-[0.16em] text-amber-700 font-semibold mb-2">Expected points</p>
                            <ul className="space-y-1">
                              {q.expectedPoints.map((point, pi) => (
                                <li key={pi} className="text-sm text-amber-900">• {point}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    No detailed question feedback available for this interview.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
