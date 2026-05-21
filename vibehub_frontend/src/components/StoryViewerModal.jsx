import React, { useState, useEffect, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Eye, Send, Heart, MessageCircle, ChevronUp, ChevronDown, Loader2, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { storiesService, chatService } from '../supabaseService'
import ConfirmationModal from './ConfirmationModal'

const StoryViewerModal = ({ activeGroup, groupList = [], onClose, onStoryViewed, onStoryDeleted }) => {
  const { user } = useAuth()
  const [groupIndex, setGroupIndex] = useState(0)
  const [storyIndex, setStoryIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [replyText, setReplyText] = useState('')
  const [viewersCount, setViewersCount] = useState(0)
  const [viewersList, setViewersList] = useState([])
  const [showViewers, setShowViewers] = useState(false)
  const [loadingViewers, setLoadingViewers] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const progressInterval = useRef(null)
  
  const STORY_DURATION = 5000 // 5 seconds per story

  // Find index of current group in list
  useEffect(() => {
    const idx = groupList.findIndex(g => g.user.id === activeGroup?.user.id)
    if (idx !== -1) {
      setGroupIndex(idx)
      setStoryIndex(0)
    }
  }, [activeGroup, groupList])

  const currentGroup = groupList[groupIndex]
  const currentStory = currentGroup?.stories[storyIndex]
  const isOwnStory = currentGroup?.user.id === user?.id

  // Mark story as viewed
  useEffect(() => {
    if (!currentStory || !user) return

    const markViewed = async () => {
      try {
        await storiesService.viewStory(currentStory.id, user.id)
        if (onStoryViewed) {
          onStoryViewed(currentStory.id)
        }
      } catch (error) {
        console.error('Error marking story viewed:', error)
      }
    }

    markViewed()

    // If it's my own story, load the viewers count
    if (isOwnStory) {
      setViewersCount(currentStory.viewers?.length || 0)
      setShowViewers(false)
    }
  }, [currentStory, groupIndex, storyIndex, user])

  // Progress Bar Timer
  useEffect(() => {
    setProgress(0)
    if (progressInterval.current) clearInterval(progressInterval.current)

    // Pause progress when viewing viewers panel or delete confirmation modal
    if (showViewers || showDeleteConfirm) return

    const step = 100 / (STORY_DURATION / 100) // update every 100ms
    progressInterval.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval.current)
          handleNext()
          return 100
        }
        return prev + step
      })
    }, 100)

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current)
    }
  }, [groupIndex, storyIndex, showViewers])

  if (!currentGroup || !currentStory) return null

  const handlePrev = () => {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1)
    } else if (groupIndex > 0) {
      setGroupIndex(groupIndex - 1)
      setStoryIndex(groupList[groupIndex - 1].stories.length - 1)
    }
  }

  const handleNext = () => {
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(storyIndex + 1)
    } else if (groupIndex < groupList.length - 1) {
      setGroupIndex(groupIndex + 1)
      setStoryIndex(0)
    } else {
      onClose()
    }
  }

  const handleReplySubmit = async (e) => {
    e.preventDefault()
    if (!replyText.trim() || !user || !currentGroup) return

    try {
      const convId = await chatService.getOrCreateConversation(user.id, currentGroup.user.id)
      const content = `Replied to your story: "${replyText}"`
      await chatService.sendMessage(convId, user.id, content)
      setReplyText('')
    } catch (error) {
      console.error('Error replying to story:', error)
    }
  }

  const fetchViewers = async () => {
    setLoadingViewers(true)
    try {
      const data = await storiesService.getViewers(currentStory.id)
      setViewersList(data)
    } catch (error) {
      console.error('Error fetching viewers:', error)
      setViewersList([])
    } finally {
      setLoadingViewers(false)
    }
  }

  const toggleViewers = () => {
    const next = !showViewers
    setShowViewers(next)
    if (next) {
      fetchViewers()
      // Pause auto-advance
      if (progressInterval.current) clearInterval(progressInterval.current)
    }
  }

  const handleDeleteStory = async () => {
    setShowDeleteConfirm(true)
  }

  const confirmDeleteStory = async () => {
    try {
      await storiesService.deleteStory(currentStory.id)
      if (onStoryDeleted) {
        onStoryDeleted(currentStory.id)
      }
    } catch (error) {
      console.error('Error deleting story:', error)
    }
  }

  // Format time for story
  const formatStoryTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMin = Math.floor(diffMs / (1000 * 60))
    const diffHour = Math.floor(diffMin / 60)
    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    return `${diffHour}h ago`
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center select-none overflow-hidden font-outfit">
        {/* Progress Bars */}
        <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-50">
          {currentGroup.stories.map((s, idx) => (
            <div key={s.id} className="h-1 flex-1 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
                style={{ 
                  width: idx === storyIndex 
                    ? `${progress}%` 
                    : idx < storyIndex ? '100%' : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header Info */}
        <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-50">
          <div className="flex items-center gap-3">
            <img
              src={currentGroup.user.profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
              alt={currentGroup.user.username}
              className="h-9 w-9 rounded-full border border-zinc-700 object-cover"
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">
                {currentGroup.user.username}
              </span>
              <span className="text-[10px] text-zinc-400">
                {formatStoryTime(currentStory.created_at)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOwnStory && (
              <button 
                onClick={handleDeleteStory} 
                className="p-2 text-rose-400 hover:text-rose-500 rounded-full bg-zinc-900/40 hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Delete Story"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Buttons (Desktop Hover) */}
        <button 
          onClick={handlePrev}
          className="hidden sm:flex absolute left-4 h-12 w-12 items-center justify-center rounded-full bg-zinc-900/50 hover:bg-zinc-800 text-white z-40 transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button 
          onClick={handleNext}
          className="hidden sm:flex absolute right-4 h-12 w-12 items-center justify-center rounded-full bg-zinc-900/50 hover:bg-zinc-800 text-white z-40 transition-colors cursor-pointer"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Navigation Hotspots (Mobile Tap Zones) */}
        <div className="absolute inset-0 flex z-30">
          <div className="w-1/3 h-full cursor-w-resize" onClick={handlePrev} />
          <div className="w-1/3 h-full" />
          <div className="w-1/3 h-full cursor-e-resize" onClick={handleNext} />
        </div>

        {/* Media Frame */}
        <div className="w-full max-w-md h-full flex items-center justify-center p-2 z-20">
          {currentStory.media_type === 'video' ? (
            <video 
              src={currentStory.media} 
              autoPlay 
              muted 
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
          ) : (
            <img 
              src={currentStory.media} 
              alt="Story" 
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
          )}
        </div>

        {/* Footer Interaction */}
        <div className="absolute bottom-0 left-0 right-0 z-40">
          {isOwnStory ? (
            /* Story Creator: Viewers panel */
            <div className="flex flex-col items-center">
              {/* Viewers Pull-up Sheet */}
              <AnimatePresence>
                {showViewers && (
                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="w-full max-w-md mx-auto bg-zinc-900/95 border-t border-zinc-800 rounded-t-3xl backdrop-blur-lg max-h-[50vh] overflow-hidden flex flex-col"
                  >
                    <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Story Viewers</h4>
                      <span className="text-[10px] text-zinc-500">{viewersCount} view{viewersCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {loadingViewers ? (
                        <div className="flex justify-center py-6">
                          <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                        </div>
                      ) : viewersList.length === 0 ? (
                        <div className="text-center py-6 text-xs text-zinc-500">No viewers yet</div>
                      ) : (
                        viewersList.map((viewer) => (
                          <div key={viewer.id} className="flex items-center gap-3">
                            <img
                              src={viewer.profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                              alt={viewer.username}
                              className="h-9 w-9 rounded-full border border-zinc-700 object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold text-white block truncate">{viewer.username}</span>
                              <span className="text-[10px] text-zinc-500">
                                {viewer.first_name || ''} {viewer.last_name || ''}
                              </span>
                            </div>
                            <Eye className="h-3.5 w-3.5 text-zinc-600" />
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Viewers Toggle Button */}
              <button
                onClick={toggleViewers}
                className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 px-5 py-3 rounded-full text-xs font-semibold text-zinc-300 mb-6 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <Eye className="h-4 w-4" />
                <span>{viewersCount} view{viewersCount !== 1 ? 's' : ''}</span>
                {showViewers ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
              </button>
            </div>
          ) : (
            /* Story Viewer Reply Input */
            <div className="flex justify-center pb-6 px-4">
              <form onSubmit={handleReplySubmit} className="w-full max-w-md flex gap-2">
                <input
                  type="text"
                  placeholder={`Reply to ${currentGroup.user.username}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-zinc-900/80 border border-zinc-800 rounded-full py-2.5 px-5 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-zinc-500 backdrop-blur"
                />
                <button 
                  type="submit"
                  disabled={!replyText.trim()}
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </div>

        <ConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDeleteStory}
          title="Delete Story?"
          message="Are you sure you want to delete this story? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          isDestructive={true}
        />
      </div>
    </AnimatePresence>
  )
}

export default StoryViewerModal
