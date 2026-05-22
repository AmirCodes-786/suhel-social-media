import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import CreatePostModal from '../components/CreatePostModal'
import { Bell, Heart, MessageSquare, UserPlus, CheckCircle2, Loader2, Activity, Search, Plus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { notificationsService } from '../supabaseService'

const Notifications = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handlePostCreated = (newPost, type) => {
    if (type === 'post') {
      navigate('/')
    }
  }

  const fetchNotifications = async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await notificationsService.getNotifications()
      setNotifications(data)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAllRead = async () => {
    if (!user) return
    try {
      await notificationsService.markAllAsRead(user.id)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const handleNotificationClick = async (notif) => {
    if (!user) return

    if (!notif.is_read) {
      try {
        await notificationsService.markAsRead(notif.id)
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n))
      } catch (error) {
        console.error('Error marking notification read:', error)
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

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="h-4 w-4 text-sky-500" />
      case 'like':
        return <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-emerald-500" />
      default:
        return <Bell className="h-4 w-4 text-indigo-600" />
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
    <div className="min-h-screen w-screen bg-slate-50 text-slate-900 font-outfit pb-16 md:pb-0 flex flex-col">
      
      {/* Top Header Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 z-40">
        {/* Left: Brand */}
        <Link to="/" className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-indigo-600 animate-pulse" />
          <span className="text-xl font-bold tracking-tight text-slate-950">VibeHub</span>
        </Link>

        {/* Center: Search */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search vibe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-transparent rounded-full py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-200 transition-all"
          />
        </form>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center justify-center h-9 w-9 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200/50 hover:border-indigo-100 transition-all cursor-pointer"
            title="Create Post"
          >
            <Plus className="h-5 w-5" />
          </button>
          
          <Link to={`/profile/${user?.username}`}>
            <img
              src={user?.profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
              alt={user?.username}
              className="h-9 w-9 rounded-full object-cover border border-slate-200 hover:border-indigo-500 transition-colors"
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
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bell className="h-4.5 w-4.5 text-indigo-600" />
              <span>Notifications</span>
            </h3>
            {notifications.some(n => !n.is_read) && (
              <button 
                onClick={handleMarkAllRead}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* List items */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
                <span className="text-xs">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <Bell className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-800">Quiet here</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  You'll receive notifications when profiles like, comment, message, or follow you!
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex items-start justify-between p-4 bg-white border rounded-2xl transition-all cursor-pointer text-left shadow-sm ${
                    notif.is_read 
                      ? 'border-slate-100 opacity-60' 
                      : 'border-indigo-100 hover:bg-slate-50 ring-1 ring-indigo-500/5'
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Left avatar */}
                    <Link to={`/profile/${notif.sender_detail?.username}`} onClick={(e) => e.stopPropagation()}>
                      <img
                        src={notif.sender_detail?.profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                        alt={notif.sender_detail?.username}
                        className="h-10 w-10 rounded-full border border-slate-100 object-cover shrink-0"
                      />
                    </Link>

                    {/* Body Details */}
                    <div className="flex flex-col">
                      <p className="text-xs text-slate-700 leading-normal">
                        <Link to={`/profile/${notif.sender_detail?.username}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors">
                          @{notif.sender_detail?.username}
                        </Link>{' '}
                        {getNotificationMessage(notif)}
                      </p>
                      <span className="text-[9px] text-slate-400 font-light mt-1">
                        {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>

                  {/* Right category icon */}
                  <div className="h-8 w-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 ml-3">
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
