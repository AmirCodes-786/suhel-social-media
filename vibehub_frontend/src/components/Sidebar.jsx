import React, { useState } from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  Home, 
  Search, 
  Compass, 
  MessageSquare, 
  Bell, 
  PlusSquare, 
  User, 
  LogOut,
  Settings,
  Activity,
  AlertTriangle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Sidebar = ({ onCreateClick, unreadMessagesCount = 0, unreadNotificationsCount = 0 }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Explore', path: '/explore', icon: Compass },
    { 
      name: 'Messages', 
      path: '/messages', 
      icon: MessageSquare, 
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : null 
    },
    { 
      name: 'Notifications', 
      path: '/notifications', 
      icon: Bell, 
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : null 
    },
    { name: 'Profile', path: user?.username ? `/profile/${user.username}` : '/profile/me', icon: User },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-64 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 z-30 font-outfit text-left transition-colors duration-200">
        {/* Logo / Brand */}
        <Link to="/" className="flex items-center gap-2 mb-10 px-2 group">
          <Activity className="h-6 w-6 text-indigo-600 animate-pulse" />
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            VibeHub
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`
                  relative flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                  ${isActive ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebarActiveIndicator"
                    className="absolute inset-0 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl z-0"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <div className="relative z-10 flex items-center gap-4 w-full">
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                  </motion.div>
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="absolute right-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                      {item.badge}
                    </span>
                  )}
                </div>
              </NavLink>
            )
          })}

          {/* Create Button */}
          <button
            onClick={onCreateClick}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 group cursor-pointer text-left"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200">
              <PlusSquare className="h-5 w-5" />
            </div>
            <span>Create Post</span>
          </button>
        </nav>

        {/* Bottom actions: Settings & Logout */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-1.5">
          <NavLink
            to="/settings"
            className={({ isActive }) => `
              flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
              ${isActive 
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'}
            `}
          >
            {({ isActive }) => (
              <>
                <Settings className={`h-5 w-5 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                <span>Settings</span>
              </>
            )}
          </NavLink>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all duration-200 group cursor-pointer text-left"
          >
            <LogOut className="h-5 w-5 text-slate-400 dark:text-slate-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100/80 dark:border-slate-800/80 px-4 flex items-center justify-around z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className="relative flex flex-col items-center justify-center p-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors focus:outline-none"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Icon className={`h-5.5 w-5.5 transition-colors duration-200 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`} />
              </motion.div>
              {item.badge && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 text-[8px] font-bold text-white px-1 shadow-sm ring-1 ring-white dark:ring-slate-900">
                  {item.badge}
                </span>
              )}
              {isActive && (
                <motion.span 
                  layoutId="mobileActiveIndicator"
                  className="absolute bottom-1 h-1 w-1 rounded-full bg-indigo-600"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </NavLink>
          )
        })}
        <button
          onClick={onCreateClick}
          className="flex flex-col items-center justify-center p-2.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none cursor-pointer"
        >
          <motion.div
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <PlusSquare className="h-5.5 w-5.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400" />
          </motion.div>
        </button>
      </nav>

      {/* Instagram-style Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setShowLogoutModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl font-outfit"
            >
              {/* Header */}
              <div className="p-6 text-center">
                <div className="mx-auto h-14 w-14 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center mb-4">
                  <LogOut className="h-6 w-6 text-rose-500" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Log Out?</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Are you sure you want to log out of your VibeHub account?
                </p>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full py-3.5 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800"
                >
                  Log Out
                </button>
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="w-full py-3.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default React.memo(Sidebar)
