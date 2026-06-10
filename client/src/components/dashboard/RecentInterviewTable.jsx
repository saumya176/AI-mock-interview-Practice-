import React from 'react'

export default function RecentInterviewTable({ interviews, onView }){
  if(!interviews.length){
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
        No recent interviews yet. Start an AI session to populate this feed.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-6 gap-4 bg-slate-100 px-6 py-4 text-xs uppercase tracking-[0.24em] text-slate-500">
        <span className="col-span-2">Role</span>
        <span>Company</span>
        <span>Score</span>
        <span>Date</span>
        <span>Weakest Area</span>
      </div>
      <div className="divide-y divide-slate-200">
        {interviews.map((interview)=> (
          <div key={interview.id || interview._id} className="grid grid-cols-6 gap-4 px-6 py-5 items-center">
            <div className="col-span-2 space-y-1">
              <p className="font-semibold text-slate-900 truncate">{interview.role}</p>
              <p className="text-sm text-slate-500">{interview.type}</p>
            </div>
            <div>
              <p className="text-slate-700">{interview.companyTarget}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">{interview.score}%</p>
            </div>
            <div>
              <p className="text-slate-600">{new Date(interview.date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-slate-700">{interview.weakestArea}</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={()=> onView(interview)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 transition hover:bg-orange-50 hover:text-orange-600"
              >
                Quick view
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
