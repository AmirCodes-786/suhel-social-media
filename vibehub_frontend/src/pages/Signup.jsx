import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, User, UserPlus, ChevronRight, AlertCircle, Eye, EyeOff, Shield, Activity } from 'lucide-react'
import { motion } from 'framer-motion'

const Signup = () => {
  const { signup, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signup(email, username, password)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.')
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

  return (
    <div className="min-h-screen w-screen bg-white flex flex-col md:flex-row overflow-x-hidden font-outfit">
      
      {/* Left Column: Soft lavender background */}
      <div className="hidden md:flex md:w-1/2 bg-[#f0f3ff] text-slate-800 p-12 flex-col justify-between relative overflow-hidden shrink-0">
        {/* Abstract shapes */}
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-white/40 rounded-full blur-[80px]" />
        
        {/* Branding header */}
        <div className="flex items-center gap-2 relative z-10 text-left">
          <Activity className="h-6 w-6 text-indigo-600 animate-pulse" />
          <span className="text-xl font-bold tracking-tight text-slate-900">VibeHub</span>
        </div>

        {/* Heading & Subtext */}
        <div className="max-w-md relative z-10 text-left my-auto space-y-4">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900">
            The Vibe is <span className="italic text-indigo-600 font-serif">better</span> with you.
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed font-light">
            Join a global community of creators, dreamers, and explorers. Share your story in a space designed for genuine connection.
          </p>

          {/* Privacy badge */}
          <div className="bg-white/80 border border-slate-100 p-4 rounded-2xl flex gap-3 items-start mt-8 max-w-sm shadow-sm">
            <Shield className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900">Privacy by Design</span>
              <span className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                Your data is yours. Encrypted, secure, and under your control.
              </span>
            </div>
          </div>
        </div>

        {/* Bottom stats */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex -space-x-2">
            <img className="inline-block h-8 w-8 rounded-full ring-2 ring-[#f0f3ff] object-cover" src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80" alt="Avatar" />
            <img className="inline-block h-8 w-8 rounded-full ring-2 ring-[#f0f3ff] object-cover" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80" alt="Avatar" />
            <img className="inline-block h-8 w-8 rounded-full ring-2 ring-[#f0f3ff] object-cover" src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80" alt="Avatar" />
          </div>
          <span className="text-xs text-slate-500 font-light">+20k creators joined this week</span>
        </div>
      </div>

      {/* Right Column: Authentication Form */}
      <div className="flex-1 flex flex-col justify-between items-center px-6 py-12 md:px-16 bg-white relative min-h-screen">
        {/* Top spacer / header redirects */}
        <div className="w-full max-w-md flex justify-between items-center md:justify-end text-xs mb-8 shrink-0">
          <div className="flex md:hidden items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            <span className="text-base font-bold text-slate-900">VibeHub</span>
          </div>
          <p className="text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:underline">Log in</Link>
          </p>
        </div>

        {/* Main form card */}
        <div className="w-full max-w-md flex flex-col text-left my-auto">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h2>
          <p className="text-xs text-slate-500 mt-1 mb-8">Join the community and share your story.</p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/5 border border-rose-200 flex gap-3 items-start text-xs text-rose-600">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/5 border border-emerald-200 text-xs text-emerald-600">
              Account created successfully! Redirecting you to login...
            </div>
          )}

          {/* Social login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || success}
            className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2.5 transition-all shadow-sm mb-6 cursor-pointer"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="font-semibold text-slate-800">Sign up with Google</span>
          </button>

          {/* Divider */}
          <div className="relative mb-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <span className="relative bg-white px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">or with email</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name & Username in 1 row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Alex Vibe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="alexvibe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-11 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-400"
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

            {/* Terms of Service Checkbox */}
            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="agree"
                required
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="agree" className="text-[11px] text-slate-600 font-medium select-none cursor-pointer">
                I agree to the <span className="text-indigo-600 hover:underline">Terms of Service</span> and <span className="text-indigo-600 hover:underline">Privacy Policy</span>.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-indigo-500/10 disabled:opacity-50 transition-all cursor-pointer mt-6"
            >
              <span>Create Account</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Footer info seals */}
        <div className="w-full text-center mt-8 shrink-0">
          <span className="text-[9px] font-bold text-slate-400 tracking-wider flex items-center gap-1.5 justify-center uppercase mb-4">
            <Shield className="h-3.5 w-3.5 text-slate-400" />
            <span>Verified Secure SSL Signup</span>
          </span>
          <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 font-light">
            <span className="hover:text-slate-600 cursor-pointer">Help Center</span>
            <span className="hover:text-slate-600 cursor-pointer">Privacy</span>
            <span className="hover:text-slate-600 cursor-pointer">Terms</span>
            <span>© 2024 VibeHub Inc.</span>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Signup
