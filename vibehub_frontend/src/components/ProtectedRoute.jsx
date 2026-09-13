import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { user, session, loading } = useAuth()

  // Still initializing auth
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    )
  }

  // Neither user nor session — redirect to login
  if (!user && !session) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute

