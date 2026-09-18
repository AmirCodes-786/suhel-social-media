import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Trash2 } from 'lucide-react'

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDestructive = true,
  icon: CustomIcon
}) => {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl font-outfit text-center"
        >
          {/* Header */}
          <div className="p-6">
            <div className={`mx-auto h-14 w-14 rounded-full flex items-center justify-center mb-4 ${
              isDestructive ? 'bg-rose-50 dark:bg-rose-950/40' : 'bg-indigo-50 dark:bg-indigo-950/40'
            }`}>
              {CustomIcon ? (
                <CustomIcon className={`h-6 w-6 ${isDestructive ? 'text-rose-500' : 'text-indigo-500'}`} />
              ) : isDestructive ? (
                <Trash2 className="h-6 w-6 text-rose-500" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-indigo-500" />
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{title}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed px-2">
              {message}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-slate-100 dark:border-slate-800 flex flex-col">
            <button
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={`w-full py-3.5 text-sm font-bold transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800 ${
                isDestructive 
                  ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30' 
                  : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
              }`}
            >
              {confirmText}
            </button>
            <button
              onClick={onClose}
              className="w-full py-3.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default ConfirmationModal
