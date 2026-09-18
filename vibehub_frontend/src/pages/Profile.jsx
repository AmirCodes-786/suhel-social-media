import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import PostCard from '../components/PostCard'
import CreatePostModal from '../components/CreatePostModal'
import EditProfileDrawer from '../components/EditProfileDrawer'
import FollowersFollowingModal from '../components/FollowersFollowingModal'
import { 
  User, 
  MapPin, 
  Link as LinkIcon, 
  Grid, 
  Bookmark, 
  MessageCircle, 
  Settings, 
  Plus, 
  Loader2, 
  Activity,
  Search
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { postsService, profilesService, followsService, chatService } from '../supabaseService'
import PageTransition from '../components/PageTransition'
import { motion } from 'framer-motion'
import MediaViewerModal from '../components/MediaViewerModal'

const Profile = () => {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  
  const [profileUser, setProfileUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [savedPosts, setSavedPosts] = useState([])
  const [activeTab, setActiveTab] = useState('posts') // 'posts' or 'saved'
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [loadingContent, setLoadingContent] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [followModal, setFollowModal] = useState({ isOpen: false, type: 'followers' })
  const [viewerMedia, setViewerMedia] = useState(null)

  const isOwnProfile = !username || username === 'undefined' || username === 'me' || currentUser?.username === username || currentUser?.id === username

  // Fetch profile owner details
  const fetchProfileDetails = async () => {
    if (!currentUser) return
    setLoadingProfile(true)
    
    // If viewing own profile, immediately show current user state
    if (isOwnProfile) {
      setProfileUser(currentUser)
    }

    try {
      const targetUsername = isOwnProfile ? (currentUser.username || currentUser.id) : username
      if (targetUsername && targetUsername !== 'undefined') {
        const data = await profilesService.getProfile(targetUsername, currentUser.id)
        if (data) {
          setProfileUser(data)
          return
        }
      }
      
      if (isOwnProfile) {
        setProfileUser(currentUser)
      } else {
        alert('User profile not found.')
        navigate('/')
      }
    } catch (error) {
      console.error('Error fetching profile user:', error)
      if (isOwnProfile) {
        setProfileUser(currentUser)
      } else {
        alert('User profile not found.')
        navigate('/')
      }
    } finally {
      setLoadingProfile(false)
    }
  }

  // Fetch posts created by the profile owner
  const fetchUserPosts = async () => {
    if (!currentUser) return
    setLoadingContent(true)
    try {
      const data = await postsService.getUserPosts(username, currentUser.id)
      setPosts(data)
    } catch (error) {
      console.error('Error fetching user posts:', error)
    } finally {
      setLoadingContent(false)
    }
  }

  // Fetch saved posts
  const fetchSavedPosts = async () => {
    if (!isOwnProfile || !currentUser) return
    setLoadingContent(true)
    try {
      const data = await postsService.getSavedPosts(currentUser.id)
      setSavedPosts(data || [])
    } catch (error) {
      console.error('Error fetching saved posts:', error)
    } finally {
      setLoadingContent(false)
    }
  }

  useEffect(() => {
    if (username && currentUser) {
      fetchProfileDetails()
      fetchUserPosts()
    }
  }, [username, currentUser])

  useEffect(() => {
    if (activeTab === 'saved') {
      fetchSavedPosts()
    } else {
      fetchUserPosts()
    }
  }, [activeTab])

  useEffect(() => {
    if (!currentUser) return

    const channel = supabase
      .channel('profile-posts-changes')
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
            setPosts((prev) => prev.filter((p) => p.id !== deletedId))
            setSavedPosts((prev) => prev.filter((p) => p.id !== deletedId))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser])

  const handleFollowToggle = async () => {
    if (!currentUser || !profileUser) return
    try {
      await followsService.toggleFollow(currentUser.id, profileUser.id)
      // Fetch updated profile
      const updated = await profilesService.getProfile(username, currentUser.id)
      if (updated) {
        setProfileUser(updated)
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    }
  }

  const handleStartMessage = async () => {
    if (!currentUser || !profileUser) return
    try {
      await chatService.getOrCreateConversation(currentUser.id, profileUser.id)
      navigate('/messages')
    } catch (error) {
      console.error('Error starting conversation:', error)
    }
  }

  const handleProfileUpdated = (updatedUser) => {
    setProfileUser(updatedUser)
  }

  const handleLikeUpdate = (postId, isLiked, likesCount) => {
    const updater = (list) => list.map((p) => (p.id === postId ? { ...p, is_liked: isLiked, likes_count: likesCount } : p))
    setPosts(updater)
    setSavedPosts(updater)
  }

  const handleSaveUpdate = (postId, isSaved) => {
    const updater = (list) => list.map((p) => (p.id === postId ? { ...p, is_saved: isSaved } : p))
    setPosts(updater)
    setSavedPosts(updater)
    if (!isSaved && activeTab === 'saved') {
      setSavedPosts((prev) => prev.filter((p) => p.id !== postId))
    }
  }

  const handleDeletePost = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
    setSavedPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  const handlePostCreated = (newPost, type) => {
    if (type === 'post') {
      if (isOwnProfile) {
        setPosts((prev) => [newPost, ...prev])
      }
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`)
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
          <Link
            to="/settings"
            className="md:hidden flex items-center justify-center h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/50 dark:border-slate-700/50 hover:border-indigo-100 dark:hover:border-indigo-800 transition-all cursor-pointer"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </Link>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center justify-center h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/50 dark:border-slate-700/50 hover:border-indigo-100 dark:hover:border-indigo-800 transition-all cursor-pointer"
            title="Create Post"
          >
            <Plus className="h-5 w-5" />
          </button>
          
          <Link to={`/profile/${currentUser?.username}`}>
            <img
              src={currentUser?.profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
              alt={currentUser?.username}
              className="h-9 w-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-colors"
            />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex pt-16 md:pl-64">
        
        {/* Left Sidebar navigation */}
        <Sidebar onCreateClick={() => setIsCreateOpen(true)} />

        {/* Main Profile Area */}
        <main className="flex-1 max-w-xl mx-auto flex flex-col min-w-0 py-6 md:py-8 px-4">
          {loadingProfile ? (
            <div className="flex flex-col items-center justify-center py-40 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
              <span className="text-xs">Loading profile...</span>
            </div>
          ) : (
            <div className="w-full flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              
              {/* Cover photo Banner */}
              <div 
                className="h-40 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative cursor-pointer group"
                onClick={() => {
                  if (profileUser?.profile?.cover_picture) {
                    setViewerMedia({
                      url: profileUser.profile.cover_picture,
                      alt: 'Cover photo',
                      title: `${profileUser.username}'s Cover Photo`
                    })
                  }
                }}
              >
                {profileUser?.profile?.cover_picture ? (
                  <img 
                    src={profileUser.profile.cover_picture} 
                    alt="Profile Cover" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-indigo-100 via-slate-100 to-indigo-50 dark:from-indigo-950/40 dark:via-slate-800 dark:to-indigo-900/40" />
                )}
              </div>

              {/* Profile Info Header */}
              <div className="px-6 pb-6 relative flex flex-col items-start text-left shrink-0">
                {/* Profile Avatar overlapped */}
                <div 
                  className="relative -mt-14 mb-4 h-24 w-24 shrink-0 cursor-pointer group"
                  onClick={() => {
                    const avatarUrl = profileUser?.profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80'
                    setViewerMedia({
                      url: avatarUrl,
                      alt: profileUser?.username,
                      title: `${profileUser?.username}'s Profile Picture`
                    })
                  }}
                  title="Click to expand photo"
                >
                  <img
                    src={profileUser?.profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                    alt={profileUser?.username}
                    className="h-24 w-24 rounded-full border-4 border-white dark:border-slate-900 object-cover bg-white dark:bg-slate-900 shadow-md group-hover:ring-2 ring-indigo-500 transition-all"
                  />
                </div>

                {/* Action Buttons row */}
                <div className="absolute right-6 top-6 flex gap-2">
                  {isOwnProfile ? (
                    <>
                      <button
                        onClick={() => setIsEditOpen(true)}
                        className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 hover:text-slate-800 dark:hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Settings className="h-3.5 w-3.5" />
                        <span>Edit Profile</span>
                      </button>
                      <button
                        onClick={() => setIsCreateOpen(true)}
                        className="h-8.5 w-8.5 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md cursor-pointer"
                        title="New Post"
                      >
                        <Plus className="h-4.5 w-4.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleFollowToggle}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          profileUser?.is_following 
                            ? 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200' 
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                        }`}
                      >
                        {profileUser?.is_following ? 'Following' : 'Follow'}
                      </button>
                      <button
                        onClick={handleStartMessage}
                        className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 hover:text-slate-800 dark:hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>Message</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Username details */}
                <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white mb-0.5">
                  {profileUser?.first_name ? `${profileUser.first_name} ${profileUser.last_name || ''}` : profileUser?.username}
                </h2>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">@{profileUser?.username}</span>

                {/* Biography */}
                {profileUser?.profile?.bio && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-3.5 max-w-md">
                    {profileUser.profile.bio}
                  </p>
                )}

                {/* Extra Meta Info Links */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                  {profileUser?.profile?.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{profileUser.profile.location}</span>
                    </span>
                  )}
                  {profileUser?.profile?.website && (
                    <a
                      href={profileUser.profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <LinkIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate max-w-[150px]">{profileUser.profile.website.replace(/(^\w+:|^)\/\//, '')}</span>
                    </a>
                  )}
                </div>

                {/* Stats Panel */}
                <div className="flex gap-6 mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 w-full">
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-extrabold text-slate-950 dark:text-white leading-none mb-1">
                      {profileUser?.posts_count || 0}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Posts
                    </span>
                  </div>
                  <button 
                    onClick={() => setFollowModal({ isOpen: true, type: 'followers' })}
                    className="flex flex-col text-left hover:opacity-75 transition-opacity cursor-pointer focus:outline-none bg-transparent border-0 p-0"
                  >
                    <span className="text-sm font-extrabold text-slate-950 dark:text-white leading-none mb-1">
                      {profileUser?.followers_count || 0}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Followers
                    </span>
                  </button>
                  <button 
                    onClick={() => setFollowModal({ isOpen: true, type: 'following' })}
                    className="flex flex-col text-left hover:opacity-75 transition-opacity cursor-pointer focus:outline-none bg-transparent border-0 p-0"
                  >
                    <span className="text-sm font-extrabold text-slate-950 dark:text-white leading-none mb-1">
                      {profileUser?.following_count || 0}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Following
                    </span>
                  </button>
                </div>

              </div>

              {/* Profile Grid List Tabs */}
              <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 min-h-[400px]">
                {/* Tab Navigation header */}
                <div className="flex border-y border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 relative">
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`relative flex-1 py-3 text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      activeTab === 'posts'
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    <Grid className="h-4 w-4 relative z-10" />
                    <span className="relative z-10">Posts</span>
                    {activeTab === 'posts' && (
                      <motion.div
                        layoutId="profileTabIndicator"
                        className="absolute inset-0 bg-indigo-50/50 dark:bg-indigo-950/40 border-b-2 border-indigo-600 dark:border-indigo-400 z-0"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                  </button>
                  {isOwnProfile && (
                    <button
                      onClick={() => setActiveTab('saved')}
                      className={`relative flex-1 py-3 text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        activeTab === 'saved'
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                    >
                      <Bookmark className="h-4 w-4 relative z-10" />
                      <span className="relative z-10">Saved</span>
                      {activeTab === 'saved' && (
                        <motion.div
                          layoutId="profileTabIndicator"
                          className="absolute inset-0 bg-indigo-50/50 dark:bg-indigo-950/40 border-b-2 border-indigo-600 dark:border-indigo-400 z-0"
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                      )}
                    </button>
                  )}
                </div>

                {/* Feed/List Content */}
                <div className="p-4 flex flex-col space-y-4">
                  {loadingContent ? (
                    <div className="flex justify-center py-20">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                    </div>
                  ) : (
                    <>
                      {activeTab === 'posts' ? (
                        posts.length === 0 ? (
                          <div className="text-center py-20 text-xs text-slate-400 dark:text-slate-500 font-light bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                            This user hasn't uploaded any posts yet.
                          </div>
                        ) : (
                          posts.map((post) => (
                            <PostCard
                              key={post.id}
                              post={post}
                              onLikeUpdate={handleLikeUpdate}
                              onSaveUpdate={handleSaveUpdate}
                              onDeletePost={handleDeletePost}
                            />
                          ))
                        )
                      ) : (
                        savedPosts.length === 0 ? (
                          <div className="text-center py-20 text-xs text-slate-400 dark:text-slate-500 font-light bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                            You haven't bookmarked any posts yet.
                          </div>
                        ) : (
                          savedPosts.map((post) => (
                            <PostCard
                              key={post.id}
                              post={post}
                              onLikeUpdate={handleLikeUpdate}
                              onSaveUpdate={handleSaveUpdate}
                              onDeletePost={handleDeletePost}
                            />
                          ))
                        )
                      )}
                    </>
                  )}
                </div>
              </div>

            </div>
          )}
        </main>

      </div>

      {/* Profile Edit Drawer */}
      <EditProfileDrawer
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onProfileUpdated={handleProfileUpdated}
      />

      {/* Post Modal */}
      <CreatePostModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onPostCreated={handlePostCreated} />

      {/* Followers / Following Modal */}
      <FollowersFollowingModal
        isOpen={followModal.isOpen}
        onClose={() => setFollowModal({ ...followModal, isOpen: false })}
        type={followModal.type}
        username={username}
      />

      {/* Lightbox Media Viewer Modal for Profile and Cover Pictures */}
      <MediaViewerModal
        isOpen={Boolean(viewerMedia)}
        onClose={() => setViewerMedia(null)}
        mediaUrl={viewerMedia?.url}
        mediaAlt={viewerMedia?.alt}
        title={viewerMedia?.title}
      />
    </PageTransition>
  )
}

export default Profile
