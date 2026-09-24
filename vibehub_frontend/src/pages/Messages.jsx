import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Sidebar from '../components/Sidebar'
import { 
  Plus, 
  MessageSquare, 
  Loader2, 
  ArrowLeft, 
  MoreVertical, 
  Activity, 
  Search, 
  Phone, 
  Video, 
  Trash2,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { chatService, followsService } from '../supabaseService'
import { cacheHelpers } from '../context/QueryProvider'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import ConfirmationModal from '../components/ConfirmationModal'
import { useTheme } from '../context/ThemeContext'
import MediaViewerModal from '../components/MediaViewerModal'
import useChatViewport from '../hooks/useChatViewport'
import ChatComposer from '../components/chat/ChatComposer'
import MessageBubble from '../components/chat/MessageBubble'
import ConversationItem from '../components/chat/ConversationItem'

const Messages = () => {
  const { user } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const currentUserId = user?.id || user?._id

  // Viewport tracking hook for mobile chrome and virtual keyboard
  const { viewportHeight, isKeyboardOpen } = useChatViewport()

  const [activeConversation, setActiveConversation] = useState(null)
  const [viewerMedia, setViewerMedia] = useState(null)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [convSearchQuery, setConvSearchQuery] = useState('')
  const [deleteMsgModal, setDeleteMsgModal] = useState({ isOpen: false, messageId: null })
  const [clearChatModalOpen, setClearChatModalOpen] = useState(false)

  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const composerRef = useRef(null)
  const isNearBottomRef = useRef(true)
  const prevConvIdRef = useRef(null)
  const prevMessagesLengthRef = useRef(0)
  const prevScrollHeightRef = useRef(0)

  // 1. TanStack Query: Conversations List
  const {
    data: conversations = [],
    isPending: isConvPending,
    isFetching: isConvFetching,
    isError: isConvError,
    error: convError,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ['conversations', currentUserId],
    queryFn: () => chatService.getConversations(currentUserId),
    enabled: Boolean(currentUserId),
    staleTime: 30 * 1000,
    refetchInterval: 10000,
  })

  // 2. TanStack Query: Messages for Active Conversation
  const {
    data: messages = [],
    isPending: isMsgPending,
    isFetching: isMsgFetching,
    isError: isMsgError,
    error: msgError,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ['messages', currentUserId, activeConversation?.id],
    queryFn: async () => {
      if (!activeConversation?.id) return []
      const data = await chatService.getMessages(activeConversation.id)
      // Background mark-as-read
      chatService.markAsRead(activeConversation.id, currentUserId).catch(() => {})
      return data || []
    },
    enabled: Boolean(currentUserId && activeConversation?.id),
    staleTime: 15 * 1000,
    refetchInterval: 4000,
  })

  // 3. TanStack Query: Followed Friends for Quick Direct Messages
  const {
    data: friends = [],
  } = useQuery({
    queryKey: ['friends-following', user?.username],
    queryFn: () => followsService.getFollowing(user.username),
    enabled: Boolean(user?.username),
    staleTime: 60 * 1000,
  })

  // Helper to scroll container safely without triggering window scroll
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    const container = messagesContainerRef.current
    if (!container) return

    if (behavior === 'auto') {
      container.scrollTop = container.scrollHeight
    } else {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [])

  // Track scroll position to support smart auto-scroll and history anchoring
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight
    isNearBottomRef.current = distanceFromBottom < 100
  }, [])

  // Scroll to bottom on conversation switch
  useEffect(() => {
    if (!activeConversation?.id) return

    if (prevConvIdRef.current !== activeConversation.id) {
      prevConvIdRef.current = activeConversation.id
      isNearBottomRef.current = true
      // Reset scroll immediately
      requestAnimationFrame(() => {
        scrollToBottom('auto')
      })
    }
  }, [activeConversation?.id, scrollToBottom])

  // Smart message auto-scroll & scroll anchoring when messages update
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const currentLen = messages.length
    const prevLen = prevMessagesLengthRef.current

    if (currentLen > prevLen) {
      const lastMessage = messages[messages.length - 1]
      const isMyMessage = lastMessage?.sender === currentUserId

      // If user sent a message OR is already near bottom, scroll down smoothly
      if (isMyMessage || isNearBottomRef.current) {
        requestAnimationFrame(() => {
          scrollToBottom('smooth')
        })
      }
    }

    prevMessagesLengthRef.current = currentLen
    prevScrollHeightRef.current = container.scrollHeight
  }, [messages, currentUserId, scrollToBottom])

  // When keyboard opens, ensure latest message remains in view if user was at bottom
  useEffect(() => {
    if (isKeyboardOpen && isNearBottomRef.current && activeConversation) {
      const timeout = setTimeout(() => {
        scrollToBottom('smooth')
      }, 150)
      return () => clearTimeout(timeout)
    }
  }, [isKeyboardOpen, activeConversation, scrollToBottom])

  // Supabase Realtime channel for live messages
  useEffect(() => {
    if (!activeConversation?.id) return

    const channel = supabase
      .channel(`room:${activeConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ['messages', currentUserId, activeConversation.id]
          })
          queryClient.invalidateQueries({
            queryKey: ['conversations', currentUserId]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeConversation?.id, currentUserId, queryClient])

  // Auto-focus composer when typing on desktop
  useEffect(() => {
    if (!activeConversation) return

    const handleGlobalKeyDown = (e) => {
      const activeEl = document.activeElement
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.isContentEditable)
      ) {
        return
      }
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) {
        return
      }
      if (composerRef.current) {
        e.preventDefault()
        composerRef.current.appendText(e.key)
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [activeConversation])

  const handleStartChat = useCallback(async (friend) => {
    if (!currentUserId || !friend) return
    try {
      const convId = await chatService.getOrCreateConversation(currentUserId, friend.id)
      const found = conversations.find((c) => c.id === convId)
      if (found) {
        setActiveConversation(found)
      } else {
        await refetchConversations()
        setActiveConversation({
          id: convId,
          partner: friend,
          participants_detail: [user, friend],
          unread_count: 0,
        })
      }
    } catch (error) {
      console.error('Error starting chat with friend:', error)
    }
  }, [currentUserId, conversations, refetchConversations, user])

  const handleSendMessage = useCallback(async ({ content, mediaFile, mediaType, mediaPreview }) => {
    if (!content && !mediaFile) return
    if (!currentUserId || !activeConversation) return

    const messageText = content
    const tempId = `temp-${Date.now()}`

    // Optimistic message
    const optimisticMsg = {
      id: tempId,
      _optimisticId: tempId,
      conversation: activeConversation.id,
      sender: currentUserId,
      sender_detail: user,
      content: messageText,
      media: mediaPreview,
      media_type: mediaType,
      created_at: new Date().toISOString(),
      is_read: false,
      isOptimistic: true,
    }

    cacheHelpers.appendMessage(currentUserId, activeConversation.id, optimisticMsg)
    setSending(true)

    // Scroll to bottom immediately on sending
    requestAnimationFrame(() => {
      scrollToBottom('smooth')
    })

    try {
      const sentData = await chatService.sendMessage(
        activeConversation.id,
        currentUserId,
        messageText,
        mediaFile,
        mediaType
      )

      queryClient.setQueryData(['messages', currentUserId, activeConversation.id], (old) => {
        if (!Array.isArray(old)) return [sentData]
        return old.map((m) => (m.id === tempId || m._optimisticId === tempId ? sentData : m))
      })

      queryClient.setQueryData(['conversations', currentUserId], (old) => {
        if (!Array.isArray(old)) return old
        return old.map((c) =>
          c.id === activeConversation.id
            ? { ...c, last_message: sentData, updated_at: sentData.created_at }
            : c
        ).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      })
    } catch (error) {
      console.error('Error sending message:', error)
      queryClient.setQueryData(['messages', currentUserId, activeConversation.id], (old) => {
        if (!Array.isArray(old)) return old
        return old.map((m) => (m.id === tempId ? { ...m, isOptimistic: false, failed: true } : m))
      })
    } finally {
      setSending(false)
    }
  }, [currentUserId, activeConversation, user, queryClient, scrollToBottom])

  const handleDeleteMessage = useCallback((messageId) => {
    setDeleteMsgModal({ isOpen: true, messageId })
  }, [])

  const confirmDeleteMessage = useCallback(async () => {
    const { messageId } = deleteMsgModal
    if (!messageId || !activeConversation) return
    try {
      await chatService.deleteMessage(messageId)
      cacheHelpers.removeMessage(currentUserId, activeConversation.id, messageId)
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }, [deleteMsgModal, activeConversation, currentUserId])

  const handleClearChat = useCallback(() => {
    if (!activeConversation) return
    setClearChatModalOpen(true)
  }, [activeConversation])

  const confirmClearChat = useCallback(async () => {
    if (!activeConversation) return
    try {
      await chatService.clearChat(activeConversation.id)
      cacheHelpers.clearConversationMessages(currentUserId, activeConversation.id)
    } catch (error) {
      console.error('Error clearing chat:', error)
    }
  }, [activeConversation, currentUserId])

  const getChatPartner = useCallback((conv) => {
    if (!conv) return null
    return conv.partner || conv.participants_detail?.find((p) => p.id !== currentUserId)
  }, [currentUserId])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      const partner = getChatPartner(conv)
      if (!partner) return false
      return partner.username?.toLowerCase().includes(convSearchQuery.toLowerCase())
    })
  }, [conversations, getChatPartner, convSearchQuery])

  const showConvSkeleton = isConvPending && conversations.length === 0
  const showMsgSkeleton = isMsgPending && messages.length === 0
  const activePartner = useMemo(() => getChatPartner(activeConversation), [activeConversation, getChatPartner])

  return (
    <div 
      className="messages-page-shell w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-outfit flex flex-col overflow-hidden relative select-none"
      style={{
        height: `${viewportHeight}px`,
        maxHeight: `${viewportHeight}px`,
        minHeight: 0
      }}
    >
      {/* Top Application Header: visible on desktop, and on mobile only when browsing conversation list */}
      <header className={`shrink-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 z-30 transition-colors md:pl-70 ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
        {/* Left: Brand */}
        <Link to="/" className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          <span className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">VibeHub</span>
        </Link>

        {/* Center: Search */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative w-80 lg:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search vibe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-transparent dark:border-slate-700/50 rounded-full py-1.5 pl-10 pr-4 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-slate-200 dark:focus:border-slate-700 transition-all"
          />
        </form>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <Link
            to="/settings"
            className="md:hidden flex items-center justify-center h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/50 dark:border-slate-700/50 hover:border-indigo-100 dark:hover:border-indigo-800 transition-all cursor-pointer"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          </Link>

          <Link
            to="/"
            className="flex items-center justify-center h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/50 dark:border-slate-700/50 hover:border-indigo-100 dark:hover:border-indigo-800 transition-all"
            title="Create"
          >
            <Plus className="h-5 w-5" />
          </Link>
          
          <Link to={`/profile/${user?.username}`}>
            <img
              src={user?.profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
              alt={user?.username || 'Profile'}
              className="h-9 w-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-colors"
            />
          </Link>
        </div>
      </header>

      {/* Main Content Area (Split between Conversations and Chat) */}
      <div className="flex-1 min-h-0 flex overflow-hidden w-full relative md:pl-64">
        {/* Left Side: Conversations List Panel */}
        <div className={`w-full md:w-80 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 min-h-0 ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 sm:p-6 pb-2 sm:pb-4 flex flex-col text-left space-y-3 shrink-0">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Messages</h3>
                {isConvFetching && !showConvSkeleton && (
                  <Loader2 className="h-3 w-3 animate-spin text-indigo-500 opacity-60" title="Updating chats" />
                )}
              </div>
              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <MoreVertical className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Conversation Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={convSearchQuery}
                onChange={(e) => setConvSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-transparent dark:border-slate-700/50 rounded-full py-1.5 pl-9 pr-4 text-[11px] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-slate-200 dark:focus:border-slate-700 transition-all"
              />
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 space-y-1.5 no-scrollbar overscroll-contain">
            {/* Direct Message Friends Horizontal Scroll */}
            {friends.length > 0 && (
              <div className="px-2 mb-3 text-left">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2.5">
                  Direct Message Friends
                </span>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                  {friends.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => handleStartChat(friend)}
                      className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none cursor-pointer"
                    >
                      <div className="relative">
                        <img
                          src={friend.profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                          alt={friend.username}
                          className="h-11 w-11 rounded-full object-cover border-2 border-transparent group-hover:border-indigo-500 transition-all shadow-sm"
                        />
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
                      </div>
                      <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate max-w-[55px] transition-colors leading-none">
                        @{friend.username}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="border-b border-slate-100/80 dark:border-slate-800 my-1"></div>
              </div>
            )}

            {showConvSkeleton ? (
              <div className="space-y-2 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                    <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isConvError && conversations.length === 0 ? (
              <div className="text-center py-8 px-4 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-100 dark:border-rose-900/40 text-left space-y-2">
                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-xs font-bold">
                  <AlertCircle className="h-4 w-4" />
                  <span>Failed to load chats</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {convError?.message || 'Unable to fetch conversation list.'}
                </p>
                <button
                  onClick={() => refetchConversations()}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer pt-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Try again</span>
                </button>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-4 text-xs text-slate-400 dark:text-slate-500 font-light space-y-2 text-left">
                <p>No conversations yet.</p>
                {friends.length === 0 && (
                  <p className="text-[10px] text-slate-400/85 dark:text-slate-500">Explore profiles and follow creators to start a chat!</p>
                )}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const partner = getChatPartner(conv)
                const isSelected = activeConversation?.id === conv.id

                return (
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    isSelected={isSelected}
                    partner={partner}
                    onSelect={(c) => setActiveConversation(c)}
                  />
                )
              })
            )}
          </div>
        </div>

        {/* Right Side: Chat Window Panel */}
        <div className={`flex-1 min-h-0 flex flex-col bg-slate-50 dark:bg-slate-950 ${!activeConversation ? 'hidden md:flex justify-center items-center text-slate-400 dark:text-slate-500' : 'flex'}`}>
          {activeConversation ? (
            <>
              {/* Chat Partner Header */}
              <div className="shrink-0 h-16 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 sm:px-6 z-10 transition-colors">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveConversation(null)}
                    className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 mr-0.5 cursor-pointer transition-colors"
                    title="Back to conversations"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="relative">
                    <img
                      src={activePartner?.profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                      alt={activePartner?.username || 'Partner'}
                      className="h-9 w-9 rounded-full border border-slate-100 dark:border-slate-800 object-cover"
                    />
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900"></span>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">
                      {activePartner?.username}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-light flex items-center gap-1">
                      Online
                      {isMsgFetching && !showMsgSkeleton && (
                        <Loader2 className="h-2.5 w-2.5 animate-spin text-indigo-500" />
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 text-slate-400 dark:text-slate-500">
                  <button className="p-2 rounded-lg hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                    <Phone className="h-4.5 w-4.5" />
                  </button>
                  <button className="p-2 rounded-lg hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                    <Video className="h-4.5 w-4.5" />
                  </button>
                  <button 
                    onClick={handleClearChat}
                    className="p-2 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title="Clear Chat"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {/* Messages Feed Viewport: independently scrollable flex child */}
              <div 
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar overscroll-contain"
              >
                {showMsgSkeleton ? (
                  <div className="space-y-4 py-8 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                        <div className={`h-12 w-48 rounded-2xl ${i % 2 === 0 ? 'bg-indigo-200 dark:bg-indigo-900/40' : 'bg-slate-200 dark:bg-slate-800'}`} />
                      </div>
                    ))}
                  </div>
                ) : isMsgError && messages.length === 0 ? (
                  <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-rose-100 dark:border-rose-900/40 max-w-sm mx-auto shadow-sm space-y-3">
                    <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Unable to load messages</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {msgError?.message || 'We could not connect to the chat service.'}
                    </p>
                    <button
                      onClick={() => refetchMessages()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer transition-all"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Try Again</span>
                    </button>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 dark:text-slate-500">
                    <MessageSquare className="h-10 w-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="text-xs">No messages yet. Say hi to start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMe = msg.sender === currentUserId
                    return (
                      <MessageBubble
                        key={msg.client_id || msg.id || index}
                        msg={msg}
                        isMe={isMe}
                        partner={activePartner}
                        onDelete={handleDeleteMessage}
                        onViewMedia={setViewerMedia}
                      />
                    )
                  })
                )}
                <div ref={messagesEndRef} className="h-0 w-0" />
              </div>

              {/* Message Composer Component: isolated & memoized for rapid typing stability */}
              <ChatComposer
                ref={composerRef}
                onSendMessage={handleSendMessage}
                sending={sending}
                theme={theme}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="h-16 w-16 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Your Messages</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs">
                Send private photos, videos, and messages to creators and friends.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navbar: sits at the bottom of the App Shell, hidden only when keyboard is actively open in chat */}
      <Sidebar
        onCreateClick={() => navigate('/')}
        unreadMessagesCount={conversations.reduce((a, c) => a + (c.unread_count || 0), 0)}
        fixedMobileNav={false}
        hideMobileNav={Boolean(activeConversation && isKeyboardOpen)}
      />

      {/* Confirmation Modal for Delete Message */}
      <ConfirmationModal
        isOpen={deleteMsgModal.isOpen}
        onClose={() => setDeleteMsgModal({ isOpen: false, messageId: null })}
        onConfirm={confirmDeleteMessage}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        confirmText="Delete"
        isDanger={true}
      />

      {/* Confirmation Modal for Clear Chat */}
      <ConfirmationModal
        isOpen={clearChatModalOpen}
        onClose={() => setClearChatModalOpen(false)}
        onConfirm={confirmClearChat}
        title="Clear Entire Chat"
        message="Are you sure you want to clear all messages in this conversation?"
        confirmText="Clear All"
        isDanger={true}
      />

      {/* Fullscreen Photo Lightbox for Chat Media */}
      <MediaViewerModal
        isOpen={Boolean(viewerMedia)}
        onClose={() => setViewerMedia(null)}
        mediaUrl={viewerMedia?.url}
        mediaAlt={viewerMedia?.alt}
      />
    </div>
  )
}

export default Messages
