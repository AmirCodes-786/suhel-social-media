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
          className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl font-outfit text-center"
        >
          {/* Header */}
          <div className="p-6">
            <div className={`mx-auto h-14 w-14 rounded-full flex items-center justify-center mb-4 ${
              isDestructive ? 'bg-rose-50' : 'bg-indigo-50'
            }`}>
              {CustomIcon ? (
                <CustomIcon className={`h-6 w-6 ${isDestructive ? 'text-rose-500' : 'text-indigo-500'}`} />
              ) : isDestructive ? (
                <Trash2 className="h-6 w-6 text-rose-500" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-indigo-500" />
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed px-2">
              {message}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-slate-100 flex flex-col">
            <button
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={`w-full py-3.5 text-sm font-bold transition-colors cursor-pointer border-b border-slate-100 ${
                isDestructive 
                  ? 'text-rose-600 hover:bg-rose-50' 
                  : 'text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              {confirmText}
            </button>
            <button
              onClick={onClose}
              className="w-full py-3.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
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
