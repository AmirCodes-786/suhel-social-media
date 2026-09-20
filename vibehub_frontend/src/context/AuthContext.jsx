import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../supabaseClient'
import api, { classifyError, ErrorType, isTransientError, invalidateTokenCache } from '../api'
import { cacheHelpers } from './QueryProvider'

const AuthContext = createContext(null)

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Check if ANY auth material exists in localStorage.
 * Used to decide whether to show loading vs redirect to login.
 */
const hasAnyAuthMaterial = () => {
  if (localStorage.getItem('vibehub_token')) return true
  // Check for Supabase session keys
  return Object.keys(localStorage).some(
    (k) => k.startsWith('sb-') && k.endsWith('-auth-token')
  )
}

// ─── Provider ───────────────────────────────────────────────────────

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)

  // Hydrate cached user immediately on mount — no loading flash
  const [user, setInternalUser] = useState(() => {
    try {
      const cached = localStorage.getItem('vibehub_cached_user')
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  })

  const setUser = useCallback((newUser) => {
    setInternalUser(newUser)
    if (newUser) {
      localStorage.setItem('vibehub_cached_user', JSON.stringify(newUser))
    } else {
      localStorage.removeItem('vibehub_cached_user')
    }
  }, [])

  // Start as not-loading if we have cached auth material
  const [loading, setLoading] = useState(() => {
    const hasToken = localStorage.getItem('vibehub_token')
    const hasCachedUser = localStorage.getItem('vibehub_cached_user')
    if (hasToken && hasCachedUser) return false

    const hasSupabaseSession = hasAnyAuthMaterial()
    if (hasSupabaseSession && hasCachedUser) return false

    return true
  })

  const [authError, setAuthError] = useState(null)

  // Track backend connectivity for UI awareness
  const [backendStatus, setBackendStatus] = useState('online') // 'online' | 'offline' | 'connecting'

  const initRef = useRef(false)

// Helper to construct a local user representation from Supabase user metadata
const buildSupabaseUser = (supabaseUser) => {
  if (!supabaseUser) return null
  const meta = supabaseUser.user_metadata || {}
  return {
    _id: supabaseUser.id,
    id: supabaseUser.id,
    username: meta.user_name || meta.username || meta.preferred_username || (supabaseUser.email ? supabaseUser.email.split('@')[0] : 'user'),
    email: supabaseUser.email,
    first_name: meta.full_name?.split(' ')[0] || meta.name?.split(' ')[0] || '',
    last_name: meta.full_name?.split(' ').slice(1).join(' ') || meta.name?.split(' ').slice(1).join(' ') || '',
    profile: {
      profile_picture: meta.avatar_url || meta.picture || null,
    },
    profile_picture: meta.avatar_url || meta.picture || null,
  }
}

  // ─── Profile fetcher (resilient) ──────────────────────────────────
  const fetchProfile = useCallback(async (userId, supabaseUser) => {
    // If we have Supabase user data, immediately ensure local user exists
    if (supabaseUser) {
      const fallback = buildSupabaseUser(supabaseUser)
      setUser((prev) => prev || fallback)
    }

    try {
      setBackendStatus('connecting')
      const { data } = await api.get('/api/users/me/')
      if (data) {
        setUser(data)
        setBackendStatus('online')
        return data
      }
    } catch (err) {
      const errorType = classifyError(err)

      if (isTransientError(errorType)) {
        console.warn('[AUTH] Backend temporarily unavailable, keeping session:', errorType)
        setBackendStatus('offline')
        if (supabaseUser) {
          const fallback = buildSupabaseUser(supabaseUser)
          setUser((prev) => prev || fallback)
          return fallback
        }
        return null
      }

      if (errorType === ErrorType.AUTH_ERROR) {
        // If it's a native token, 401 means token is truly invalid
        if (localStorage.getItem('vibehub_token')) {
          console.warn('[AUTH] Native token rejected by server (401), clearing auth')
          localStorage.removeItem('vibehub_token')
          setUser(null)
        } else if (supabaseUser) {
          // Supabase session is valid, but backend may not have verified Supabase JWT yet
          console.warn('[AUTH] Backend 401 on Supabase token; maintaining Supabase session')
          const fallback = buildSupabaseUser(supabaseUser)
          setUser((prev) => prev || fallback)
        }
        setBackendStatus('online')
        return null
      }

      console.warn('[AUTH] Profile fetch error:', errorType)
    }
    return null
  }, [setUser])

  // ─── Deterministic Auth Initialization ────────────────────────────
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    let mounted = true

    // Safety timeout — never stay loading forever
    const safetyTimeout = setTimeout(() => {
      if (mounted) setLoading(false)
    }, 2500)

    const initializeAuth = async () => {
      try {
        // 1. Check native JWT token first
        const nativeToken = localStorage.getItem('vibehub_token')
        if (nativeToken) {
          try {
            const { data } = await api.get('/api/users/me/')
            if (data && mounted) {
              setUser(data)
              setBackendStatus('online')
              setLoading(false)
              clearTimeout(safetyTimeout)
              return
            }
          } catch (err) {
            const errorType = classifyError(err)

            if (isTransientError(errorType)) {
              console.warn('[AUTH] Backend unavailable during init, preserving session')
              setBackendStatus('offline')
              if (mounted) {
                setLoading(false)
                clearTimeout(safetyTimeout)
              }
              return
            }

            if (errorType === ErrorType.AUTH_ERROR) {
              console.warn('[AUTH] Native token rejected (401), clearing')
              localStorage.removeItem('vibehub_token')
              if (mounted) setUser(null)
            }
          }
        }

        // 2. Check Supabase session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()
        if (error) console.warn('[AUTH] getSession error:', error)

        if (currentSession?.user && mounted) {
          setSession(currentSession)
          const localUser = buildSupabaseUser(currentSession.user)
          setUser((prev) => prev || localUser)
          setLoading(false)
          clearTimeout(safetyTimeout)

          // Fetch full backend profile asynchronously
          if (!localStorage.getItem('vibehub_token')) {
            fetchProfile(currentSession.user.id, currentSession.user)
          }
          return
        }
      } catch (error) {
        console.error('[AUTH] Error initializing auth:', error)
      } finally {
        if (mounted) {
          clearTimeout(safetyTimeout)
          setLoading(false)
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return

      if (event === 'TOKEN_REFRESHED') {
        setSession(newSession)
        invalidateTokenCache()
        return
      }

      if (event === 'SIGNED_OUT') {
        setSession(null)
        invalidateTokenCache()
        if (!localStorage.getItem('vibehub_token')) {
          setUser(null)
        }
        setLoading(false)
        return
      }

      setSession(newSession)
      invalidateTokenCache()

      if (newSession?.user) {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          await fetchProfile(newSession.user.id, newSession.user)
        }
      } else if (!localStorage.getItem('vibehub_token')) {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      clearTimeout(safetyTimeout)
      subscription?.unsubscribe?.()
    }
  }, [fetchProfile, setUser])

  // ─── Email / Password Signup ──────────────────────────────────────
  const signup = async (email, password, userData = {}) => {
    setLoading(true)
    setAuthError(null)

    const { username, full_name } = userData
    const first_name = full_name ? full_name.split(' ')[0] : ''
    const last_name = full_name ? full_name.split(' ').slice(1).join(' ') : ''

    // 1. Try Supabase signup first (auth doesn't depend on Render)
    try {
      const { data: supabaseData, error: supabaseError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_name: username,
            full_name: full_name || '',
          },
        },
      })

      if (supabaseError) {
        // If user already exists in Supabase, try native backend
        if (!supabaseError.message?.includes('already registered')) {
          throw supabaseError
        }
      } else if (supabaseData?.session) {
        setSession(supabaseData.session)
        invalidateTokenCache()
      }
    } catch (supabaseErr) {
      console.warn('[AUTH] Supabase signup failed:', supabaseErr.message)
    }

    // 2. Also register in backend for MongoDB user/profile creation
    try {
      const { data } = await api.post('/api/auth/register', {
        email,
        username,
        password,
        first_name,
        last_name,
      })
      if (data?.token && data?.user) {
        localStorage.setItem('vibehub_token', data.token)
        setUser(data.user)
        setLoading(false)
        return data
      }
    } catch (err) {
      const errorType = classifyError(err)
      console.warn('[AUTH] Backend register:', err?.response?.data?.error || err.message)

      if (errorType === ErrorType.VALIDATION_ERROR) {
        setLoading(false)
        setAuthError(err.response.data.error || 'Registration failed')
        throw new Error(err.response.data.error || 'Registration failed')
      }

      // If backend is down but Supabase succeeded, the user will be synced on first API call
      if (isTransientError(errorType)) {
        console.warn('[AUTH] Backend unavailable during signup, Supabase auth established')
        setLoading(false)
        return { user: null, pending_sync: true }
      }
    }

    setLoading(false)
    return null
  }

  // ─── Email / Password Login ───────────────────────────────────────
  const login = async (email, password) => {
    setLoading(true)
    setAuthError(null)

    // 1. Try native backend login first (faster for existing native users)
    try {
      const { data } = await api.post('/api/auth/login', {
        email,
        password,
      })
      if (data?.token && data?.user) {
        localStorage.setItem('vibehub_token', data.token)
        setUser(data.user)
        setLoading(false)
        return data
      }
    } catch (err) {
      const errorType = classifyError(err)
      console.warn('[AUTH] Native login:', err?.response?.data?.error || err.message)

      // If backend explicitly rejected credentials (400), don't fall through to Supabase
      if (errorType === ErrorType.VALIDATION_ERROR && err.response?.data?.error !== 'Network Error') {
        setLoading(false)
        setAuthError(err.response.data.error || 'Invalid credentials')
        throw new Error(err.response.data.error || 'Invalid credentials')
      }
      // For transient errors (backend down), fall through to Supabase
    }

    // 2. Fallback to Supabase Login (works even when Render is cold)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      if (data?.session) {
        setSession(data.session)
        invalidateTokenCache()
        const localUser = buildSupabaseUser(data.user)
        setUser(localUser)
        setLoading(false)
        // Fetch full backend profile asynchronously
        fetchProfile(data.user.id, data.user)
        return data
      }

      setLoading(false)
      return data
    } catch (error) {
      setLoading(false)
      setAuthError(error.message)
      throw error
    }
  }

  // ─── Google OAuth Login ───────────────────────────────────────────
  const loginWithGoogle = async () => {
    setLoading(true)
    setAuthError(null)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      })
      if (error) throw error
      return data
    } catch (error) {
      setLoading(false)
      const msg = error.message || ''
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ENOTFOUND')) {
        const detailedMsg = 'Supabase is unreachable (project paused or deleted). Unpause your project in the Supabase Dashboard, or login with Email/Password.'
        setAuthError(detailedMsg)
        throw new Error(detailedMsg)
      }
      setAuthError(error.message)
      throw error
    }
  }

  // ─── Password Reset ───────────────────────────────────────────────
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      })
      if (error) throw error
      return true
    } catch (error) {
      throw error
    }
  }

  // ─── Logout ───────────────────────────────────────────────────────
  const logout = async () => {
    localStorage.removeItem('vibehub_token')
    localStorage.removeItem('vibehub_cached_user')
    invalidateTokenCache()
    cacheHelpers.clearUserCache()
    setUser(null)
    setSession(null)
    setLoading(false)
    setBackendStatus('online')
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('[AUTH] Error logging out:', error)
    }
  }

  // ─── Refresh user data ────────────────────────────────────────────
  const refreshUser = async () => {
    try {
      const { data } = await api.get('/api/users/me/')
      if (data) {
        setUser(data)
        setBackendStatus('online')
        return data
      }
    } catch (err) {
      const errorType = classifyError(err)
      if (isTransientError(errorType)) {
        setBackendStatus('offline')
      }
    }
    return null
  }

  const value = {
    session,
    user,
    loading,
    authError,
    backendStatus,
    login,
    signup,
    loginWithGoogle,
    resetPassword,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
