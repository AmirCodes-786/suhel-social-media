import axios from 'axios'
import { supabase } from './supabaseClient'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 30000,
})

// Request interceptor to attach authentication token (native JWT or Supabase session)
api.interceptors.request.use(
  async (config) => {
    try {
      // 1. Check for native JWT token
      const nativeToken = localStorage.getItem('vibehub_token')
      if (nativeToken) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${nativeToken}`
        return config
      }

      // 2. Fallback to Supabase session token
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${session.access_token}`
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

export default api
