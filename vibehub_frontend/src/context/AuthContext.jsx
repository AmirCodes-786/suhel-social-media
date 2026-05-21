import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null) // Holds the formatted user & profile object
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  // Fetch follower/following/post counts for a user
  const fetchProfileCounts = async (userId) => {
    try {
      const [followers, following, posts] = await Promise.all([
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', userId)
      ])
      return {
        followers_count: followers.count || 0,
        following_count: following.count || 0,
        posts_count: posts.count || 0
      }
    } catch (e) {
      console.warn('Error fetching profile counts:', e)
      return { followers_count: 0, following_count: 0, posts_count: 0 }
    }
  }

  // Create or update a profile entry in the database
  const upsertProfile = async (supabaseUser) => {
    if (!supabaseUser) return null
    try {
      const meta = supabaseUser.user_metadata || {}
      const username = meta.user_name || meta.username || meta.preferred_username || supabaseUser.email?.split('@')[0] || `user_${supabaseUser.id.slice(0, 8)}`
      
      const profileData = {
        id: supabaseUser.id,
        username: username,
        email: supabaseUser.email,
        first_name: meta.full_name?.split(' ')[0] || meta.name?.split(' ')[0] || '',
        last_name: meta.full_name?.split(' ').slice(1).join(' ') || '',
        profile_picture: meta.avatar_url || meta.picture || null,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (e) {
      console.error('Failed to upsert profile:', e)
      return null
    }
  }

  // Fetch profile from Supabase and format it to match the component structure
  const fetchProfile = useCallback(async (userId, supabaseUser) => {
    if (!userId) return null
    try {
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile not found in database, let's create it
          profile = await upsertProfile(supabaseUser)
        } else {
          throw error
        }
      }

      if (profile) {
        const counts = await fetchProfileCounts(userId)
        // Format to match Django User model schema so we don't break frontend pages
        const formattedUser = {
          id: profile.id,
          username: profile.username,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          profile: {
            bio: profile.bio || '',
            profile_picture: profile.profile_picture || null,
            cover_picture: profile.cover_picture || null,
            website: profile.website || '',
            location: profile.location || '',
          },
          ...counts
        }
        setUser(formattedUser)
        return formattedUser
      }
      return null
    } catch (err) {
      console.error('Error fetching/formatting profile:', err)
      return null
    }
  }, [])

  // Listen to Supabase Auth State changes
  useEffect(() => {
    let mounted = true

    // Safety fallback to prevent permanent loading screens if Supabase gets stuck
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('Auth initialization safety timeout reached. Forcing loading to false.')
        setLoading(false)
      }
    }, 3000)

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()
        if (error) console.warn('getSession error:', error)
        
        if (currentSession?.user && mounted) {
          setSession(currentSession)
          // Run in background without blocking finally block
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
      console.debug('Auth state change:', event, newSession)
      setSession(newSession)
      if (newSession?.user) {
        // Run in background without blocking
        fetchProfile(newSession.user.id, newSession.user)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  // Email / Password Signup
  const signup = async (email, username, password) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_name: username,
          }
        }
      })
      if (error) throw error
      
      if (data?.user) {
        // Create profile
        await upsertProfile(data.user)
        if (data.session) {
          setSession(data.session)
          await fetchProfile(data.user.id, data.user)
        }
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
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
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
          redirectTo: window.location.origin
        }
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
    // Clear state synchronously so UI updates immediately without waiting for network
    setUser(null)
    setSession(null)
    setLoading(false)
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error logging out from Supabase:', error)
    }
  }

  // Refresh user data
  const refreshUser = async () => {
    if (session?.user) {
      return await fetchProfile(session.user.id, session.user)
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
