import React, { useState, useEffect, useRef, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import StoriesBar from '../components/StoriesBar'
import PostCard from '../components/PostCard'
import FeedSkeleton, { PostCardSkeleton } from '../components/FeedSkeleton'
import CreatePostModal from '../components/CreatePostModal'
import StoryViewerModal from '../components/StoryViewerModal'
import PageTransition from '../components/PageTransition'
import { Activity, Plus, Search, Loader2, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { postsService, storiesService, profilesService, followsService, notificationsService, chatService } from '../supabaseService'

const Feed = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [stories, setStories] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [loadingStories, setLoadingStories] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createDefaultType, setCreateDefaultType] = useState('post')
  const [activeStoryGroup, setActiveStoryGroup] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Pagination & infinite scroll states
  const [hasMore, setHasMore] = useState(true)
  const [nextCursor, setNextCursor] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const sentinelRef = useRef(null)

  // Stats for badge
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  // Fetch initial feed posts (Page 1)
  const fetchFeedPosts = useCallback(async () => {
    if (!user) return
    setLoadingPosts(true)
    try {
      const data = await postsService.getFeed(user.id, { limit: 12 })
      setPosts(data)
      setHasMore(Boolean(data.hasMore))
      setNextCursor(data.nextCursor || null)
    } catch (error) {
      console.error('Error fetching feed posts:', error)
    } finally {
      setLoadingPosts(false)
    }
  }, [user])

  // Load next batch of posts via cursor
  const loadMorePosts = useCallback(async () => {
    if (!user || loadingMore || !hasMore || !nextCursor) return
    setLoadingMore(true)
    try {
      const nextBatch = await postsService.getFeed(user.id, { limit: 10, cursor: nextCursor })
      if (nextBatch && nextBatch.length > 0) {
        setPosts((prev) => [...prev, ...nextBatch])
        setHasMore(Boolean(nextBatch.hasMore))
        setNextCursor(nextBatch.nextCursor || null)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading more posts:', error)
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [user, loadingMore, hasMore, nextCursor])

  // Infinite Scroll IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loadingPosts) {
          loadMorePosts()
        }
      },
      { rootMargin: '300px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loadingPosts, loadMorePosts])

  // Fetch stories
  const fetchStories = useCallback(async () => {
    if (!user) return
    setLoadingStories(true)
    try {
      const data = await storiesService.getStories(user.id)
      setStories(data)
    } catch (error) {
      console.error('Error fetching stories:', error)
    } finally {
      setLoadingStories(false)
    }
  }, [user])

  // Fetch suggestions
  const fetchSuggestions = useCallback(async () => {
    if (!user) return
    try {
      const data = await profilesService.getSuggestions(user.id)
      setSuggestions(data.slice(0, 5))
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    }
  }, [user])

  // Fetch badge metrics using lightweight indexed count endpoints
  const fetchBadges = useCallback(async () => {
    if (!user) return
    try {
      const [notifCount, chatCount] = await Promise.all([
        notificationsService.getUnreadCount(),
        chatService.getUnreadCount(),
      ])
      setUnreadNotifications(notifCount)
      setUnreadMessages(chatCount)
    } catch (error) {
      console.error('Error fetching badges:', error)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchFeedPosts()
      fetchStories()
      fetchSuggestions()
      fetchBadges()
    }

    // Efficient background sync: 30s interval, only when tab is visible
    const interval = setInterval(() => {
      if (user && document.visibilityState === 'visible') {
        fetchBadges()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [user, fetchFeedPosts, fetchStories, fetchSuggestions, fetchBadges])

  const handlePostCreated = (newPost, type) => {
    if (type === 'post') {
      if (newPost) {
        setPosts((prev) => [newPost, ...prev])
      }
      fetchFeedPosts()
    } else {
      fetchStories()
    }
  }

  const handleLikeUpdate = useCallback((postId, isLiked, likesCount) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, is_liked: isLiked, likes_count: likesCount } : p))
    )
  }, [])

  const handleSaveUpdate = useCallback((postId, isSaved) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, is_saved: isSaved } : p))
    )
  }, [])

  const handleDeletePost = useCallback((postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }, [])

  const handleStoryViewed = (storyId) => {
    setStories((prevGroups) =>
      prevGroups.map((group) => ({
        ...group,
        stories: group.stories.map((s) => (s.id === storyId ? { ...s, is_viewed: true } : s)),
      }))
    )
  }

  const handleStoryDeleted = (storyId) => {
    fetchStories()
    setActiveStoryGroup(null)
  }

  const handleFollowToggle = async (targetUser) => {
    if (!user) return
    try {
      await followsService.toggleFollow(user.id, targetUser.id)
      fetchSuggestions()
      fetchFeedPosts()
    } catch (error) {
      console.error('Error toggling follow:', error)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const trendingVibes = [
    { tag: '#MinimalistDesign', count: '12.4k vibes' },
    { tag: '#VibeHubCommunity', count: '8.2k vibes' },
    { tag: '#ModernWeb', count: '5.1k vibes' },
    { tag: '#CreativeProcess', count: '3.9k vibes' },
    { tag: '#DigitalArt', count: '2.7k vibes' }
  ]

  return (
    <PageTransition className="min-h-screen w-screen bg-slate-50 text-slate-900 font-outfit pb-16 md:pb-0 flex flex-col">
      
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
        <div className="flex items-center gap-3">
          <Link
            to="/settings"
            className="md:hidden flex items-center justify-center h-9 w-9 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200/50 hover:border-indigo-100 transition-all cursor-pointer"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          </Link>

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
        <Sidebar 
          onCreateClick={() => setIsCreateOpen(true)} 
          unreadMessagesCount={unreadMessages}
          unreadNotificationsCount={unreadNotifications}
        />

        {/* Central Feed Columns */}
        <div className="flex-1 flex flex-col lg:flex-row justify-center min-w-0">
          
          {/* Feed Column */}
          <main className="flex-1 max-w-xl px-4 py-6 md:py-8 flex flex-col min-w-0">
            {/* Stories Horizontal Tray */}
            <StoriesBar 
              groupedStories={stories} 
              onStoryClick={(group) => setActiveStoryGroup(group)}
              onAddStoryClick={() => { setCreateDefaultType('story'); setIsCreateOpen(true) }}
            />

            {/* Mobile Friend Suggestions Widget */}
            {suggestions.length > 0 && (
              <div className="block lg:hidden mt-4 mb-2 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-left">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[11px] font-bold text-slate-900 tracking-wide uppercase">Who to follow</h4>
                  <Link to="/explore" className="text-[10px] font-bold text-indigo-600 hover:underline">See all</Link>
                </div>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {suggestions.map((suggestion) => (
                    <div key={suggestion.id} className="flex flex-col items-center p-3 bg-slate-50 border border-slate-100 rounded-2xl min-w-[125px] text-center shrink-0">
                      <Link to={`/profile/${suggestion.username}`} className="flex flex-col items-center gap-1.5 group mb-2.5">
                        <img
                          src={suggestion.profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                          alt={suggestion.username}
                          className="h-12 w-12 rounded-full border border-slate-100 object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-800 leading-tight truncate max-w-[95px]">
                            {suggestion.first_name || suggestion.username}
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5 truncate max-w-[95px]">@{suggestion.username}</span>
                        </div>
                      </Link>
                      <button
                        onClick={() => handleFollowToggle(suggestion)}
                        className="w-full py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-[10px] font-bold text-white transition-colors cursor-pointer"
                      >
                        Follow
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Posts Feed */}
            <div className="space-y-6 mt-2">
              {loadingPosts ? (
                <FeedSkeleton />
              ) : posts.length === 0 ? (
                <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                  <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-sm font-semibold text-slate-800">Your feed is empty</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Follow profiles in the suggestions list on the right or explore posts to populate your feed!
                  </p>
                </div>
              ) : (
                <>
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onLikeUpdate={handleLikeUpdate}
                      onSaveUpdate={handleSaveUpdate}
                      onDeletePost={handleDeletePost}
                    />
                  ))}

                  {/* Infinite Scroll Bottom Sentinel & Loader */}
                  <div ref={sentinelRef} className="py-4 flex justify-center w-full">
                    {loadingMore && <PostCardSkeleton />}
                    {!hasMore && posts.length > 0 && (
                      <span className="text-[11px] text-slate-400 font-light">
                        You're all caught up with the latest vibes ✨
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {/* Mobile Footer text */}
            <div className="py-8 text-center text-xs text-slate-400 font-light md:hidden">
              Fetching more vibes...
            </div>
          </main>

          {/* Right Sidebar Widgets */}
          <aside className="hidden lg:flex flex-col w-80 shrink-0 p-8 h-[calc(100vh-64px)] sticky top-16 space-y-6 text-left overflow-y-auto no-scrollbar">
            
            {/* Trending Vibes Widget */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-slate-900 tracking-wide uppercase">Trending Vibes</h4>
                <Link to="/explore" className="text-[10px] font-bold text-indigo-600 hover:underline">See all</Link>
              </div>
              <div className="space-y-3.5">
                {trendingVibes.map((vibe) => (
                  <div key={vibe.tag} className="flex flex-col group cursor-pointer">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {vibe.tag}
                    </span>
                    <span className="text-[10px] text-slate-400 font-light mt-0.5">
                      {vibe.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Who to follow suggestions Widget */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-slate-900 tracking-wide uppercase">Who to follow</h4>
                <Link to="/explore" className="text-[10px] font-bold text-indigo-600 hover:underline">Show more</Link>
              </div>
              <div className="space-y-4">
                {suggestions.length === 0 ? (
                  <span className="text-xs text-slate-400">No suggestions available</span>
                ) : (
                  suggestions.slice(0, 3).map((suggestion) => (
                    <div key={suggestion.id} className="flex items-center justify-between">
                      <Link to={`/profile/${suggestion.username}`} className="flex items-center gap-3 group">
                        <img
                          src={suggestion.profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                          alt={suggestion.username}
                          className="h-8 w-8 rounded-full border border-slate-100 object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                            {suggestion.first_name || suggestion.username}
                          </span>
                          <span className="text-[9px] text-slate-400 font-light">
                            @{suggestion.username}
                          </span>
                        </div>
                      </Link>
                      <button
                        onClick={() => handleFollowToggle(suggestion)}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer bg-slate-50 hover:bg-indigo-50 border border-slate-200/50 rounded-lg px-2.5 py-1"
                      >
                        {suggestion.is_following ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Widget Footer */}
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] text-slate-400 font-light px-2">
              <Link to="/" className="hover:text-slate-600">About</Link>
              <Link to="/" className="hover:text-slate-600">Privacy Policy</Link>
              <Link to="/" className="hover:text-slate-600">Terms of Service</Link>
              <Link to="/" className="hover:text-slate-600">Cookies</Link>
              <span>© 2024 VibeHub</span>
            </div>

          </aside>

        </div>
      </div>

      {/* Floating modals */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => { setIsCreateOpen(false); setCreateDefaultType('post') }}
        onPostCreated={handlePostCreated}
        defaultType={createDefaultType}
      />

      {activeStoryGroup && (
        <StoryViewerModal
          activeGroup={activeStoryGroup}
          groupList={stories}
          onClose={() => setActiveStoryGroup(null)}
          onStoryViewed={handleStoryViewed}
          onStoryDeleted={handleStoryDeleted}
        />
      )}
    </PageTransition>
  )
}

export default Feed
