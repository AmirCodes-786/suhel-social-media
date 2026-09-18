import React, { useState, useEffect, useCallback } from 'react'
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export const MediaViewerModal = ({
  isOpen,
  src,
  alt = 'Expanded photo',
  caption = '',
  onClose,
}) => {
  const [zoom, setZoom] = useState(1)

  // Reset zoom whenever image source or modal open state changes
  useEffect(() => {
    if (isOpen) {
      setZoom(1)
    }
  }, [isOpen, src])

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const handleZoomIn = (e) => {
    e.stopPropagation()
    setZoom((prev) => Math.min(prev + 0.5, 3.5))
  }

  const handleZoomOut = (e) => {
    e.stopPropagation()
    setZoom((prev) => Math.max(prev - 0.5, 1))
  }

  const handleResetZoom = (e) => {
    e.stopPropagation()
    setZoom(1)
  }

  const handleToggleZoom = (e) => {
    e.stopPropagation()
    setZoom((prev) => (prev > 1 ? 1 : 2))
  }

  if (!isOpen || !src) return null

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 backdrop-blur-xl select-none font-outfit"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Image viewer"
      >
        {/* Top Floating Action Bar */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-4 left-4 right-4 flex items-center justify-between z-50 pointer-events-auto"
        >
          {/* Caption / Title */}
          <div className="text-xs font-medium text-zinc-300 max-w-md truncate px-3 py-1.5 rounded-full bg-zinc-900/60 backdrop-blur-md border border-zinc-800">
            {caption || 'VibeHub Media'}
          </div>

          {/* Controls: Zoom In, Zoom Out, Reset, Close */}
          <div className="flex items-center gap-1.5 bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 p-1 rounded-full shadow-2xl">
            <button
              type="button"
              onClick={handleZoomIn}
              aria-label="Zoom in"
              title="Zoom in"
              className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              aria-label="Zoom out"
              title="Zoom out"
              disabled={zoom <= 1}
              className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 disabled:opacity-40 rounded-full transition-colors cursor-pointer"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            {zoom > 1 && (
              <button
                type="button"
                onClick={handleResetZoom}
                aria-label="Reset zoom"
                title="Reset zoom"
                className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            <div className="w-px h-4 bg-zinc-700 mx-1" />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close image viewer"
              title="Close (Esc)"
              className="p-2 text-zinc-300 hover:text-white hover:bg-rose-500/20 hover:text-rose-400 rounded-full transition-colors cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Media Frame with smooth motion and drag-pan when zoomed */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative max-h-[90vh] max-w-[95vw] flex items-center justify-center overflow-hidden"
        >
          <motion.img
            src={src}
            alt={alt}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: zoom }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            drag={zoom > 1}
            dragConstraints={{ left: -300, right: 300, top: -200, bottom: 200 }}
            onDoubleClick={handleToggleZoom}
            className={`max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl transition-shadow ${
              zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
            }`}
          />
        </div>

        {/* Hint footer */}
        <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
          <span className="text-[11px] font-mono text-zinc-500 bg-zinc-950/70 px-3 py-1 rounded-full border border-zinc-800">
            {zoom > 1 ? 'Drag to pan • Double click to reset' : 'Double click or use buttons to zoom • Esc to close'}
          </span>
        </div>
      </div>
    </AnimatePresence>
  )
}

export default MediaViewerModal
