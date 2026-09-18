import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  Loader2,
  AlertCircle,
  Settings
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds === null) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

export const VibeVideoPlayer = ({
  src,
  poster,
  className = '',
  maxHeight = '500px',
  autoPlay = false,
  muted = false,
  loop = false,
  onEnded,
  onClick,
}) => {
  const containerRef = useRef(null)
  const videoRef = useRef(null)
  const progressBarRef = useRef(null)
  const hideControlsTimeout = useRef(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(muted)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [showCenterPlayFlash, setShowCenterPlayFlash] = useState(false)

  // Reset controls hide timer
  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current)
    if (isPlaying) {
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false)
        setShowSpeedMenu(false)
      }, 2500)
    }
  }, [isPlaying])

  useEffect(() => {
    resetHideTimer()
    return () => {
      if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current)
    }
  }, [isPlaying, resetHideTimer])

  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Keyboard navigation when hovered/active
  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'k') {
      e.preventDefault()
      togglePlay()
    } else if (e.key === 'm') {
      e.preventDefault()
      toggleMute()
    } else if (e.key === 'f') {
      e.preventDefault()
      toggleFullscreen()
    }
  }

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play().catch(() => {})
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
    setShowCenterPlayFlash(true)
    setTimeout(() => setShowCenterPlayFlash(false), 500)
    resetHideTimer()
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    if (isMuted) {
      video.muted = false
      video.volume = volume || 1
      setIsMuted(false)
    } else {
      video.muted = true
      setIsMuted(true)
    }
  }

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    if (videoRef.current) {
      videoRef.current.volume = val
      videoRef.current.muted = val === 0
      setIsMuted(val === 0)
    }
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    setCurrentTime(video.currentTime)

    // Calculate buffer
    if (video.buffered.length > 0) {
      for (let i = video.buffered.length - 1; i >= 0; i--) {
        if (video.buffered.start(i) <= video.currentTime) {
          setBuffered((video.buffered.end(i) / video.duration) * 100)
          break
        }
      }
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      setIsLoading(false)
      setHasError(false)
    }
  }

  const handleProgressScrub = (e) => {
    e.stopPropagation()
    const bar = progressBarRef.current
    const video = videoRef.current
    if (!bar || !video || !duration) return

    const rect = bar.getBoundingClientRect()
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const newTime = pos * duration
    video.currentTime = newTime
    setCurrentTime(newTime)
    resetHideTimer()
  }

  const toggleFullscreen = () => {
    const container = containerRef.current
    if (!container) return

    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen()
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  const handleRateChange = (rate) => {
    setPlaybackRate(rate)
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
    }
    setShowSpeedMenu(false)
    resetHideTimer()
  }

  const progressPercent = duration ? (currentTime / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className={`relative group select-none overflow-hidden bg-black flex items-center justify-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${className}`}
      style={{ maxHeight }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Native HTML5 Video Element with security & no-download flags */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted={isMuted}
        loop={loop}
        playsInline
        preload="metadata"
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsLoading(false)
          setIsPlaying(true)
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false)
          if (onEnded) onEnded()
        }}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
        onClick={(e) => {
          e.stopPropagation()
          if (onClick) onClick(e)
          togglePlay()
        }}
        className="w-full h-full object-contain cursor-pointer max-h-inherit"
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs pointer-events-none z-20">
          <Loader2 className="h-10 w-10 text-white animate-spin drop-shadow-md" />
        </div>
      )}

      {/* Error Display */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 p-4 text-center z-20">
          <AlertCircle className="h-8 w-8 text-rose-500 mb-2" />
          <p className="text-xs text-white font-medium">Unable to play video</p>
          <button
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.load()
                setHasError(false)
              }
            }}
            className="mt-2 text-[10px] text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}

      {/* Center Play/Pause Animated Splash Indicator */}
      <AnimatePresence>
        {showCenterPlayFlash && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1.1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 m-auto h-16 w-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center pointer-events-none z-30"
          >
            {isPlaying ? (
              <Play className="h-8 w-8 text-white fill-white ml-0.5" />
            ) : (
              <Pause className="h-8 w-8 text-white fill-white" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay: Big Center Play Button when paused initially */}
      {!isPlaying && !isLoading && !hasError && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            togglePlay()
          }}
          aria-label="Play video"
          className="absolute inset-0 m-auto h-14 w-14 rounded-full bg-indigo-600/90 hover:bg-indigo-600 text-white flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-110 cursor-pointer z-20 border border-white/20"
        >
          <Play className="h-6 w-6 fill-white ml-0.5" />
        </button>
      )}

      {/* Custom VibeHub Glassmorphic Controls Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 z-30 ${
          showControls || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrub Progress Bar */}
        <div
          ref={progressBarRef}
          onClick={handleProgressScrub}
          className="relative w-full h-1.5 hover:h-2.5 bg-white/20 rounded-full cursor-pointer transition-all mb-2 group/progress flex items-center"
        >
          {/* Buffered timeline */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-white/30 rounded-full transition-all duration-200"
            style={{ width: `${buffered}%` }}
          />

          {/* Played progress */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-indigo-500 rounded-full relative transition-all"
            style={{ width: `${progressPercent}%` }}
          >
            {/* Scrubber thumb */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-3.5 w-3.5 rounded-full bg-white shadow-md scale-0 group-hover/progress:scale-100 transition-transform" />
          </div>
        </div>

        {/* Lower Control Actions */}
        <div className="flex items-center justify-between text-white text-xs font-medium px-0.5">
          {/* Left: Play/Pause, Volume, Time */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="p-1 text-white hover:text-indigo-400 transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5 fill-current" />}
            </button>

            {/* Volume control with hover slider */}
            <div className="flex items-center gap-1.5 group/volume relative">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                className="p-1 text-white hover:text-indigo-400 transition-colors cursor-pointer"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4.5 w-4.5 text-rose-400" />
                ) : (
                  <Volume2 className="h-4.5 w-4.5" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                aria-label="Volume slider"
                className="w-0 group-hover/volume:w-16 opacity-0 group-hover/volume:opacity-100 transition-all duration-200 h-1 accent-indigo-500 bg-white/30 rounded-lg cursor-pointer"
              />
            </div>

            {/* Time Stamp */}
            <div className="text-[11px] font-mono text-zinc-300">
              <span>{formatTime(currentTime)}</span>
              <span className="mx-1 text-zinc-500">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Speed, Fullscreen */}
          <div className="flex items-center gap-2 relative">
            {/* Playback Speed Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSpeedMenu((prev) => !prev)}
                aria-label="Playback speed"
                className="px-2 py-0.5 rounded text-[11px] font-mono text-zinc-300 hover:text-white bg-white/10 hover:bg-white/20 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>{playbackRate}x</span>
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 py-1 px-1 bg-zinc-900/95 border border-zinc-700/80 rounded-xl backdrop-blur-md shadow-2xl flex flex-col gap-0.5 min-w-[70px] z-40">
                  {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => handleRateChange(rate)}
                      className={`px-2 py-1 text-left text-[11px] rounded-lg transition-colors cursor-pointer ${
                        playbackRate === rate
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-zinc-300 hover:bg-white/10'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              className="p-1 text-white hover:text-indigo-400 transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize className="h-4.5 w-4.5" /> : <Maximize className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VibeVideoPlayer
