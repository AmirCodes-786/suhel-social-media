import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import api from '../api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  // Fetch follower/following/post counts for a user (via REST API)
  const fetchProfileCounts = async (userId) => {
    try {
      const { data } = await api.get('/api/users/me/')
      return {
        followers_count: data?.followers_count || 0,
        following_count: data?.following_count || 0,
        posts_count: data?.posts_count || 0,
      }
    } catch {
      return { followers_count: 0, following_count: 0, posts_count: 0 }
    }
  }

  // Fetch profile via REST API
  const fetchProfile = useCallback(async (userId, supabaseUser) => {
    try {
      const { data } = await api.get('/api/users/me/')
      if (data) {
        setUser(data)
        return data
      }
    } catch (err) {
      console.warn('Error fetching profile via REST API:', err)
    }
    return null
  }, [])

  // Listen to Auth State changes & check local token
  useEffect(() => {
    let mounted = true

    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        setLoading(false)
      }
    }, 3000)

    const initializeAuth = async () => {
      try {
        // 1. Check native JWT token first
        const nativeToken = localStorage.getItem('vibehub_token')
        if (nativeToken) {
          try {
            const { data } = await api.get('/api/users/me/')
            if (data && mounted) {
              setUser(data)
              setLoading(false)
              clearTimeout(safetyTimeout)
              return
            }
          } catch {
            localStorage.removeItem('vibehub_token')
          }
        }

        // 2. Check Supabase session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()
        if (error) console.warn('getSession error:', error)

        if (currentSession?.user && mounted) {
          setSession(currentSession)
          fetchProfile(currentSession.user.id, currentSession.user)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        if (mounted) {
          clearTimeout(safetyTimeout)
          setLoading(false)
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return
      setSession(newSession)
      if (newSession?.user) {
        fetchProfile(newSession.user.id, newSession.user)
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
  }, [fetchProfile])

  // Email / Password Signup
  const signup = async (email, username, password) => {
    setLoading(true)
    setAuthError(null)

    // 1. Try native backend registration
    try {
      const { data } = await api.post('/api/auth/register', {
        email,
        username,
        password,
      })
      if (data?.token && data?.user) {
        localStorage.setItem('vibehub_token', data.token)
        setUser(data.user)
        setLoading(false)
        return data
      }
    } catch (err) {
      console.warn('Native register attempt:', err?.response?.data?.error || err.message)
      // If error from backend (like username taken), re-throw
      if (err?.response?.status === 400) {
        setLoading(false)
        setAuthError(err.response.data.error || 'Registration failed')
        throw new Error(err.response.data.error || 'Registration failed')
      }
    }

    // 2. Fallback to Supabase Signup if backend not reachable
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_name: username,
          },
        },
      })
      if (error) throw error

      if (data?.session) {
        setSession(data.session)
        await fetchProfile(data.user.id, data.user)
      }
      setLoading(false)
      return data
    } catch (error) {
      setLoading(false)
      setAuthError(error.message)
      throw error
    }
  }

  // Email / Password Login
  const login = async (email, password) => {
    setLoading(true)
    setAuthError(null)

    // 1. Try native backend login
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
      console.warn('Native login attempt:', err?.response?.data?.error || err.message)
      if (err?.response?.status === 400 && err.response.data.error !== 'Network Error') {
        setLoading(false)
        setAuthError(err.response.data.error || 'Invalid credentials')
        throw new Error(err.response.data.error || 'Invalid credentials')
      }
    }

    // 2. Fallback to Supabase Login
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      if (data?.session) {
        setSession(data.session)
        await fetchProfile(data.user.id, data.user)
      }

      setLoading(false)
      return data
    } catch (error) {
      setLoading(false)
      setAuthError(error.message)
      throw error
    }
  }

  // Google OAuth Login
  const loginWithGoogle = async () => {
    setLoading(true)
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
      setAuthError(error.message)
      throw error
    }
  }

  // Logout
  const logout = async () => {
    localStorage.removeItem('vibehub_token')
    setUser(null)
    setSession(null)
    setLoading(false)
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  // Refresh user data
  const refreshUser = async () => {
    try {
      const { data } = await api.get('/api/users/me/')
      if (data) {
        setUser(data)
        return data
      }
    } catch {
      // Ignore
    }
    return null
  }

  const value = {
    session,
    user,
    loading,
    authError,
    login,
    signup,
    loginWithGoogle,
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
