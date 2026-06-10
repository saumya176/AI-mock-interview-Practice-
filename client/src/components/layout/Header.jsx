import React, {useState} from 'react'
import { FaMoon, FaSun, FaChevronDown } from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

export default function Header(){
  const { user, signOut } = useAuth()
  const { darkMode, toggleTheme } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 bg-white/90 px-6 py-4 shadow-sm shadow-slate-200/80 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/90">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Live AI interview experience</p>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Professional placement intelligence</h2>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={toggleTheme} className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 transition">
          {darkMode ? <FaSun className="text-amber-400" /> : <FaMoon />}
        </button>
        <div className="relative">
          <button onClick={()=>setOpen(!open)} className="flex items-center gap-3 rounded-2xl bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-rose-500 via-orange-400 to-amber-300 flex items-center justify-center text-white font-bold">{user?.name?.[0] || 'A'}</div>
            <div className="text-left">
              <p className="text-xs text-slate-500 dark:text-slate-400">Signed in as</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.name || 'Candidate'}</p>
            </div>
            <FaChevronDown className="text-slate-500" />
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-56 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-2xl shadow-slate-300/40 z-30">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">Account</p>
              <button onClick={signOut} className="w-full rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-700 hover:bg-rose-500/15 transition">Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
