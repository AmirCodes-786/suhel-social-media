import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import { Activity } from 'lucide-react'

// Code-split pages on demand
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const Feed = lazy(() => import('./pages/Feed'))
const Explore = lazy(() => import('./pages/Explore'))
const Messages = lazy(() => import('./pages/Messages'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Profile = lazy(() => import('./pages/Profile'))
const PostDetail = lazy(() => import('./pages/PostDetail'))
const Settings = lazy(() => import('./pages/Settings'))

const RouteFallback = () => (
  <div className="min-h-screen w-screen bg-slate-50 flex items-center justify-center font-outfit">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 animate-pulse">
        <Activity className="h-5 w-5 text-white" />
      </div>
      <span className="text-xs font-semibold text-slate-500 tracking-wide animate-pulse">
        Loading VibeHub...
      </span>
    </div>
  </div>
)

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Application Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Feed />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/explore" 
              element={
                <ProtectedRoute>
                  <Explore />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/messages" 
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile/:username" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/post/:id" 
              element={
                <ProtectedRoute>
                  <PostDetail />
                </ProtectedRoute>
              } 
            />

            {/* Fallback Catch-all Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  )
}

export default App
