import React from 'react'

export default function MicButton({recording, onStart, onStop}){
  return (
    <button onClick={recording? onStop: onStart} className="relative w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-red-600 to-pink-600 hover:scale-105 transform transition">
      <div className={"absolute inset-0 rounded-full "+(recording? 'animate-pulse bg-red-500/30':'bg-transparent')}></div>
      <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2a1 1 0 00-1 1v6a1 1 0 002 0V3a1 1 0 00-1-1zM5 9a5 5 0 0010 0h-2a3 3 0 01-6 0H5z" />
      </svg>
      {recording && <span className="absolute -bottom-3 text-xs text-red-400">Recording</span>}
    </button>
  )
}
