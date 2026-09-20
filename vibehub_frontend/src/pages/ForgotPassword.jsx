import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, ChevronLeft, AlertCircle, CheckCircle, Activity } from 'lucide-react'
import ThreeAuthBackground from '../components/ThreeAuthBackground'

const ForgotPassword = () => {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)
    try {
      await resetPassword(email)
      setSuccess(true)
    } catch (err) {
      setError(err?.message || 'Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden flex flex-col lg:flex-row bg-white font-outfit">
      
      {/* Left Column: 3D Visual */}
      <ThreeAuthBackground 
        headline="Reset your password securely."
        subheadline="We'll send you a link to reset your password and get you back to your vibe."
      />

      {/* Right Column: Reset Form */}
      <div className="w-full lg:w-1/2 h-screen max-h-screen flex flex-col justify-between items-center px-6 lg:px-12 py-5 sm:py-7 overflow-y-auto lg:overflow-hidden bg-white">
        
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
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Forgot password?</h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter the email associated with your account and we'll send you a link to reset your password.
            </p>
          </div>

          {error && (
            <div className="mb-3.5 p-3 rounded-xl bg-rose-50 border border-rose-200 flex gap-2.5 items-start text-xs text-rose-600">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-3.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex gap-2.5 items-start text-xs text-emerald-700">
              <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Check your email</p>
                <p className="mt-0.5">We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and spam folder.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
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

            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs tracking-wide flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-200 hover:shadow-md transition-all duration-200 cursor-pointer mt-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'Sending...' : success ? 'Email sent!' : 'Send Reset Link'}</span>
            </button>
          </form>

          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline mt-4"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to login
          </Link>
        </div>

        {/* Bottom Copyright */}
        <div className="w-full text-center">
          <p className="text-[11px] text-slate-400 font-light">
            © 2026 VibeHub Inc. All rights reserved.
          </p>
        </div>

      </div>

    </div>
  )
}

export default ForgotPassword
