import React, {createContext, useState, useEffect, useContext} from 'react'
import api from '../services/api'
import { auth, provider, signInWithPopup as fbSignIn } from '../firebase'
import { onAuthStateChanged, getIdToken } from 'firebase/auth'
import { toast } from 'react-toastify'

const AuthContext = createContext()

function clearStoredAuth() {
  localStorage.removeItem('token')
  delete api.defaults.headers.common['Authorization']
}

export function AuthProvider({children}){
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => !!localStorage.getItem('token'))

  useEffect(()=>{
    const token = localStorage.getItem('token')
    if(token){
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      api.get('/auth/me')
        .then(r => setUser(r.data.user))
        .catch(() => {
          clearStoredAuth()
          setUser(null)
        })
        .finally(() => setLoading(false))
      return
    }

    setLoading(true)
    const unsub = onAuthStateChanged(auth, async (u) => {
      if(u){
        const idToken = await getIdToken(u)
        try{
          const res = await api.post('/auth/firebase', { idToken })
          localStorage.setItem('token', res.data.token)
          api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
          setUser(res.data.user)
        }catch(e){
          toast.error('Session restore failed')
          setUser(null)
        }
      }
      setLoading(false)
    })
    return () => unsub()
  },[])

  async function signInWithGoogle(idToken){
    setLoading(true)
    try{
      // If idToken not provided, open Firebase popup
      let tokenToSend = idToken
      if(!tokenToSend){
        const result = await fbSignIn(auth, provider)
        tokenToSend = await getIdToken(result.user)
      }
      const res = await api.post('/auth/firebase', { idToken: tokenToSend })
      // server sets cookie; also save JWT for API Authorization header
      localStorage.setItem('token', res.data.token)
      api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
      setUser(res.data.user)
      toast.success('Signed in')
    }catch(e){
      toast.error('Sign in failed')
      throw e
    }finally{setLoading(false)}
  }

  function signOut(){
    clearStoredAuth()
    auth.signOut().catch(()=>{})
    setUser(null)
    toast.info('Signed out')
  }

  return (
    <AuthContext.Provider value={{user, loading, signInWithGoogle, signOut}}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = ()=> useContext(AuthContext)
