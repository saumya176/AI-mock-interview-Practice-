import React from 'react'

export default function VoiceControls({voices, voice, setVoice, rate, setRate, speaking, paused, speak, pause, resume, cancel}){
  return (
    <div className="p-3 bg-slate-50 rounded-3xl border border-slate-200 flex flex-col gap-3 md:flex-row md:items-center">
      <select value={voice?voice.name:''} onChange={(e)=>{
        const v = voices.find(x=>x.name===e.target.value)
        setVoice(v)
      }} className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-slate-900">
        {voices.map(v=> <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
      </select>
      <div className="flex items-center gap-2">
        <label className="text-sm text-slate-600">Speed</label>
        <input type="range" min="0.5" max="2" step="0.1" value={rate} onChange={(e)=>setRate(Number(e.target.value))} className="h-2 w-28 accent-rose-500" />
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {!speaking && <button onClick={()=>speak('') } className="px-3 py-1 bg-slate-900 text-white rounded-2xl">Play</button>}
        {speaking && !paused && <button onClick={pause} className="px-3 py-1 bg-slate-900 text-white rounded-2xl">Pause</button>}
        {speaking && paused && <button onClick={resume} className="px-3 py-1 bg-slate-900 text-white rounded-2xl">Resume</button>}
        <button onClick={cancel} className="px-3 py-1 bg-rose-500 text-white rounded-2xl">Stop</button>
      </div>
    </div>
  )
}
