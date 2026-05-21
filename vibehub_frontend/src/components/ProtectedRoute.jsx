import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { user, session, loading, logout } = useAuth()
  const [timeoutExpired, setTimeoutExpired] = useState(false)

  // Force clean up stale sessions if profile cannot be fetched/created after 15 seconds
  useEffect(() => {
    if (session && !user && !loading) {
      const timer = setTimeout(() => {
        setTimeoutExpired(true)
      }, 15000)
      return () => clearTimeout(timer)
    } else {
      setTimeoutExpired(false)
    }
  }, [session, user, loading])

  useEffect(() => {
    if (timeoutExpired) {
      console.warn('Session profile loading timed out. Clearing session...')
      logout()
    }
  }, [timeoutExpired, logout])

  // Still initializing auth
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    )
  }

  // No session at all — redirect to login
  if (!session) {
    return <Navigate to="/login" replace />
  }

  // Session exists but user profile is still fetching
  if (!user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <span className="text-xs text-slate-400 font-medium">Setting up your profile...</span>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
