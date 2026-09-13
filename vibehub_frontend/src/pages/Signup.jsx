import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, User, ChevronRight, AlertCircle, Eye, EyeOff, Activity } from 'lucide-react'
import ThreeAuthBackground from '../components/ThreeAuthBackground'

const Signup = () => {
  const { signup, loginWithGoogle, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signup(email, password, { full_name: fullName, username })
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 2500)
    } catch (err) {
      setError(err?.message || 'Failed to create account. Please check your details.')
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

  const hasNavigated = React.useRef(false)

  useEffect(() => {
    if (!authLoading && user && !hasNavigated.current) {
      hasNavigated.current = true
      navigate('/', { replace: true })
    }
  }, [authLoading, user, navigate])

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden flex flex-col lg:flex-row bg-white font-outfit">
      
      {/* Left Column: Polished SaaS 3D Visual Experience */}
      <ThreeAuthBackground 
        headline="Join the community shaping what's next."
        subheadline="Create your profile, connect with top visual creators, and share your perspective in real time."
      />

      {/* Right Column: Clean, Compact Registration Form (Zero Vertical Scroll) */}
      <div className="w-full lg:w-1/2 h-screen max-h-screen flex flex-col justify-between items-center px-6 lg:px-12 py-4 sm:py-6 overflow-y-auto lg:overflow-hidden bg-white">
        
        {/* Top Mobile Brand Bar */}
        <div className="w-full flex justify-between items-center lg:invisible">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-slate-900">VibeHub</span>
          </Link>
          <Link to="/login" className="text-xs font-semibold text-indigo-600 hover:underline">
            Sign in
          </Link>
        </div>

        {/* Central Form Container */}
        <div className="w-full max-w-sm my-auto text-left">
          <div className="mb-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h1>
            <p className="text-xs text-slate-500 mt-0.5">Start sharing and connecting with your community</p>
          </div>

          {error && (
            <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex gap-2.5 items-start text-xs text-rose-600">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Account created successfully! Redirecting to login...</span>
            </div>
          )}

          {/* Google Sign-in */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || success}
            className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2.5 transition-all shadow-xs mb-3 cursor-pointer hover:border-slate-300"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="font-semibold text-slate-700">Sign up with Google</span>
          </button>

          {/* Clean Divider */}
          <div className="relative mb-3 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <span className="relative bg-white px-2.5 text-[11px] font-medium text-slate-400">
              or continue with email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-2.5">
            {/* Full Name & Username */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Alex Rivers"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-8 pr-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="alexrivers"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-8 pr-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-9 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="checkbox"
                id="agree"
                required
                className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="agree" className="text-[11px] text-slate-600 select-none cursor-pointer leading-tight">
                I agree to the <span className="text-indigo-600 hover:underline">Terms</span> & <span className="text-indigo-600 hover:underline">Privacy Policy</span>.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs tracking-wide flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-200 hover:shadow-md transition-all duration-200 cursor-pointer mt-2"
            >
              <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Footer Redirect Link */}
          <p className="text-xs text-slate-500 mt-3 text-center">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
              Log in
            </Link>
          </p>
        </div>

        {/* Clean Bottom Copyright */}
        <div className="w-full text-center">
          <p className="text-[11px] text-slate-400 font-light">
            © 2026 VibeHub Inc. All rights reserved.
          </p>
        </div>

      </div>

    </div>
  )
}

export default Signup
