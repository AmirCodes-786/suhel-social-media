import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { QueryProvider } from './context/QueryProvider'
import ProtectedRoute from './components/ProtectedRoute'
import RouteErrorBoundary from './components/RouteErrorBoundary'
import { Activity } from 'lucide-react'

// Code-split pages on demand with retry logic for chunk failures
const lazyWithRetry = (importFn) =>
  lazy(() =>
    importFn().catch(() => {
      // If a chunk fails to load (e.g. after a deploy), retry once
      return new Promise((resolve) => {
        setTimeout(() => resolve(importFn()), 1500)
      })
    })
  )

const Login = lazyWithRetry(() => import('./pages/Login'))
const Signup = lazyWithRetry(() => import('./pages/Signup'))
const ForgotPassword = lazyWithRetry(() => import('./pages/ForgotPassword'))
const Feed = lazyWithRetry(() => import('./pages/Feed'))
const Explore = lazyWithRetry(() => import('./pages/Explore'))
const Messages = lazyWithRetry(() => import('./pages/Messages'))
const Notifications = lazyWithRetry(() => import('./pages/Notifications'))
const Profile = lazyWithRetry(() => import('./pages/Profile'))
const PostDetail = lazyWithRetry(() => import('./pages/PostDetail'))
const Settings = lazyWithRetry(() => import('./pages/Settings'))

const RouteFallback = () => (
  <div className="min-h-screen w-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center font-outfit">
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

const AnimatedRoutes = () => {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Application Routes */}
        <Route path="/" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
        <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/post/:id" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />

        {/* Fallback Catch-all Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <RouteErrorBoundary>
              <Suspense fallback={<RouteFallback />}>
                <AnimatedRoutes />
              </Suspense>
            </RouteErrorBoundary>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  )
}

export default App
