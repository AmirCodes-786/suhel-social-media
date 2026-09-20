import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  PersistQueryClientProvider,
  persistQueryClientSave,
  persistQueryClientRestore,
} from '@tanstack/react-query-persist-client'

// ─── User-Specific Cache Isolation ──────────────────────────────────
const getUserId = () => {
  try {
    const cached = localStorage.getItem('vibehub_cached_user')
    if (cached) {
      const user = JSON.parse(cached)
      return user?.id || user?._id || 'anonymous'
    }
  } catch { /* ignore */ }
  return 'anonymous'
}

// ─── Custom localStorage Persister ──────────────────────────────────
const CACHE_KEY = 'vibehub_query_cache'

const createLocalStoragePersister = () => {
  return {
    persistClient: async (persistedClient) => {
      try {
        const data = {
          ...persistedClient,
          _userId: getUserId(),
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify(data))
      } catch (err) {
        // localStorage full or unavailable — silently skip
        if (import.meta.env.DEV) {
          console.warn('[QUERY] Failed to persist cache:', err.message)
        }
      }
    },
    restoreClient: async () => {
      try {
        const str = localStorage.getItem(CACHE_KEY)
        if (!str) return undefined

        const data = JSON.parse(str)
        const currentUserId = getUserId()

        // If the cache belongs to a different user, reject it
        if (data._userId && data._userId !== currentUserId && data._userId !== 'anonymous') {
          if (import.meta.env.DEV) {
            console.debug('[QUERY] Cache belongs to different user, invalidating')
          }
          localStorage.removeItem(CACHE_KEY)
          return undefined
        }

        return data
      } catch {
        localStorage.removeItem(CACHE_KEY)
        return undefined
      }
    },
    removeClient: async () => {
      try {
        localStorage.removeItem(CACHE_KEY)
      } catch { /* ignore */ }
    },
  }
}

const persister = createLocalStoragePersister()

// ─── QueryClient Configuration ─────────────────────────────────────
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 1 minute — no background refetch during this window
      staleTime: 60 * 1000,
      // Keep cache in memory for 10 minutes after last subscriber unmounts
      gcTime: 10 * 60 * 1000,
      // Do NOT refetch when returning to the tab — prevents skeleton flash
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      // Retry once on failure
      retry: 1,
      // Important: Don't throw away previous data during background refetch
      placeholderData: (previousData) => previousData,
    },
  },
})

// ─── Persist Options ────────────────────────────────────────────────
const persistOptions = {
  persister,
  // Cache persists for 24 hours max
  maxAge: 24 * 60 * 60 * 1000,
  // Only persist non-sensitive queries
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      // Persist feed, stories, suggestions, profile data, notifications
      const persistableKeys = ['feed', 'stories', 'suggestions', 'profile', 'profile-posts', 'saved-posts', 'notifications', 'trending', 'explore']
      const firstKey = query.queryKey?.[0]

      // Don't persist if query errored
      if (query.state.status === 'error') return false

      // Only persist queries with matching keys
      return persistableKeys.includes(firstKey)
    },
  },
}

// ─── Targeted Cache Invalidation and Optimistic Update Helpers ──────
export const cacheHelpers = {
  // Feed operations
  invalidateFeed: (userId) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ['feed', userId] })
    }
  },

  updateFeedPost: (userId, postId, updater) => {
    if (!userId) return
    queryClient.setQueryData(['feed', userId], (oldData) => {
      if (!oldData) return oldData
      if (Array.isArray(oldData)) {
        const updated = oldData.map((p) => (p.id === postId ? updater(p) : p))
        updated.hasMore = oldData.hasMore
        updated.nextCursor = oldData.nextCursor
        return updated
      }
      return oldData
    })
  },

  removeFeedPost: (userId, postId) => {
    if (!userId) return
    queryClient.setQueryData(['feed', userId], (oldData) => {
      if (!oldData || !Array.isArray(oldData)) return oldData
      const filtered = oldData.filter((p) => p.id !== postId)
      filtered.hasMore = oldData.hasMore
      filtered.nextCursor = oldData.nextCursor
      return filtered
    })
  },

  prependFeedPost: (userId, newPost) => {
    if (!userId || !newPost) return
    queryClient.setQueryData(['feed', userId], (oldData) => {
      if (!oldData || !Array.isArray(oldData)) return [newPost]
      const next = [newPost, ...oldData]
      next.hasMore = oldData.hasMore
      next.nextCursor = oldData.nextCursor
      return next
    })
  },

  // Stories operations
  invalidateStories: (userId) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ['stories', userId] })
    }
  },

  // Profile operations
  invalidateProfile: (username) => {
    if (username) {
      queryClient.invalidateQueries({ queryKey: ['profile', username] })
    }
  },

  invalidateProfilePosts: (username) => {
    if (username) {
      queryClient.invalidateQueries({ queryKey: ['profile-posts', username] })
    }
  },

  invalidateSavedPosts: (userId) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ['saved-posts', userId] })
    }
  },

  // Suggestions operations
  invalidateSuggestions: (userId) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ['suggestions', userId] })
    }
  },

  // Notifications operations
  invalidateNotifications: (userId) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
      queryClient.invalidateQueries({ queryKey: ['unread-badges', userId] })
    }
  },

  setNotificationRead: (userId, notificationId) => {
    if (!userId || !notificationId) return
    queryClient.setQueryData(['notifications', userId], (oldData) => {
      if (!Array.isArray(oldData)) return oldData
      return oldData.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    })
    queryClient.invalidateQueries({ queryKey: ['unread-badges', userId] })
  },

  setAllNotificationsRead: (userId) => {
    if (!userId) return
    queryClient.setQueryData(['notifications', userId], (oldData) => {
      if (!Array.isArray(oldData)) return oldData
      return oldData.map((n) => ({ ...n, is_read: true }))
    })
    queryClient.invalidateQueries({ queryKey: ['unread-badges', userId] })
  },

  // Chat & Messages operations
  invalidateConversations: (userId) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ['conversations', userId] })
      queryClient.invalidateQueries({ queryKey: ['unread-badges', userId] })
    }
  },

  invalidateMessages: (userId, conversationId) => {
    if (userId && conversationId) {
      queryClient.invalidateQueries({ queryKey: ['messages', userId, conversationId] })
    }
  },

  appendMessage: (userId, conversationId, newMessage) => {
    if (!userId || !conversationId || !newMessage) return
    queryClient.setQueryData(['messages', userId, conversationId], (oldData) => {
      if (!Array.isArray(oldData)) return [newMessage]
      if (oldData.some((m) => m.id === newMessage.id || (m._optimisticId && m._optimisticId === newMessage._optimisticId))) {
        return oldData.map((m) => (m._optimisticId === newMessage._optimisticId || m.id === newMessage.id ? newMessage : m))
      }
      return [...oldData, newMessage]
    })
    queryClient.invalidateQueries({ queryKey: ['conversations', userId] })
  },

  removeMessage: (userId, conversationId, messageId) => {
    if (!userId || !conversationId || !messageId) return
    queryClient.setQueryData(['messages', userId, conversationId], (oldData) => {
      if (!Array.isArray(oldData)) return oldData
      return oldData.filter((m) => m.id !== messageId)
    })
    queryClient.invalidateQueries({ queryKey: ['conversations', userId] })
  },

  clearConversationMessages: (userId, conversationId) => {
    if (!userId || !conversationId) return
    queryClient.setQueryData(['messages', userId, conversationId], () => [])
    queryClient.invalidateQueries({ queryKey: ['conversations', userId] })
  },

  // Complete User Cache Eviction on Logout / Switch Account
  clearUserCache: () => {
    queryClient.clear()
    // Also remove persisted cache from localStorage
    try {
      localStorage.removeItem(CACHE_KEY)
    } catch { /* ignore */ }
  },
}

// ─── Provider Component ─────────────────────────────────────────────
export const QueryProvider = ({ children }) => {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
    >
      {children}
    </PersistQueryClientProvider>
  )
}

export default QueryProvider
