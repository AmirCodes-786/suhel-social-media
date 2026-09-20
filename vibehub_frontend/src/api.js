import axios from 'axios'
import { supabase } from './supabaseClient'

// ─── Base URL Normalization ──────────────────────────────────────────
const rawBaseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
const normalizedBaseUrl = rawBaseUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '')

// ─── Error Classification ───────────────────────────────────────────
export const ErrorType = {
  AUTH_ERROR: 'AUTH_ERROR',           // 401 — token invalid/expired
  FORBIDDEN: 'FORBIDDEN',            // 403 — not authorized
  NETWORK_ERROR: 'NETWORK_ERROR',    // No response at all (offline, DNS, cold start)
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',    // Request timed out
  SERVER_ERROR: 'SERVER_ERROR',      // 5xx
  VALIDATION_ERROR: 'VALIDATION_ERROR', // 400
  NOT_FOUND: 'NOT_FOUND',           // 404
  RATE_LIMITED: 'RATE_LIMITED',      // 429
  DATABASE_UNAVAILABLE: 'DATABASE_UNAVAILABLE', // 503 with DB error
  UNKNOWN: 'UNKNOWN',
}

/**
 * Classify an Axios error into a deterministic error type.
 * This drives whether auth should be invalidated, retries attempted, etc.
 */
export const classifyError = (error) => {
  if (!error) return ErrorType.UNKNOWN

  // Timeout
  if (error.code === 'ECONNABORTED' || error.code === 'ERR_CANCELED') {
    return ErrorType.TIMEOUT_ERROR
  }

  // No response = network error (offline, DNS failure, cold start unreachable)
  if (!error.response) {
    return ErrorType.NETWORK_ERROR
  }

  const status = error.response.status

  if (status === 401) return ErrorType.AUTH_ERROR
  if (status === 403) return ErrorType.FORBIDDEN
  if (status === 404) return ErrorType.NOT_FOUND
  if (status === 429) return ErrorType.RATE_LIMITED
  if (status === 400) return ErrorType.VALIDATION_ERROR

  if (status === 503) {
    // Check if it's a database-specific 503
    const data = error.response.data
    if (data?.error === 'Database disconnected' || data?.detail?.includes('Database')) {
      return ErrorType.DATABASE_UNAVAILABLE
    }
    return ErrorType.SERVER_ERROR
  }

  if (status >= 500) return ErrorType.SERVER_ERROR

  return ErrorType.UNKNOWN
}

/**
 * Returns true if the error type represents a transient failure
 * where the existing session should be preserved (NOT invalidated).
 */
export const isTransientError = (errorType) => {
  return [
    ErrorType.NETWORK_ERROR,
    ErrorType.TIMEOUT_ERROR,
    ErrorType.SERVER_ERROR,
    ErrorType.DATABASE_UNAVAILABLE,
    ErrorType.RATE_LIMITED,
  ].includes(errorType)
}

/**
 * Returns true if a GET request with this error type should be retried.
 */
const isRetryableGet = (errorType) => {
  return [
    ErrorType.NETWORK_ERROR,
    ErrorType.TIMEOUT_ERROR,
    ErrorType.SERVER_ERROR,
    ErrorType.DATABASE_UNAVAILABLE,
  ].includes(errorType)
}

// ─── Cached Supabase token to avoid calling getSession() on every request ────
let _cachedSupabaseToken = null
let _tokenCacheTime = 0
const TOKEN_CACHE_MS = 30_000 // Cache for 30 seconds

const getSupabaseToken = async () => {
  const now = Date.now()
  if (_cachedSupabaseToken && (now - _tokenCacheTime) < TOKEN_CACHE_MS) {
    return _cachedSupabaseToken
  }
  try {
    const { data: { session } } = await supabase.auth.getSession()
    _cachedSupabaseToken = session?.access_token || null
    _tokenCacheTime = now
    return _cachedSupabaseToken
  } catch {
    return _cachedSupabaseToken // Return stale cache on error
  }
}

// Invalidate token cache (called on auth state changes)
export const invalidateTokenCache = () => {
  _cachedSupabaseToken = null
  _tokenCacheTime = 0
}

// Listen for Supabase auth changes to invalidate cache
supabase.auth.onAuthStateChange(() => {
  invalidateTokenCache()
})

// ─── Axios Instance ─────────────────────────────────────────────────
const api = axios.create({
  baseURL: normalizedBaseUrl || 'http://localhost:5000',
  timeout: 20000,
})

// ─── Request Interceptor ────────────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    config._startTime = Date.now()
    config._retryCount = config._retryCount || 0

    try {
      // 1. Check for native JWT token
      const nativeToken = localStorage.getItem('vibehub_token')
      if (nativeToken) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${nativeToken}`
        config._authType = 'native-jwt'
        return config
      }

      // 2. Use cached Supabase session token
      const supabaseToken = await getSupabaseToken()
      if (supabaseToken) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${supabaseToken}`
        config._authType = 'supabase-session'
      } else {
        config._authType = 'anonymous'
      }
    } catch (error) {
      console.error('[API] Error attaching auth token:', error)
    }

    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response Interceptor ───────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      const duration = Date.now() - (response.config?._startTime || Date.now())
      console.debug(`[API] ${response.config?.method?.toUpperCase()} ${response.config?.url} | ${response.status} | ${duration}ms | ${response.config?._authType}`)
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config
    const duration = Date.now() - (originalRequest?._startTime || Date.now())
    const errorType = classifyError(error)

    if (import.meta.env.DEV && originalRequest) {
      console.warn(`[API ERROR] ${originalRequest.method?.toUpperCase()} ${originalRequest.url} | ${error.response?.status || 'network-error'} | ${duration}ms | ${originalRequest._authType} | type: ${errorType}`)
    }

    // Attach error classification for consumers
    error.errorType = errorType

    // ── Controlled retry for idempotent GET requests on transient failures ──
    if (
      originalRequest &&
      originalRequest.method === 'get' &&
      !originalRequest._retry &&
      isRetryableGet(errorType) &&
      (originalRequest._retryCount || 0) < 2
    ) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1
      const backoffMs = originalRequest._retryCount * 2000 // 2s, 4s
      await new Promise((resolve) => setTimeout(resolve, backoffMs))

      if (import.meta.env.DEV) {
        console.debug(`[API RETRY] ${originalRequest.url} attempt ${originalRequest._retryCount}`)
      }

      return api(originalRequest)
    }

    // ── 401 Recovery: single controlled retry ──
    // Only on genuine 401 (AUTH_ERROR), never on network/timeout/5xx
    if (errorType === ErrorType.AUTH_ERROR && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true

      const hadNativeToken = Boolean(localStorage.getItem('vibehub_token'))
      if (hadNativeToken) {
        // Native token was rejected by server — clear it
        localStorage.removeItem('vibehub_token')
      }

      // Try Supabase session as recovery
      try {
        invalidateTokenCache()
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          originalRequest.headers = originalRequest.headers || {}
          originalRequest.headers.Authorization = `Bearer ${session.access_token}`
          originalRequest._authType = 'supabase-session-retry'
          return api(originalRequest)
        }
      } catch (sessionErr) {
        console.error('[API] Failed to retrieve fallback Supabase session:', sessionErr)
      }
    }

    return Promise.reject(error)
  }
)

export default api
