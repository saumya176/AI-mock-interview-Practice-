import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import InterviewSetup from './pages/InterviewSetup'
import Interview from './pages/Interview'
import History from './pages/History'
import Feedback from './pages/Feedback'
import Results from './pages/Results'
import { AuthProvider } from './context/AuthContext'
import { InterviewProvider } from './context/InterviewContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './routes/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import ErrorBoundary from './components/ErrorBoundary'

export default function App(){
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <InterviewProvider>
            <Routes>
              <Route path="/" element={<Landing/>} />
              <Route path="/landing" element={<Landing/>} />
              <Route path="/login" element={<Login/>} />
              <Route element={<ProtectedRoute><AppLayout/></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard/>} />
                <Route path="/setup" element={<InterviewSetup/>} />
                <Route path="/interview" element={<Interview/>} />
                <Route path="/history" element={<History/>} />
                <Route path="/feedback" element={<Feedback/>} />
                <Route path="/results" element={<Results/>} />
              </Route>
              <Route path="/analytics" element={<Navigate to="/dashboard" replace />} />
              <Route path="/settings" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </InterviewProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
