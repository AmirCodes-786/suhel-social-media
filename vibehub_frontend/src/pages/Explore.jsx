import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import PostCard from '../components/PostCard'
import CreatePostModal from '../components/CreatePostModal'
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

  // Fetch trending posts (sorted by engagement on the client)
  const fetchTrendingPosts = async () => {
    if (!user) return
    setLoadingTrending(true)
    try {
      const data = await postsService.getFeed(user.id)
      const sorted = [...data].sort((a, b) => {
        const scoreA = (a.likes_count || 0) + (a.comments_count || 0)
        const scoreB = (b.likes_count || 0) + (b.comments_count || 0)
        return scoreB - scoreA
      })
      setTrendingPosts(sorted)
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
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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
          
          {/* Search Input */}
          <div className="relative mb-6 text-left">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search profiles, creators, friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400 shadow-sm"
            />
          </div>

          {/* Search Results Display */}
          {searchQuery.trim() !== '' && (
            <div className="space-y-4 mb-6 text-left">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <span>Matching Profiles</span>
              </h4>

              {searching ? (
                <div className="flex justify-center py-6 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-6 text-slate-400 text-xs bg-white border border-slate-100 rounded-2xl text-center shadow-sm">
                  No profiles match "{searchQuery}"
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {searchResults.map((profile) => (
                    <Link
                      key={profile.id}
                      to={`/profile/${profile.username}`}
                      className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl transition-colors group shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={profile.profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                          alt={profile.username}
                          className="h-10 w-10 rounded-full border border-slate-100 object-cover"
                        />
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight">
                            {profile.first_name ? `${profile.first_name} ${profile.last_name || ''}` : profile.username}
                          </span>
                          <span className="text-[10px] text-slate-400 font-light mt-0.5">@{profile.username}</span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Explore / Trending Grid */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 text-left">
              <Compass className="h-3.5 w-3.5 text-slate-400" />
              <span>Trending Vibes</span>
            </h4>

            {loadingTrending ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
                <span className="text-xs">Loading trends...</span>
              </div>
            ) : trendingPosts.length === 0 ? (
              <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <Compass className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-800">No trends yet</h4>
                <p className="text-xs text-slate-500 mt-1">
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
    </div>
  )
}

export default Explore
