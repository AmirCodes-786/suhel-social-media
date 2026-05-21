import React, { useState, useEffect, useRef } from 'react'
import { X, Camera, Loader2, Save } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { profilesService } from '../supabaseService'

const EditProfileDrawer = ({ isOpen, onClose, onProfileUpdated }) => {
  const { user, refreshUser } = useAuth()
  const [username, setUsername] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [location, setLocation] = useState('')
  const [uploading, setUploading] = useState(false)

  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)

  const avatarInputRef = useRef(null)
  const coverInputRef = useRef(null)

  useEffect(() => {
    if (user && isOpen) {
      setUsername(user.username || '')
      setFirstName(user.first_name || '')
      setLastName(user.last_name || '')
      setBio(user.profile?.bio || '')
      setWebsite(user.profile?.website || '')
      setLocation(user.profile?.location || '')
      setAvatarPreview(user.profile?.profile_picture || null)
      setCoverPreview(user.profile?.cover_picture || null)
      setAvatarFile(null)
      setCoverFile(null)
    }
  }, [user, isOpen])

  if (!isOpen) return null

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setAvatarPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleCoverChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setCoverFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setCoverPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return
    setUploading(true)

    try {
      const profileData = {
        first_name: firstName,
        last_name: lastName,
        bio,
        website,
        location,
        profile_picture: user.profile?.profile_picture || null,
        cover_picture: user.profile?.cover_picture || null
      }

      await profilesService.updateProfile(user.id, profileData, avatarFile, coverFile)
      const updatedUser = await refreshUser()
      if (onProfileUpdated) {
        onProfileUpdated(updatedUser)
      }
      onClose()
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please check your credentials or network.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end">
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative bg-white border-l border-slate-100 w-full max-w-md h-full shadow-2xl flex flex-col z-10 font-outfit text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0 bg-white">
            <h3 className="text-base font-bold text-slate-900">Edit Profile</h3>
            <button 
              onClick={onClose} 
              disabled={uploading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            {/* Pictures Selector */}
            <div className="space-y-4">
              {/* Cover Picture */}
              <div 
                onClick={() => coverInputRef.current?.click()}
                className="relative h-32 w-full rounded-2xl bg-slate-100 overflow-hidden cursor-pointer border border-slate-200 hover:border-indigo-500/50 group transition-all"
              >
                <input 
                  type="file" 
                  ref={coverInputRef} 
                  onChange={handleCoverChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">
                    No Cover Image
                  </div>
                )}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold gap-1.5 transition-all">
                  <Camera className="h-4 w-4" />
                  Change Cover
                </div>
              </div>

              {/* Avatar Profile Picture */}
              <div className="relative -mt-14 ml-4 h-20 w-20 shrink-0 z-10">
                <div 
                  onClick={() => avatarInputRef.current?.click()}
                  className="relative h-20 w-20 rounded-full bg-slate-100 overflow-hidden cursor-pointer border-2 border-white hover:border-indigo-600 group transition-all shadow-sm"
                >
                  <input 
                    type="file" 
                    ref={avatarInputRef} 
                    onChange={handleAvatarChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[10px] text-slate-400">
                      No Photo
                    </div>
                  )}
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-all">
                    <Camera className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* General Fields */}
            <div className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={uploading}
                  className="w-full bg-slate-50 border border-slate-200/50 rounded-xl py-3 px-4 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={uploading}
                    className="w-full bg-slate-50 border border-slate-200/50 rounded-xl py-3 px-4 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={uploading}
                    className="w-full bg-slate-50 border border-slate-200/50 rounded-xl py-3 px-4 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={uploading}
                  rows={3}
                  maxLength={500}
                  className="w-full bg-slate-50 border border-slate-200/50 rounded-xl py-3 px-4 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Website</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  disabled={uploading}
                  className="w-full bg-slate-50 border border-slate-200/50 rounded-xl py-3 px-4 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Location</label>
                <input
                  type="text"
                  placeholder="New York, USA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={uploading}
                  className="w-full bg-slate-50 border border-slate-200/50 rounded-xl py-3 px-4 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-slate-100 shrink-0">
              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-indigo-500/10 disabled:opacity-40 transition-all cursor-pointer"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default EditProfileDrawer
