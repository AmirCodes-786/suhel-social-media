import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Activity } from 'lucide-react'

/**
 * Check if ANY auth material exists in localStorage.
 * If tokens exist, the user was previously authenticated — we should show
 * a connecting state rather than redirecting to login (the backend may be cold).
 */
const hasAnyAuthMaterial = () => {
  if (localStorage.getItem('vibehub_token')) return true
  if (localStorage.getItem('vibehub_cached_user')) return true
  return Object.keys(localStorage).some(
    (k) => k.startsWith('sb-') && k.endsWith('-auth-token')
  )
}

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  // Still initializing auth
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 animate-pulse">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide animate-pulse">
            Loading VibeHub...
          </span>
        </div>
      </div>
    )
  }

  // User object exists — render the protected content
  if (user) {
    return children
  }

  // Not authenticated
  return <Navigate to="/login" replace />
}

export default ProtectedRoute
