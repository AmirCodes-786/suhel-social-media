import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 1 minute stale time: data is considered fresh for 1 min, no background refetch
      staleTime: 60 * 1000,
      // 10 minutes cache garbage collection time
      gcTime: 10 * 60 * 1000,
      // Crucial: do NOT refetch when returning to the tab!
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
})

// Targeted Cache Invalidation and Optimistic Update Helpers
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
      // Avoid duplicate if already present (e.g. from optimistic ID match)
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
  },
}

export const QueryProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

export default QueryProvider
