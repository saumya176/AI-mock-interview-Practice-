import React from 'react'

export default function Button({as: Component = 'button', children, variant = 'primary', className = '', disabled = false, ...props}) {
  const baseClass = 'inline-flex items-center justify-center px-4 py-2 rounded-2xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 '
  const variants = {
    primary: 'bg-gradient-to-r from-fuchsia-600 via-orange-500 to-amber-400 text-white shadow-lg shadow-orange-200/30 hover:from-fuchsia-500 hover:via-orange-400 hover:to-amber-300',
    outline: 'bg-white border border-slate-200 text-slate-900 hover:border-slate-300 hover:bg-slate-50',
    secondary: 'bg-slate-900 text-white hover:bg-slate-800'
  }
  const disabledClass = disabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''

  return (
    <Component
      className={`${baseClass} ${variants[variant] || variants.primary} ${disabledClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </Component>
  )
}
