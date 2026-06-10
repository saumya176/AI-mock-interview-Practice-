import React from 'react'

export default function Modal({ open, onClose, children }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="relative bg-white rounded-[2rem] p-6 w-full max-w-2xl max-h-[calc(100vh-4rem)] overflow-y-auto border border-slate-200 shadow-2xl shadow-slate-200/40"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          aria-label="Close modal"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  )
}
