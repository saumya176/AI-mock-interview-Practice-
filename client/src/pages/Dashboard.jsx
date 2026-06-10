import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaArrowRight, FaBrain, FaChartBar, FaClipboardList, FaLayerGroup } from 'react-icons/fa'
import Card from '../components/ui/Card'
import { fetchDashboardSummary } from '../services/dashboard'
import { useInterview } from '../context/InterviewContext'
import { formatDate } from '../utils/format'

const initialSummary = {
  totalInterviews: 0,
  completedInterviews: 0,
  averageScore: 0,
  highestScore: 0,
  rolesExplored: 0,
  skillsPracticed: 0,
  mostPracticedRole: '',
  mostPracticedSkill: '',
  recentInterviews: [],
  interviewsThisWeek: 0,
  interviewsThisMonth: 0,
  difficultyBreakdown: { easy: 0, medium: 0, hard: 0 },
  topSkills: []
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { session, questions } = useInterview()
  const [summary, setSummary] = useState(initialSummary)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const canContinueInterview = Boolean(session?.config && questions.length > 0)

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      setLoading(true)
      setError('')

      try {
        const response = await fetchDashboardSummary()

        if (!active) return

        setSummary(response.data || initialSummary)
      } catch (err) {
        console.error('Dashboard load failed', err)
        if (active) {
          setError('Unable to load dashboard data. Please try again later.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDashboard()
    return () => { active = false }
  }, [])

  const hasInterviews = summary.totalInterviews > 0
  const totalDifficulty = Object.values(summary.difficultyBreakdown || {}).reduce((sum, value) => sum + Number(value || 0), 0)
  const difficultyBars = [
    { label: 'Easy', value: summary.difficultyBreakdown?.easy || 0, color: 'bg-emerald-500' },
    { label: 'Medium', value: summary.difficultyBreakdown?.medium || 0, color: 'bg-amber-500' },
    { label: 'Hard', value: summary.difficultyBreakdown?.hard || 0, color: 'bg-rose-500' }
  ]

  const overviewCards = useMemo(() => [
    { label: 'Total Interviews', value: summary.totalInterviews, detail: 'Completed sessions', icon: <FaClipboardList /> },
    { label: 'Average Score', value: `${summary.averageScore ?? 0}%`, detail: 'Across all sessions', icon: <FaChartBar /> },
    { label: 'Highest Score', value: `${summary.highestScore ?? 0}%`, detail: 'Your best result', icon: <FaBrain /> },
    { label: 'Most Practiced Role', value: summary.mostPracticedRole || '—', detail: 'Top role in your history', icon: <FaLayerGroup /> }
  ], [summary])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse rounded-[32px] bg-slate-200/70 p-8 shadow-sm dark:bg-slate-700/40" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="animate-pulse rounded-3xl bg-slate-200/70 p-8 dark:bg-slate-700/40" />
          ))}
        </div>
        <div className="animate-pulse rounded-3xl bg-slate-200/70 p-10 shadow-sm dark:bg-slate-700/40" />
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <section className="rounded-[32px] border border-orange-100 bg-gradient-to-r from-orange-50 via-white to-slate-50 p-6 shadow-lg transition dark:border-orange-900/30 dark:from-orange-950/10 dark:via-slate-950/10 dark:to-slate-900">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.35em] text-orange-600">Interview Practice</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">Interview Practice Dashboard</h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">Track your interview preparation journey with real MongoDB history, not AI placeholders.</p>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-800/30 dark:bg-red-950/20 dark:text-red-200">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {overviewCards.map((card) => (
          <Card key={card.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-semibold">{card.label}</p>
              <p className="text-4xl font-semibold text-orange-600">{card.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{card.detail}</p>
            </div>
          </Card>
        ))}
      </section>

      {!hasInterviews ? (
        <Card className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-lg font-semibold text-slate-900 dark:text-white">No interview history yet</p>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Complete a mock session to start tracking real progress.</p>
          <button
            onClick={() => navigate('/setup')}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-orange-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Start Interview
          </button>
        </Card>
      ) : (
        <>
          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.35em] text-orange-600">Practice Overview</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Placement readiness at a glance</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-orange-50 p-5 dark:bg-orange-950/20">
                  <p className="text-sm text-slate-500 dark:text-slate-300">Interviews Completed</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{summary.completedInterviews}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-800/70">
                  <p className="text-sm text-slate-500 dark:text-slate-300">This Month</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{summary.interviewsThisMonth}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-800/70">
                  <p className="text-sm text-slate-500 dark:text-slate-300">This Week</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{summary.interviewsThisWeek}</p>
                </div>
                <div className="rounded-3xl bg-orange-50 p-5 dark:bg-orange-950/20">
                  <p className="text-sm text-slate-500 dark:text-slate-300">Most Practiced Skill</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">{summary.mostPracticedSkill || 'Not enough data yet'}</p>
                </div>
              </div>
            </Card>

            <Card className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.35em] text-orange-600">Practice Distribution</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Difficulty mix</h2>
              <div className="mt-6 space-y-4">
                {difficultyBars.map((item) => {
                  const width = totalDifficulty ? Math.max(6, (item.value / totalDifficulty) * 100) : 0
                  return (
                    <div key={item.label}>
                      <div className="mb-1 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                        <span>{item.label}</span>
                        <span>{item.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <Card className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.35em] text-orange-600">Top Focus Areas</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Most practiced skill and role</h2>
              <div className="mt-6 space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                  <p className="text-sm text-slate-500 dark:text-slate-300">Most Practiced Skill</p>
                  <p className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">{summary.mostPracticedSkill || 'Not enough data yet'}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                  <p className="text-sm text-slate-500 dark:text-slate-300">Most Practiced Role</p>
                  <p className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">{summary.mostPracticedRole || 'Not enough data yet'}</p>
                </div>
              </div>
            </Card>

            <Card className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.35em] text-orange-600">Top 5 Skills</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Skill badges</h2>
              <div className="mt-6 flex flex-wrap gap-3">
                {(summary.topSkills || []).length ? summary.topSkills.map((skill) => (
                  <span key={skill} className="rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-700 dark:bg-orange-950/30 dark:text-orange-200">{skill}</span>
                )) : <p className="text-sm text-slate-500 dark:text-slate-300">No skills recorded yet.</p>}
              </div>
            </Card>
          </section>

          <section className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-orange-600">Recent Interviews</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Latest 5 interviews</h2>
              </div>
              <button onClick={() => navigate('/history')} className="inline-flex items-center gap-2 text-sm font-medium text-orange-600 transition hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300">View all history <FaArrowRight className="h-3 w-3" /></button>
            </div>
            <div className="grid gap-4">
              {(summary.recentInterviews || []).map((item) => (
                <Card key={item.id || item._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:border-orange-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{item.role || 'Interview'}</h3>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{item.type || 'General'}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                        Difficulty: {item.difficulty || 'medium'} • {formatDate(item.date || item.completedAt || item.createdAt)}
                        {item.overallScore != null ? ` • Score: ${item.overallScore}%` : ''}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">{item.status || 'Completed'}</span>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <Card className="rounded-3xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-8 text-center shadow-sm dark:border-orange-800/30 dark:from-orange-950/20 dark:to-amber-950/20">
            <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Quick Actions</h3>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Continue practicing with a fresh session or review your history.</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button onClick={() => navigate('/setup')} className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600">Start New Interview</button>
              <button onClick={() => navigate('/history')} className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:border-orange-300 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">View Interview History</button>
              {canContinueInterview && (
                <button onClick={() => navigate('/interview')} className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:border-orange-300 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">Continue Practice</button>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
