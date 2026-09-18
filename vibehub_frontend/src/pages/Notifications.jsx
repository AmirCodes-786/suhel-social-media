import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import CreatePostModal from '../components/CreatePostModal'
import { 
  Bell, 
  Heart, 
  MessageSquare, 
  UserPlus, 
  CheckCircle2, 
  Loader2, 
  Activity, 
  Search, 
  Plus, 
  AlertCircle, 
  RefreshCw 
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { notificationsService } from '../supabaseService'
import { cacheHelpers } from '../context/QueryProvider'

const Notifications = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const userId = user?.id || user?._id

  // TanStack Query for user-isolated cached notifications
  const {
    data: notifications = [],
    isPending,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => notificationsService.getNotifications(userId),
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
  })

  // Show skeleton loader ONLY when no cache exists and the initial query is pending
  const showInitialLoading = isPending && notifications.length === 0

  const handlePostCreated = (newPost, type) => {
    if (type === 'post') {
      navigate('/')
    }
  }

  // Optimistic mark all as read
  const handleMarkAllRead = async () => {
    if (!userId) return
    cacheHelpers.setAllNotificationsRead(userId)
    try {
      await notificationsService.markAllAsRead(userId)
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      refetch()
    }
  }

  // Optimistic click & mark single read
  const handleNotificationClick = async (notif) => {
    if (!userId) return

    if (!notif.is_read) {
      cacheHelpers.setNotificationRead(userId, notif.id)
      try {
        await notificationsService.markAsRead(notif.id)
      } catch (err) {
        console.error('Error marking notification read:', err)
      }
    }

    // Navigate to respective target
    if (notif.type === 'like' || notif.type === 'comment') {
      if (notif.post) {
        navigate(`/post/${notif.post}`)
      }
    } else if (notif.type === 'follow') {
      if (notif.sender_detail?.username) {
        navigate(`/profile/${notif.sender_detail.username}`)
      }
    } else if (notif.type === 'message') {
      navigate('/messages')
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="h-4 w-4 text-sky-500" />
      case 'like':
        return <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-emerald-500" />
      default:
        return <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
    }
  }

  const getNotificationMessage = (notif) => {
    switch (notif.type) {
      case 'follow':
        return `started following you.`
      case 'like':
        return `liked your post: "${notif.post_content_preview || ''}"`
      case 'comment':
        return `commented on your post: "${notif.post_content_preview || ''}"`
      case 'message':
        return `sent you a direct message.`
      default:
        return `interacted with you.`
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <div className="min-h-screen w-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-outfit pb-16 md:pb-0 flex flex-col">
      
      {/* Top Header Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 z-40">
        {/* Left: Brand */}
        <Link to="/" className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          <span className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">VibeHub</span>
        </Link>

        {/* Center: Search */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search vibe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-transparent dark:border-slate-700/50 rounded-full py-2 pl-10 pr-4 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-slate-200 dark:focus:border-slate-700 transition-all"
          />
        </form>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center justify-center h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/50 dark:border-slate-700/50 hover:border-indigo-100 dark:hover:border-indigo-800 transition-all cursor-pointer"
            title="Create Post"
          >
            <Plus className="h-5 w-5" />
          </button>
          
          <Link
            to="/settings"
            className="md:hidden flex items-center justify-center h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/50 dark:border-slate-700/50 hover:border-indigo-100 dark:hover:border-indigo-800 transition-all cursor-pointer"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          </Link>

          <Link to={`/profile/${user?.username}`}>
            <img
              src={user?.profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
              alt={user?.username}
              className="h-9 w-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-colors"
            />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex pt-16 md:pl-64">
        
        {/* Left Sidebar navigation */}
        <Sidebar onCreateClick={() => setIsCreateOpen(true)} />

        {/* Main Content */}
        <main className="flex-1 max-w-xl mx-auto px-4 py-6 md:py-8 flex flex-col min-w-0">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-6 text-left shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                <span>Notifications</span>
              </h3>
              {/* Subtle background revalidation indicator */}
              {isFetching && !showInitialLoading && (
                <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 animate-pulse ml-2" title="Refreshing in background...">
                  <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />
                  <span className="hidden sm:inline">Updating</span>
                </span>
              )}
            </div>

            {notifications.some((n) => !n.is_read) && (
              <button 
                onClick={handleMarkAllRead}
                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* Background error banner if cached data is visible but revalidation failed */}
          {isError && notifications.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Couldn't update notifications. Showing cached data.</span>
              </div>
              <button
                onClick={() => refetch()}
                className="font-bold underline ml-2 hover:opacity-80 cursor-pointer text-[11px]"
              >
                Retry
              </button>
            </div>
          )}

          {/* List items */}
          <div className="space-y-3">
            {showInitialLoading ? (
              /* SKELETON UI - Only rendered when first request is pending without cached data */
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
                        <div className="h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded-md w-1/4" />
                      </div>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0 ml-3" />
                  </div>
                ))}
              </div>
            ) : isError && notifications.length === 0 ? (
              /* ERROR STATE WITH RETRY - Real request failure with no cache */
              <div className="text-center py-16 bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-950/40 rounded-2xl p-8 shadow-sm">
                <div className="h-12 w-12 rounded-full bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center mx-auto mb-3 text-rose-500">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Unable to load notifications
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto mb-5">
                  {error?.message || 'We had trouble connecting to the server. Please check your connection and try again.'}
                </p>
                <button
                  onClick={() => refetch()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Try Again</span>
                </button>
              </div>
            ) : notifications.length === 0 ? (
              /* EMPTY STATE - Succeeded but user genuinely has 0 notifications */
              <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <Bell className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Quiet here</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  You'll receive notifications when profiles like, comment, message, or follow you!
                </p>
              </div>
            ) : (
              /* SUCCESS STATE - Render list of notifications */
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex items-start justify-between p-4 bg-white dark:bg-slate-900 border rounded-2xl transition-all cursor-pointer text-left shadow-sm ${
                    notif.is_read 
                      ? 'border-slate-100 dark:border-slate-800/80 opacity-60' 
                      : 'border-indigo-100 dark:border-indigo-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 ring-1 ring-indigo-500/5'
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Left avatar */}
                    <Link to={`/profile/${notif.sender_detail?.username}`} onClick={(e) => e.stopPropagation()}>
                      <img
                        src={notif.sender_detail?.profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                        alt={notif.sender_detail?.username}
                        className="h-10 w-10 rounded-full border border-slate-100 dark:border-slate-800 object-cover shrink-0"
                      />
                    </Link>

                    {/* Body Details */}
                    <div className="flex flex-col">
                      <p className="text-xs text-slate-700 dark:text-slate-200 leading-normal">
                        <Link to={`/profile/${notif.sender_detail?.username}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                          @{notif.sender_detail?.username}
                        </Link>{' '}
                        {getNotificationMessage(notif)}
                      </p>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-light mt-1">
                        {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>

                  {/* Right category icon */}
                  <div className="h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0 ml-3">
                    {getNotificationIcon(notif.type)}
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

      </div>

      {/* Post creation modal */}
      <CreatePostModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onPostCreated={handlePostCreated}
      />
    </div>
  )
}

export default Notifications
