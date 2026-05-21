import React, { useState, useEffect } from 'react'
import { X, Users, Loader2, UserPlus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { followsService } from '../supabaseService'

const FollowersFollowingModal = ({ isOpen, onClose, type, username }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen || !username) return

    const fetchListData = async () => {
      setLoading(true)
      try {
        let data = []
        if (type === 'followers') {
          data = await followsService.getFollowers(username)
        } else {
          data = await followsService.getFollowing(username)
        }
        setUsers(data)
      } catch (err) {
        console.error('Error fetching follow list data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchListData()
  }, [isOpen, type, username])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white border border-slate-100 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[80vh] font-outfit text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
            <h3 className="text-sm font-bold text-slate-900 capitalize flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" />
              <span>{type === 'followers' ? 'Followers' : 'Following'}</span>
            </h3>
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* User List Container */}
          <div className="flex-1 overflow-y-auto p-4 max-h-[50vh]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mb-2" />
                <span className="text-xs">Loading list...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
                <Users className="h-8 w-8 text-slate-200 mb-2.5" />
                <span className="text-xs font-light">No users found.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((item) => (
                  <Link
                    key={item.id}
                    to={`/profile/${item.username}`}
                    onClick={onClose}
                    className="flex items-center gap-3 p-2 hover:bg-slate-50 border border-transparent hover:border-slate-100/50 rounded-2xl transition-all group"
                  >
                    <img
                      src={item.profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                      alt={item.username}
                      className="h-10 w-10 rounded-full border border-slate-100 object-cover"
                    />
                    <div className="flex-1 min-w-0 flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                        {item.first_name ? `${item.first_name} ${item.last_name || ''}` : item.username}
                      </span>
                      <span className="text-[10px] text-slate-400 font-light truncate">@{item.username}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default FollowersFollowingModal
