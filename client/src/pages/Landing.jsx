import React from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'

export default function Landing(){
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,113,133,0.16),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(250,204,21,0.16),_transparent_24%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:px-10">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between py-4">
          <div className="flex items-center gap-3 text-slate-900">
            <div className="rounded-2xl bg-gradient-to-br from-rose-500 via-orange-400 to-amber-300 p-3 shadow-lg shadow-rose-200/40">AI</div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-rose-500">AI Mock</p>
              <h1 className="text-lg font-semibold">Interview SaaS</h1>
            </div>
          </div>
          <Link to="/login" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm text-slate-700 transition hover:bg-slate-100">Sign In</Link>
        </header>
        <main className="grid flex-1 items-center gap-12 lg:grid-cols-[1.2fr_0.9fr]">
          <div className="space-y-8">
            <div className="max-w-xl space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-indigo-500">Premium AI Interview Platform</p>
              <h2 className="text-5xl font-semibold leading-tight">Prepare like a professional with adaptive AI interview coaching.</h2>
              <p className="text-xl text-slate-600">Practice role-specific questions, review AI-powered feedback, and improve faster with analytics designed for placement readiness.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button as={Link} to="/login" className="min-w-[180px]">Start practicing</Button>
              <Button as={Link} to="/login" className="min-w-[180px] bg-slate-900 text-white hover:bg-slate-800">View demo</Button>
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60">
            <div className="grid gap-4">
              <div className="rounded-[1.75rem] bg-gradient-to-br from-rose-500 via-orange-400 to-amber-300 p-6 text-white shadow-lg shadow-rose-200/40">
                <p className="text-sm uppercase tracking-[0.2em] text-indigo-200/90">AI Interview Funnel</p>
                <h3 className="mt-4 text-3xl font-semibold">Analyze strengths, fix weak areas, and build confidence.</h3>
              </div>
              <div className="rounded-[1.75rem] bg-slate-50 p-6 border border-slate-200">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-white p-4 shadow-sm border border-slate-200">
                    <p className="text-sm text-slate-500">Interviews Completed</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">24</p>
                  </div>
                  <div className="rounded-3xl bg-white p-4 shadow-sm border border-slate-200">
                    <p className="text-sm text-slate-500">Avg. Score</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">88%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
