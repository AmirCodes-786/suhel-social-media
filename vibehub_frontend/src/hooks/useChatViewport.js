import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * useChatViewport
 * 
 * Provides ultra-responsive mobile viewport tracking:
 * - Detects visualViewport changes when on-screen keyboard opens/closes
 * - Prevents unwanted page-level scrolling and bounce on mobile
 * - Accurately computes available viewport height without 100vh bugs
 * - Sets CSS custom property `--chat-vh` for smooth CSS integration
 */
export function useChatViewport() {
  const [viewportHeight, setViewportHeight] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.visualViewport ? window.visualViewport.height : window.innerHeight
    }
    return 800
  })

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const rafIdRef = useRef(null)
  const isInputFocusedRef = useRef(false)

  // Listen to focusin / focusout to assist in keyboard detection
  useEffect(() => {
    const handleFocusIn = (e) => {
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) {
        isInputFocusedRef.current = true
      }
    }

    const handleFocusOut = () => {
      isInputFocusedRef.current = false
      // Give time for keyboard to close and viewport to restore
      setTimeout(() => {
        if (!isInputFocusedRef.current && window.visualViewport) {
          const vv = window.visualViewport
          const kbOpen = (window.innerHeight - vv.height) > 80
          setIsKeyboardOpen(kbOpen)
          setViewportHeight(vv.height)
        }
      }, 100)
    }

    window.addEventListener('focusin', handleFocusIn, { passive: true })
    window.addEventListener('focusout', handleFocusOut, { passive: true })
    return () => {
      window.removeEventListener('focusin', handleFocusIn)
      window.removeEventListener('focusout', handleFocusOut)
    }
  }, [])

  // Lock body & document overscroll on chat page
  useEffect(() => {
    const origBodyOverscroll = document.body.style.overscrollBehavior
    const origHtmlOverscroll = document.documentElement.style.overscrollBehavior
    const origBodyOverflow = document.body.style.overflow

    document.body.style.overscrollBehavior = 'none'
    document.documentElement.style.overscrollBehavior = 'none'

    return () => {
      document.body.style.overscrollBehavior = origBodyOverscroll
      document.documentElement.style.overscrollBehavior = origHtmlOverscroll
      document.body.style.overflow = origBodyOverflow
    }
  }, [])

  // Viewport resize & scroll listener
  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateDimensions = () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }

      rafIdRef.current = requestAnimationFrame(() => {
        const vv = window.visualViewport
        const currentHeight = vv ? vv.height : window.innerHeight
        
        // Detect keyboard presence:
        // 1. Difference between window.innerHeight and visualViewport.height > 80px
        // 2. Or focused input with height noticeably less than window height
        const heightDiff = window.innerHeight - currentHeight
        const kbActive = heightDiff > 80 || (isInputFocusedRef.current && heightDiff > 40)

        setViewportHeight(Math.round(currentHeight))
        setIsKeyboardOpen(kbActive)

        // Set CSS custom property on document root for full CSS synchronization
        document.documentElement.style.setProperty('--chat-vh', `${Math.round(currentHeight)}px`)

        // Prevent iOS visual viewport offset displacement
        if (vv && vv.offsetTop > 0) {
          window.scrollTo(0, 0)
        }
      })
    }

    // Initial sync
    updateDimensions()

    const vv = window.visualViewport
    if (vv) {
      vv.addEventListener('resize', updateDimensions, { passive: true })
      vv.addEventListener('scroll', updateDimensions, { passive: true })
    }
    window.addEventListener('resize', updateDimensions, { passive: true })

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
      if (vv) {
        vv.removeEventListener('resize', updateDimensions)
        vv.removeEventListener('scroll', updateDimensions)
      }
      window.removeEventListener('resize', updateDimensions)
    }
  }, [])

  return {
    viewportHeight,
    isKeyboardOpen
  }
}

export default useChatViewport
