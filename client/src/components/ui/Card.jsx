import React from 'react'

export default function Card({children, className=''}){
  return (
    <div className={"bg-white border border-slate-200 rounded-3xl p-6 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.18)] "+className}>
      {children}
    </div>
  )
}
