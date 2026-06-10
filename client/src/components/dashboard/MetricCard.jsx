import React from 'react'
import { motion } from 'framer-motion'

export default function MetricCard({ title, value, description, trend, icon, className = '' }){
  const trendText = typeof trend === 'number' ? `${trend > 0 ? '+' : ''}${trend}%` : trend
  const trendColor = typeof trend === 'number' ? (trend >= 0 ? 'text-emerald-600' : 'text-rose-500') : 'text-slate-500'

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{title}</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">{value}</p>
        </div>
        {icon && <div className="text-orange-500 text-3xl">{icon}</div>}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 text-sm text-slate-600">
        <span>{description}</span>
        {trendText && <span className={trendColor}>{trendText}</span>}
      </div>
    </motion.div>
  )
}
