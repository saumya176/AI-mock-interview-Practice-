import React from 'react'
import { motion } from 'framer-motion'

export default function StatCard({title, value, delta, icon, className=''}){
  return (
    <motion.div
      initial={{ opacity:0, y:16 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.4 }}
      className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
        </div>
        {icon && <div className="text-rose-500 text-3xl">{icon}</div>}
      </div>
      {delta && <p className="mt-4 text-sm text-emerald-600">{delta}</p>}
    </motion.div>
  )
}
