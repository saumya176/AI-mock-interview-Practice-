import React from 'react'
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Loader from '../components/ui/Loader'

export default function Login(){
  const navigate = useNavigate()
  const location = useLocation()
  const {user, signInWithGoogle, loading} = useAuth()

  if(loading) return <div className="min-h-screen flex items-center justify-center"><Loader /></div>
  if(user) return <Navigate to="/dashboard" replace />

  async function handleGoogleSignIn(){
    try{
      await signInWithGoogle()
      const from = location.state?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    }catch(e){
      // login failure handled in AuthContext with toast
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.16),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(250,204,21,0.16),_transparent_24%)] px-6">
      <div className="max-w-xl w-full rounded-[2rem] border border-slate-200 bg-white p-10 shadow-2xl shadow-slate-200/60">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-rose-500">AI Mock Interview</p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-900">Continue with your Google account</h1>
          <p className="mt-3 text-slate-600">Sign in to access premium interview flows, AI analytics, and personalized growth insights.</p>
        </div>
        <div className="space-y-4">
          <Button onClick={handleGoogleSignIn} disabled={loading} className="w-full flex items-center justify-center gap-3 rounded-3xl px-6 py-4 text-sm font-semibold">
            <span>{loading? 'Signing in...' : 'Continue with Google'}</span>
          </Button>
          <p className="text-center text-sm text-slate-600">New here? <Link to="/landing" className="text-rose-500 hover:text-rose-600">Learn more</Link></p>
        </div>
      </div>
    </div>
  )
}
