import React, { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import CreatePostModal from '../components/CreatePostModal'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { profilesService } from '../supabaseService'
import api from '../api'
import { 
  User, 
  Shield, 
  Bell, 
  Moon, 
  Camera, 
  Save, 
  Loader2, 
  Check, 
  AlertCircle,
  Mail,
  Globe,
  MapPin,
  AtSign,
  Lock,
  LogOut,
  Sun
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Settings = () => {
  const { user, refreshUser, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('profile')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Profile Form States
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [location, setLocation] = useState('')

  // Media
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)

  const avatarInputRef = useRef(null)
  const coverInputRef = useRef(null)

  // Status indicators
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Password Change
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // Preference switches
  const [emailNotifs, setEmailNotifs] = useState(() => {
    return localStorage.getItem('vibehub_pref_email') !== 'false'
  })
  const [pushNotifs, setPushNotifs] = useState(() => {
    return localStorage.getItem('vibehub_pref_push') !== 'false'
  })
  const [privateAccount, setPrivateAccount] = useState(() => {
    return localStorage.getItem('vibehub_pref_private') === 'true'
  })

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '')
      setLastName(user.last_name || '')
      setUsername(user.username || '')
      setBio(user.profile?.bio || '')
      setWebsite(user.profile?.website || '')
      setLocation(user.profile?.location || '')
      setAvatarPreview(user.profile?.profile_picture || null)
      setCoverPreview(user.profile?.cover_picture || null)
    }
  }, [user])

  const handleTogglePrivate = (enabled) => {
    setPrivateAccount(enabled)
    localStorage.setItem('vibehub_pref_private', enabled ? 'true' : 'false')
  }

  const handleToggleEmailNotifs = (enabled) => {
    setEmailNotifs(enabled)
    localStorage.setItem('vibehub_pref_email', enabled ? 'true' : 'false')
  }

  const handleTogglePushNotifs = (enabled) => {
    setPushNotifs(enabled)
    localStorage.setItem('vibehub_pref_push', enabled ? 'true' : 'false')
  }

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

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setErrorMessage('')
    setSaveSuccess(false)

    try {
      const profileData = {
        first_name: firstName,
        last_name: lastName,
        bio,
        website,
        location,
        profile_picture: user.profile?.profile_picture || null,
        cover_picture: user.profile?.cover_picture || null,
      }

      await profilesService.updateProfile(user.id || user._id, profileData, avatarFile, coverFile)
      await refreshUser()
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3500)
    } catch (err) {
      console.error('Error saving profile:', err)
      setErrorMessage(err?.response?.data?.error || err.message || 'Failed to update settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.')
      return
    }

    setPasswordSaving(true)
    setPasswordError('')
    setPasswordSuccess(false)

    try {
      await api.post('/api/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      })
      setPasswordSuccess(true)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(false), 4000)
    } catch (err) {
      setPasswordError(err?.response?.data?.error || err.message || 'Failed to change password.')
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-outfit text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar onCreateClick={() => setIsCreateOpen(true)} />

      {/* Main Settings Container */}
      <main className="flex-1 md:ml-64 p-4 md:p-10 max-w-5xl mx-auto w-full pb-24 md:pb-12 text-left">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your account preferences, profile details, and security.</p>
        </div>

        {/* Tabs & Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Navigation Tabs */}
          <div className="space-y-1 md:col-span-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer text-left ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="h-4 w-4" />
              <span>Edit Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer text-left ${
                activeTab === 'account'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Shield className="h-4 w-4" />
              <span>Account & Security</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer text-left ${
                activeTab === 'notifications'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </button>

            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer text-left ${
                activeTab === 'appearance'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Moon className="h-4 w-4" />
              <span>Appearance</span>
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="md:col-span-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Public Profile</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">This information will be displayed publicly on your VibeHub profile.</p>
                  </div>

                  {/* Feedback Banners */}
                  {errorMessage && (
                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 flex gap-3 items-center text-xs text-rose-600 dark:text-rose-400">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {saveSuccess && (
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 flex gap-3 items-center text-xs text-emerald-700 dark:text-emerald-300">
                      <Check className="h-4 w-4 shrink-0" />
                      <span>Settings updated successfully!</span>
                    </div>
                  )}

                  {/* Cover & Avatar Upload */}
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Profile Images</label>
                    
                    {/* Cover Photo Area */}
                    <div className="relative h-32 md:h-40 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 group">
                      {coverPreview ? (
                        <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/5 dark:to-purple-500/5 flex items-center justify-center text-slate-400 text-xs">
                          No cover photo
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer border border-white/10"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        <span>Change Cover</span>
                      </button>
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCoverChange}
                        className="hidden"
                      />
                    </div>

                    {/* Avatar Photo Area */}
                    <div className="flex items-center gap-5 pt-2">
                      <div className="relative group">
                        <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 ring-4 ring-white dark:ring-slate-800 shadow-md overflow-hidden flex items-center justify-center">
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-8 w-8 text-slate-400" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                        >
                          <Camera className="h-5 w-5" />
                        </button>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Profile Picture</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">JPG, PNG or GIF. Recommended 400x400px.</p>
                      </div>
                    </div>
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">First Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Last Name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Username (Read-only / ID) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Username</label>
                    <div className="relative">
                      <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                      <input
                        type="text"
                        value={username}
                        disabled
                        className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Bio</label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell the community about yourself..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                    />
                  </div>

                  {/* Website & Location */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Website</label>
                      <div className="relative">
                        <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        <input
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://yourwebsite.com"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="San Francisco, CA"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Saving Changes...</span>
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
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="space-y-6 text-left">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Account Details</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage your credentials, password, and security.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-600 dark:text-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">User ID</label>
                      <input
                        type="text"
                        value={user?.id || user?._id || ''}
                        disabled
                        className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 font-mono"
                      />
                    </div>
                  </div>

                  {/* Change Password Form */}
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Change Password</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Update your account password for enhanced security.</p>

                    {passwordError && (
                      <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{passwordError}</span>
                      </div>
                    )}

                    {passwordSuccess && (
                      <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0" />
                        <span>Password updated successfully!</span>
                      </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Current Password</label>
                        <input
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">New Password</label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Confirm New Password</label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={passwordSaving}
                        className="mt-2 bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {passwordSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                        <span>Update Password</span>
                      </button>
                    </form>
                  </div>

                  {/* Privacy switch */}
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Privacy Controls</h3>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Private Account</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">Only approved followers can view your vibe and posts.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={privateAccount}
                        onChange={(e) => handleTogglePrivate(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Logout danger zone */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={async () => {
                        await logout()
                        navigate('/login')
                      }}
                      className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer border border-rose-100 dark:border-rose-900/30"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log Out of All Sessions</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6 text-left">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Notification Preferences</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Control how and when you want to receive alerts from VibeHub.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Push Notifications</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">Receive alerts when someone likes, comments, or follows you.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={pushNotifs}
                        onChange={(e) => handleTogglePushNotifs(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Email Digest</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">Receive weekly summaries of trending posts and creator highlights.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailNotifs}
                        onChange={(e) => handleToggleEmailNotifs(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="space-y-6 text-left">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Theme & Appearance</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Choose your preferred visual appearance across the entire VibeHub experience.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Light Mode Selection Card */}
                    <div
                      onClick={() => setTheme('light')}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        theme === 'light'
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
                          <Sun className="h-5 w-5" />
                        </div>
                        {theme === 'light' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-xs">Active</span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Light Mode</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Clean, high-clarity interface tailored for daytime browsing.</p>
                      </div>
                    </div>

                    {/* Dark Mode Selection Card */}
                    <div
                      onClick={() => setTheme('dark')}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        theme === 'dark'
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-900 text-indigo-400 border border-slate-800 flex items-center justify-center shadow-xs">
                          <Moon className="h-5 w-5" />
                        </div>
                        {theme === 'dark' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-xs">Active</span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Dark Mode</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Deep dark palette for minimal eye strain and rich nighttime vibes.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onPostCreated={() => {
          setIsCreateOpen(false)
        }}
      />
    </div>
  )
}

export default Settings
