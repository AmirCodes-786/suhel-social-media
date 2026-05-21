import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Bookmark, Share2, CornerDownRight, Send, Trash2, MoreHorizontal, Copy, Check, X, Link2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { postsService, commentsService } from '../supabaseService'

const PostCard = ({ post, onLikeUpdate, onSaveUpdate, onDeletePost }) => {
  const { user } = useAuth()
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [doubleTapHeart, setDoubleTapHeart] = useState(false)
  const [lastTap, setLastTap] = useState(0)
  const [showSharePopup, setShowSharePopup] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [isCommenting, setIsCommenting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0)

  useEffect(() => {
    setCommentsCount(post.comments_count || 0)
  }, [post.comments_count])

  const isOwnPost = user?.id === post.author || user?.id === post.author_detail?.id

  // Handle double-tap to like (Instagram style)
  const handleDoubleTap = () => {
    const now = Date.now()
    const DOUBLE_PRESS_DELAY = 300
    if (now - lastTap < DOUBLE_PRESS_DELAY) {
      if (!post.is_liked) {
        handleLike()
      }
      setDoubleTapHeart(true)
      setTimeout(() => setDoubleTapHeart(false), 800)
    } else {
      setLastTap(now)
    }
  }

  const handleLike = async () => {
    if (isLiking || !user) return
    setIsLiking(true)

    // Optimistic update
    const wasLiked = post.is_liked
    const oldCount = post.likes_count
    const newLiked = !wasLiked
    const newCount = newLiked ? oldCount + 1 : oldCount - 1

    if (onLikeUpdate) {
      onLikeUpdate(post.id, newLiked, newCount)
    }

    try {
      const result = await postsService.toggleLike(post.id, user.id)
      if (onLikeUpdate) {
        onLikeUpdate(post.id, result.is_liked, result.likes_count)
      }
    } catch (error) {
      console.error('Error liking post:', error)
      if (onLikeUpdate) {
        onLikeUpdate(post.id, wasLiked, oldCount)
      }
    } finally {
      setIsLiking(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    try {
      const result = await postsService.toggleSave(post.id, user.id)
      if (onSaveUpdate) {
        onSaveUpdate(post.id, result.is_saved)
      }
    } catch (error) {
      console.error('Error saving post:', error)
    }
  }

  const fetchComments = async () => {
    try {
      const data = await commentsService.getComments(post.id)
      setComments(data)
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const toggleComments = () => {
    const nextState = !showComments
    setShowComments(nextState)
    if (nextState) {
      fetchComments()
    }
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || isCommenting || !user) return

    setIsCommenting(true)
    try {
      await commentsService.addComment(post.id, user.id, newComment, replyingTo?.id)
      setCommentsCount((prev) => prev + 1)
      fetchComments()
      setNewComment('')
      setReplyingTo(null)
    } catch (error) {
      console.error('Error creating comment:', error)
    } finally {
      setIsCommenting(false)
    }
  }

  const handleDeletePost = async () => {
    if (isDeleting) return
    setIsDeleting(true)
    try {
      await postsService.deletePost(post.id)
      if (onDeletePost) {
        onDeletePost(post.id)
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post.')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
      setShowMenu(false)
    }
  }

  const handleShare = () => {
    setShowSharePopup(true)
    setLinkCopied(false)
  }

  const handleCopyLink = () => {
    const link = `${window.location.origin}/post/${post.id}`
    navigator.clipboard.writeText(link)
    setLinkCopied(true)
    setTimeout(() => {
      setShowSharePopup(false)
      setLinkCopied(false)
    }, 1500)
  }

  // Format timestamp nicely
  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHour < 24) return `${diffHour}h ago`
    if (diffDay < 7) return `${diffDay}d ago`
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm mb-6 p-4 text-left font-outfit relative"
    >
      {/* Header (User profile row) */}
      <div className="flex items-center justify-between pb-3.5">
        <Link to={`/profile/${post.author_detail?.username}`} className="flex items-center gap-3 group">
          <img
            src={post.author_detail?.profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
            alt={post.author_detail?.username}
            className="h-10 w-10 rounded-full border border-slate-100 object-cover group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
              {post.author_detail?.first_name ? `${post.author_detail.first_name} ${post.author_detail.last_name || ''}` : post.author_detail?.username}
            </span>
            <span className="text-[10px] text-slate-400 font-light mt-0.5">
              @{post.author_detail?.username} • {formatTime(post.created_at)}
            </span>
          </div>
        </Link>

        {/* Three dots menu */}
        {isOwnPost && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <MoreHorizontal className="h-4.5 w-4.5" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -4 }}
                  className="absolute right-0 top-10 z-20 w-40 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden"
                >
                  <button
                    onClick={() => { setShowMenu(false); setShowDeleteConfirm(true) }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Post
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl"
            >
              <div className="p-6 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center mb-4">
                  <Trash2 className="h-5 w-5 text-rose-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Delete Post?</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">This action cannot be undone. The post will be permanently removed.</p>
              </div>
              <div className="border-t border-slate-100">
                <button
                  onClick={handleDeletePost}
                  disabled={isDeleting}
                  className="w-full py-3.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border-b border-slate-100"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-3.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post Content */}
      {post.content && (
        <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line mb-3 px-0.5">
          {post.content}
        </div>
      )}

      {/* Media Content */}
      {post.media && (
        <div 
          onClick={handleDoubleTap}
          className="relative rounded-xl overflow-hidden bg-slate-50 border border-slate-100/50 flex items-center justify-center cursor-pointer select-none mb-3 max-h-[500px]"
        >
          {post.media_type === 'video' ? (
            <video 
              src={post.media} 
              controls 
              className="max-h-[500px] w-full object-contain"
            />
          ) : (
            <img 
              src={post.media} 
              alt="Post media" 
              className="max-h-[500px] w-full object-contain"
            />
          )}

          {/* Double Tap Heart Animation */}
          <AnimatePresence>
            {doubleTapHeart && (
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1.2 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="absolute inset-0 m-auto flex items-center justify-center pointer-events-none"
              >
                <Heart className="h-24 w-24 fill-rose-500 text-rose-500 drop-shadow-lg" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-1 pb-1 px-0.5">
        <div className="flex items-center gap-5">
          <button 
            onClick={handleLike}
            disabled={isLiking}
            className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer disabled:opacity-60"
          >
            <motion.div
              whileTap={{ scale: 1.3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <Heart className={`h-5 w-5 transition-colors ${post.is_liked ? 'fill-rose-500 text-rose-500' : ''}`} />
            </motion.div>
            <span className="text-[11px] font-bold">{post.likes_count}</span>
          </button>
          
          <button 
            onClick={toggleComments}
            className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            <MessageCircle className={`h-5 w-5 ${showComments ? 'text-indigo-600 fill-indigo-50' : ''}`} />
            <span className="text-[11px] font-bold">{commentsCount}</span>
          </button>

          <button 
            onClick={handleShare}
            className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>

        <button 
          onClick={handleSave}
          className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <Bookmark className={`h-5 w-5 ${post.is_saved ? 'fill-indigo-600 text-indigo-600' : ''}`} />
        </button>
      </div>

      {/* Share Link Popup */}
      <AnimatePresence>
        {showSharePopup && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="mt-2 mx-0.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3"
          >
            <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 overflow-hidden">
              <Link2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-[10px] text-slate-600 truncate select-all">
                {`${window.location.origin}/post/${post.id}`}
              </span>
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleCopyLink}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                linkCopied 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {linkCopied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </motion.button>
            <button
              onClick={() => setShowSharePopup(false)}
              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments Drawer (Expandable) */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 bg-slate-50/50 -mx-4 -mb-4 mt-4 overflow-hidden"
          >
            {/* Comment List */}
            <div className="max-h-[300px] overflow-y-auto p-4 space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 font-light">
                  No comments yet. Be the first to share your thoughts!
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="space-y-3">
                    {/* Root Comment */}
                    <div className="flex gap-3 text-left">
                      <img
                        src={comment.author_detail?.profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                        alt={comment.author_detail?.username}
                        className="h-8 w-8 rounded-full border border-slate-100 object-cover shrink-0"
                      />
                      <div className="flex-1 bg-white border border-slate-100 rounded-2xl px-4 py-2.5 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <Link to={`/profile/${comment.author_detail?.username}`} className="text-xs font-bold text-slate-800 hover:text-indigo-600">
                            @{comment.author_detail?.username}
                          </Link>
                          <span className="text-[9px] text-slate-400 font-light">{formatTime(comment.created_at)}</span>
                        </div>
                        <p className="text-xs text-slate-600">{comment.content}</p>
                        <button 
                          onClick={() => setReplyingTo(comment)}
                          className="mt-1.5 text-[9px] font-bold text-indigo-600 hover:underline cursor-pointer"
                        >
                          Reply
                        </button>
                      </div>
                    </div>

                    {/* Replies */}
                    {comment.replies && comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-3 text-left pl-8">
                        <CornerDownRight className="h-4 w-4 text-slate-300 mt-1 shrink-0" />
                        <img
                          src={reply.author_detail?.profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                          alt={reply.author_detail?.username}
                          className="h-6 w-6 rounded-full border border-slate-100 object-cover shrink-0"
                        />
                        <div className="flex-1 bg-white border border-slate-100 rounded-2xl px-4 py-2 shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                            <Link to={`/profile/${reply.author_detail?.username}`} className="text-[11px] font-bold text-slate-800 hover:text-indigo-600">
                              @{reply.author_detail?.username}
                            </Link>
                            <span className="text-[8px] text-slate-400 font-light">{formatTime(reply.created_at)}</span>
                          </div>
                          <p className="text-[11px] text-slate-600">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="p-4 border-t border-slate-100 bg-white flex gap-3 items-center relative">
              {replyingTo && (
                <div className="absolute bottom-16 left-4 right-4 flex items-center justify-between bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg text-[10px] text-indigo-600">
                  <span>Replying to @{replyingTo.author_detail?.username}</span>
                  <button type="button" onClick={() => setReplyingTo(null)} className="font-bold hover:underline">Cancel</button>
                </div>
              )}
              <img
                src={user?.profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                alt="Your profile"
                className="h-8 w-8 rounded-full border border-slate-100 object-cover shrink-0"
              />
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={replyingTo ? `Write a reply...` : "Write a comment..."}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/50 rounded-full py-2 pl-4 pr-10 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400 focus:bg-white transition-all"
                />
                <button 
                  type="submit"
                  disabled={!newComment.trim() || isCommenting}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 disabled:opacity-40 disabled:hover:text-slate-400 transition-colors cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default PostCard
