import React, {useState} from 'react'
import { NavLink } from 'react-router-dom'
import {
  FaTachometerAlt,
  FaPlayCircle,
  FaHistory,
  FaRobot,
  FaClipboardList,
  FaSignOutAlt,
  FaBars
} from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  {label: 'Dashboard', to: '/dashboard', icon: FaTachometerAlt},
  {label: 'Start Interview', to: '/setup', icon: FaPlayCircle},
  {label: 'Interview History', to: '/history', icon: FaHistory},
  {label: 'Results', to: '/results', icon: FaClipboardList},
  {label: 'AI Feedback', to: '/feedback', icon: FaRobot}
]

export default function Sidebar(){
  const [collapsed, setCollapsed] = useState(false)
  const { signOut } = useAuth()
  return (
    <aside className={`z-20 transition-all duration-300 ${collapsed ? 'w-20' : 'w-72'} shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 shadow-sm`}>
      <div className="flex h-full flex-col py-6 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : ''}`}>
            <div className="rounded-2xl bg-gradient-to-br from-rose-500 via-orange-400 to-amber-300 p-3 text-white shadow-lg shadow-rose-200/40">
              <FaRobot />
            </div>
            {!collapsed && <div>
              <p className="text-xs uppercase text-slate-500 tracking-[0.24em]">AI Mock</p>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Interviewer</h1>
            </div>}
          </div>
          <button onClick={()=>setCollapsed(!collapsed)} className="text-slate-600 hover:text-slate-900 dark:text-slate-300 p-2 rounded-lg transition">
            <FaBars />
          </button>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map((item)=>(
            <NavLink
              key={item.to}
              to={item.to}
              className={({isActive}) =>
                `group flex items-center gap-4 rounded-2xl px-4 py-3 text-sm transition ${isActive ? 'bg-amber-100 text-slate-900 shadow-sm shadow-amber-200 dark:bg-amber-950/40 dark:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'}`
              }
            >
              <item.icon className="h-5 w-5" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
          <button onClick={signOut} className="flex items-center gap-3 w-full rounded-2xl px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-rose-700 dark:hover:bg-rose-950/30 transition">
            <FaSignOutAlt className="h-4 w-4" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}
