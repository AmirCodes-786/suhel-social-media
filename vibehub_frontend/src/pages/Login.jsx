import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, ChevronRight, AlertCircle, Eye, EyeOff, Activity } from 'lucide-react'
import { motion } from 'framer-motion'

const Login = () => {
  const { login, loginWithGoogle, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      const msg = err?.message || 'Invalid email or password.'
      if (msg.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials and try again.')
      } else if (msg.includes('Email not confirmed')) {
        setError('Please verify your email address before logging in. Check your inbox for a confirmation link.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      await loginWithGoogle()
    } catch (err) {
      setError(err.message || 'Google Sign-In failed.')
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/')
    }
  }, [authLoading, user, navigate])

  // Debug info: expose auth state in UI to help diagnose OAuth issues
  const renderAuthDebug = () => {
    try {
      // `window.__supabase_session` is not real; we show local storage keys instead
      const devToken = localStorage.getItem('vibehub_dev_token')
      return (
        <div className="mt-4 text-xs text-slate-500 bg-slate-50 p-2 rounded">
          <div><strong>Auth debug</strong></div>
          <div>devToken: {devToken ? 'present' : 'none'}</div>
        </div>
      )
    } catch (e) {
      return null
    }
  }

  return (
    <div className="min-h-screen w-screen bg-white flex flex-col md:flex-row overflow-x-hidden font-outfit">
      
      {/* Left Column: Branding (Visible only on MD screens and above) */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-white p-12 flex-col justify-between relative overflow-hidden shrink-0">
        {/* Abstract background shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Branding header */}
        <div className="flex items-center gap-2 relative z-10 text-left">
          <Activity className="h-6 w-6 text-indigo-400 animate-pulse" />
          <span className="text-xl font-bold tracking-tight text-white">VibeHub</span>
        </div>

        {/* Core Marketing message */}
        <div className="max-w-md relative z-10 text-left my-auto space-y-4">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Connect with your audience in a more <span className="underline decoration-indigo-500 decoration-wavy">elegant</span> way.
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed font-light">
            Join thousands of creators sharing their vibes in a minimal, high-performance social ecosystem designed for the modern web.
          </p>
        </div>

        {/* Bottom Trust/Community stats */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex -space-x-2">
            <img className="inline-block h-8 w-8 rounded-full ring-2 ring-zinc-900 object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Avatar" />
            <img className="inline-block h-8 w-8 rounded-full ring-2 ring-zinc-900 object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" alt="Avatar" />
            <img className="inline-block h-8 w-8 rounded-full ring-2 ring-zinc-900 object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" alt="Avatar" />
            <img className="inline-block h-8 w-8 rounded-full ring-2 ring-zinc-900 object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80" alt="Avatar" />
          </div>
          <span className="text-xs text-zinc-400 font-light">Trusted by 50k+ creators worldwide</span>
        </div>
      </div>

      {/* Right Column: Authentication Panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 md:px-16 bg-white relative">
        <div className="w-full max-w-sm flex flex-col text-left">
          
          {/* Header Mobile Brand (only visible on mobile) */}
          <div className="flex md:hidden items-center gap-2 mb-6">
            <Activity className="h-6 w-6 text-indigo-600" />
            <span className="text-lg font-bold tracking-tight text-slate-900">VibeHub</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
          <p className="text-xs text-slate-500 mt-1 mb-8">Please enter your details to access your account.</p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/5 border border-rose-200 flex gap-3 items-start text-xs text-rose-600">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Social login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2.5 transition-all shadow-sm mb-6 cursor-pointer"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="font-semibold text-slate-800">Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative mb-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <span className="relative bg-white px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">or login with email</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Password</label>
                <Link to="/forgot-password" className="text-[10px] font-bold text-indigo-600 hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-12 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="remember"
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="remember" className="text-[11px] text-slate-600 font-medium select-none cursor-pointer">
                Keep me logged in for 30 days
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-indigo-500/10 disabled:opacity-50 transition-all cursor-pointer mt-6"
            >
              <span>Log In</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </form>

          {/* Create account bottom */}
          <p className="text-xs text-slate-600 mt-6 text-center">
            Don't have an account yet?{' '}
            <Link to="/signup" className="font-semibold text-indigo-600 hover:underline">Sign up for free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
