import axios from 'axios'
import { auth } from '../firebase'
import { getIdToken } from 'firebase/auth'
import { toast } from 'react-toastify'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
})

// Request interceptor for auth: ensure JWT is attached. If missing and a Firebase
// user is signed-in, exchange the Firebase ID token for a server JWT via
// POST /auth/firebase, then attach the JWT and retry the request.
api.interceptors.request.use(async (cfg)=>{
  const existing = cfg.headers && (cfg.headers.Authorization || api.defaults.headers.common['Authorization'])
  if(existing) return cfg

  const stored = localStorage.getItem('token')
  if(stored){
    cfg.headers = cfg.headers || {}
    cfg.headers.Authorization = `Bearer ${stored}`
    return cfg
  }

  // if firebase client has a current user, exchange its idToken for our JWT
  try{
    const current = auth && auth.currentUser
    if(current){
      const idToken = await getIdToken(current)
      // exchange with server
      const res = await axios.post(`${api.defaults.baseURL.replace(/\/api$/,'')}/api/auth/firebase`, { idToken }, { headers: { 'Content-Type': 'application/json' }, withCredentials: true })
      if(res && res.data && res.data.token){
        localStorage.setItem('token', res.data.token)
        cfg.headers = cfg.headers || {}
        cfg.headers.Authorization = `Bearer ${res.data.token}`
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
        return cfg
      }
    }
  }catch(e){
    // ignore and let request fail with 401 if unauthorized
  }

  return cfg
})

// Response interceptor for global errors
api.interceptors.response.use((r)=>r, (err)=>{
  const status = err?.response?.status
  const message = err?.response?.data?.message || err?.message || 'Request failed'

  if (status === 401) {
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    if (!window.location.pathname.startsWith('/login')) {
      toast.error('Session expired. Please sign in again.')
      window.location.href = '/login'
    }
  } else if (status === 429) {
    const url = String(err?.config?.url || '')
    if (!url.includes('/ai/')) {
      toast.error('Too many requests. Please wait a moment and try again.')
    }
  } else if (status >= 500) {
    toast.error('Server error. Please try again later.')
  } else if (status === 403) {
    toast.error('You do not have permission for this action.')
  } else if (status === 400) {
    const url = String(err?.config?.url || '')
    if (!url.includes('/ai/')) {
      toast.error(message)
    }
  } else if (status && status !== 404) {
    toast.error(message)
  }

  return Promise.reject(err)
})

export default api
