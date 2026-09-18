import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import PostCard from '../components/PostCard'
import CreatePostModal from '../components/CreatePostModal'
import PageTransition from '../components/PageTransition'
import { Search, Compass, Users, Loader2, ArrowRight, Activity, Plus } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { profilesService, postsService } from '../supabaseService'

const Explore = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryParam = searchParams.get('q') || ''

  const [searchQuery, setSearchQuery] = useState(queryParam)
  const [headerSearchQuery, setHeaderSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [trendingPosts, setTrendingPosts] = useState([])
  const [searching, setSearching] = useState(false)
  const [loadingTrending, setLoadingTrending] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  useEffect(() => {
    setSearchQuery(queryParam)
  }, [queryParam])

  // Fetch trending posts directly from optimized server endpoint
  const fetchTrendingPosts = async () => {
    if (!user) return
    setLoadingTrending(true)
    try {
      const data = await postsService.getTrending(user.id)
      setTrendingPosts(data || [])
    } catch (error) {
      console.error('Error fetching trending posts:', error)
    } finally {
      setLoadingTrending(false)
    }
  }

  // Handle live search
  useEffect(() => {
    if (!searchQuery.trim() || !user) {
      setSearchResults([])
      return
    }

    const delayDebounce = setTimeout(async () => {
      setSearching(true)
      try {
        const data = await profilesService.searchUsers(searchQuery)
        setSearchResults(data.filter(u => u.id !== user.id))
      } catch (error) {
        console.error('Error searching users:', error)
      } finally {
        setSearching(false)
      }
    }, 400) // 400ms debounce

    return () => clearTimeout(delayDebounce)
  }, [searchQuery, user])

  useEffect(() => {
    if (user) {
      fetchTrendingPosts()
    }
  }, [user])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('explore-posts-changes')
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          const deletedId = payload.old?.id
          if (deletedId) {
            setTrendingPosts((prev) => prev.filter((p) => p.id !== deletedId))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const handleLikeUpdate = (postId, isLiked, likesCount) => {
    setTrendingPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, is_liked: isLiked, likes_count: likesCount } : p))
    )
  }

  const handleSaveUpdate = (postId, isSaved) => {
    setTrendingPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, is_saved: isSaved } : p))
    )
  }

  const handleDeletePost = (postId) => {
    setTrendingPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  const handlePostCreated = (newPost, type) => {
    if (type === 'post') {
      setTrendingPosts((prev) => [newPost, ...prev])
    }
  }

  const handleHeaderSearchSubmit = (e) => {
    e.preventDefault()
    if (headerSearchQuery.trim()) {
      setSearchQuery(headerSearchQuery.trim())
    }
  }

  return (
    <PageTransition className="min-h-screen w-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-outfit pb-16 md:pb-0 flex flex-col">
      
      {/* Top Header Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 z-40">
        {/* Left: Brand */}
        <Link to="/" className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          <span className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">VibeHub</span>
        </Link>

        {/* Center: Search */}
        <form onSubmit={handleHeaderSearchSubmit} className="hidden md:flex items-center relative w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search vibe..."
            value={headerSearchQuery}
            onChange={(e) => setHeaderSearchQuery(e.target.value)}
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
          
          {/* Search Input */}
          <div className="relative mb-6 text-left">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search profiles, creators, friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm"
            />
          </div>

          {/* Search Results Display */}
          {searchQuery.trim() !== '' && (
            <div className="space-y-4 mb-6 text-left">
              <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                <span>Matching Profiles</span>
              </h4>

              {searching ? (
                <div className="flex justify-center py-6 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-6 text-slate-400 dark:text-slate-500 text-xs bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-center shadow-sm">
                  No profiles match "{searchQuery}"
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {searchResults.map((profile) => (
                    <Link
                      key={profile.id}
                      to={`/profile/${profile.username}`}
                      className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-2xl transition-colors group shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={profile.profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                          alt={profile.username}
                          className="h-10 w-10 rounded-full border border-slate-100 dark:border-slate-800 object-cover"
                        />
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                            {profile.first_name ? `${profile.first_name} ${profile.last_name || ''}` : profile.username}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-light mt-0.5">@{profile.username}</span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Explore / Trending Grid */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 text-left">
              <Compass className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <span>Trending Vibes</span>
            </h4>

            {loadingTrending ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
                <span className="text-xs">Loading trends...</span>
              </div>
            ) : trendingPosts.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <Compass className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No trends yet</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Trending posts are compiled based on engagement. Check back later!
                </p>
              </div>
            ) : (
              trendingPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLikeUpdate={handleLikeUpdate}
                  onSaveUpdate={handleSaveUpdate}
                  onDeletePost={handleDeletePost}
                />
              ))
            )}
          </div>
        </main>

      </div>

      {/* Post Modal */}
      <CreatePostModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onPostCreated={handlePostCreated} />
    </PageTransition>
  )
}

export default Explore
