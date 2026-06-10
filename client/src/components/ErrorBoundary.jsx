import React from 'react'
import Button from './ui/Button'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('Application error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
          <div className="max-w-lg w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">
            <h1 className="text-2xl font-semibold text-slate-900">Something went wrong</h1>
            <p className="mt-3 text-sm text-slate-600">
              An unexpected error occurred. Please refresh the page or return to the dashboard.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button onClick={() => window.location.reload()}>Refresh</Button>
              <Button onClick={() => { window.location.href = '/dashboard' }} className="bg-slate-700 hover:bg-slate-800">
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
