import axios from 'axios'
import { supabase } from './supabaseClient'

const rawBaseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
// Normalize: strip trailing slash and any trailing /api so /api/* endpoints always resolve cleanly to <origin>/api/*
const normalizedBaseUrl = rawBaseUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '')

const api = axios.create({
  baseURL: normalizedBaseUrl || 'http://localhost:5000',
  timeout: 20000,
})

// Request interceptor to attach authentication token (native JWT or Supabase session)
api.interceptors.request.use(
  async (config) => {
    config._startTime = Date.now()
    try {
      // 1. Check for native JWT token
      const nativeToken = localStorage.getItem('vibehub_token')
      if (nativeToken) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${nativeToken}`
        config._authType = 'native-jwt'
        return config
      }

      // 2. Fallback to Supabase session token
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${session.access_token}`
        config._authType = 'supabase-session'
      } else {
        config._authType = 'anonymous'
      }
    } catch (error) {
      console.error('Error attaching auth token to request:', error)
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor with 401 recovery and diagnostics
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      const duration = Date.now() - (response.config?._startTime || Date.now())
      console.debug(`[API] ${response.config?.method?.toUpperCase()} ${response.config?.url} | status: ${response.status} | duration: ${duration}ms | auth: ${response.config?._authType}`)
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config
    const duration = Date.now() - (originalRequest?._startTime || Date.now())

    if (import.meta.env.DEV && originalRequest) {
      console.warn(`[API ERROR] ${originalRequest.method?.toUpperCase()} ${originalRequest.url} | status: ${error.response?.status || 'network-error'} | duration: ${duration}ms | auth: ${originalRequest._authType}`)
    }

    // Single controlled retry on 401: if native JWT expired/invalid, clear it and try Supabase session
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true

      const hadNativeToken = Boolean(localStorage.getItem('vibehub_token'))
      if (hadNativeToken) {
        localStorage.removeItem('vibehub_token')
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          originalRequest.headers = originalRequest.headers || {}
          originalRequest.headers.Authorization = `Bearer ${session.access_token}`
          originalRequest._authType = 'supabase-session-retry'
          return api(originalRequest)
        }
      } catch (sessionErr) {
        console.error('Failed to retrieve fallback Supabase session:', sessionErr)
      }
    }

    return Promise.reject(error)
  }
)

export default api
