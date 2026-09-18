import React, { useState, useRef, useEffect } from 'react'
import { X, Image, Film, MessageSquare, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { postsService, storiesService } from '../supabaseService'
import VibeVideoPlayer from './VibeVideoPlayer'

const CreatePostModal = ({ isOpen, onClose, onPostCreated, defaultType = 'post' }) => {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [mediaFile, setMediaFile] = useState(null)
  const [mediaPreview, setMediaPreview] = useState(null)
  const [publishType, setPublishType] = useState(defaultType)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Sync publishType when defaultType changes (e.g. opening from StoriesBar vs Sidebar)
  useEffect(() => {
    if (isOpen) {
      setPublishType(defaultType)
    }
  }, [isOpen, defaultType])

  if (!isOpen) return null

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setMediaFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setMediaPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return

    setMediaFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setMediaPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveMedia = () => {
    setMediaFile(null)
    setMediaPreview(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() && !mediaFile) return
    if (!user) return

    setUploading(true)
    
    // Auto-detect media type
    let mediaType = 'text'
    if (mediaFile) {
      if (mediaFile.type.startsWith('video/')) {
        mediaType = 'video'
      } else {
        mediaType = 'image'
      }
    }

    try {
      const authorId = user.id || user._id
      let createdData
      if (publishType === 'post') {
        createdData = await postsService.createPost(authorId, content, mediaFile, mediaType)
      } else {
        if (!mediaFile) {
          alert('Stories require an image or video file.')
          setUploading(false)
          return
        }
        createdData = await storiesService.createStory(authorId, mediaFile)
      }

      if (onPostCreated) {
        onPostCreated(createdData, publishType)
      }
      
      setContent('')
      setMediaFile(null)
      setMediaPreview(null)
      onClose()
    } catch (error) {
      console.error('Error creating post:', error)
      const errorMsg = error?.response?.data?.detail || error?.response?.data?.error || error.message || 'Failed to publish content. Please check your network connection.'
      alert(`Failed to publish content: ${errorMsg}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh] font-outfit text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New Content</h3>
            <button 
              onClick={onClose} 
              disabled={uploading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Toggle Tab */}
          <div className="flex p-2 bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 gap-1.5">
            <button
              onClick={() => setPublishType('post')}
              disabled={uploading}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                publishType === 'post' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Feed Post
            </button>
            <button
              onClick={() => setPublishType('story')}
              disabled={uploading}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                publishType === 'story' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Film className="h-3.5 w-3.5" />
              24h Story
            </button>
          </div>

          {/* Body Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 flex flex-col">
            {/* Input content */}
            {publishType === 'post' && (
              <textarea
                placeholder="What's on your mind? Share your vibe..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={uploading}
                rows={4}
                className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-100 border-0 resize-none focus:ring-0 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
              />
            )}

            {/* Drag & Drop File Upload */}
            {!mediaPreview ? (
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-700/80 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-600/50 hover:bg-indigo-50/10 dark:hover:bg-indigo-950/20 transition-all text-slate-400 group text-center"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                  className="hidden" 
                />
                <div className="h-11 w-11 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-400 mb-3 group-hover:scale-105 transition-transform border border-slate-100 dark:border-slate-700">
                  <Image className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  Drag and drop photo or video
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Supported formats: JPG, PNG, MP4, WebM
                </p>
              </div>
            ) : (
              /* Media Preview Container */
              <div className="relative rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 max-h-[300px] border border-slate-100 dark:border-slate-800 flex items-center justify-center">
                {mediaFile?.type.startsWith('video/') ? (
                  <VibeVideoPlayer src={mediaPreview} maxHeight="300px" className="w-full" />
                ) : (
                  <img src={mediaPreview} alt="Preview" className="max-h-[300px] object-contain w-full" />
                )}
                <button
                  type="button"
                  onClick={handleRemoveMedia}
                  disabled={uploading}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/85 hover:scale-105 transition-all cursor-pointer z-30"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2 mt-auto">
              <button
                type="submit"
                disabled={uploading || (!content.trim() && !mediaFile)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-indigo-500/10 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Publishing vibe...</span>
                  </>
                ) : (
                  <span>Publish {publishType === 'post' ? 'Post' : 'Story'}</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default CreatePostModal
