import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/ui/Loader'

export default function ProtectedRoute({children}){
  const {user, loading} = useAuth()
  const location = useLocation()

  if(loading) return <div className="p-8"><Loader/></div>
  if(!user) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}
