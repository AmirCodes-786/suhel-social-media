import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import PostCard from '../components/PostCard'
import CreatePostModal from '../components/CreatePostModal'
import { ArrowLeft, Loader2, Activity, Plus, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { postsService } from '../supabaseService'

const PostDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [headerSearchQuery, setHeaderSearchQuery] = useState('')

  const fetchPost = async () => {
    if (!user || !id) return
    setLoading(true)
    try {
      const data = await postsService.getPost(id, user.id)
      setPost(data)
    } catch (error) {
      console.error('Error fetching post:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && id) {
      fetchPost()
    }
  }, [user, id])

  const handleLikeUpdate = (postId, isLiked, likesCount) => {
    setPost((prev) => 
      prev && prev.id === postId 
        ? { ...prev, is_liked: isLiked, likes_count: likesCount } 
        : prev
    )
  }

  const handleSaveUpdate = (postId, isSaved) => {
    setPost((prev) => 
      prev && prev.id === postId 
        ? { ...prev, is_saved: isSaved } 
        : prev
    )
  }

  const handleDeletePost = (postId) => {
    navigate('/')
  }

  const handlePostCreated = (newPost, type) => {
    if (type === 'post') {
      navigate('/')
    }
  }

  const handleHeaderSearchSubmit = (e) => {
    e.preventDefault()
    if (headerSearchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(headerSearchQuery.trim())}`)
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
        <form onSubmit={handleHeaderSearchSubmit} className="hidden md:flex items-center relative w-96">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search vibe..."
            value={headerSearchQuery}
            onChange={(e) => setHeaderSearchQuery(e.target.value)}
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
          
          {/* Back Action Header */}
          <div className="flex items-center gap-3.5 mb-6 text-left shrink-0">
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center justify-center h-9 w-9 rounded-xl bg-white border border-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-all cursor-pointer shadow-sm"
              title="Go Back"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </button>
            <h3 className="text-base font-bold text-slate-900">
              Vibe Detail
            </h3>
          </div>

          {/* Post Content Display */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
              <span className="text-xs">Fetching vibe details...</span>
            </div>
          ) : !post ? (
            <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-800">Post not found</h4>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                This vibe might have been deleted by the author or is unavailable.
              </p>
              <Link 
                to="/" 
                className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-5 rounded-xl transition-colors cursor-pointer"
              >
                Go to Feed
              </Link>
            </div>
          ) : (
            <PostCard
              post={post}
              onLikeUpdate={handleLikeUpdate}
              onSaveUpdate={handleSaveUpdate}
              onDeletePost={handleDeletePost}
            />
          )}
        </main>

      </div>

      {/* Post Modal */}
      <CreatePostModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onPostCreated={handlePostCreated} />
    </div>
  )
}

export default PostDetail
