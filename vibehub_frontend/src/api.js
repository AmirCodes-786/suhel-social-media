import axios from 'axios'
import { supabase } from './supabaseClient'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  timeout: 30000,
})

// Request interceptor to attach Supabase session to requests if needed
// This is optional since we're now Supabase-first, but kept for backward compatibility
// with Django APIs that may need token verification
api.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${session.access_token}`
      }
    } catch (error) {
      console.error('Error attaching Supabase token to request:', error)
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default api
