import { useState, useRef, useEffect, forwardRef, useImperativeHandle, memo } from 'react'
import { Send, Paperclip, Smile, Loader2 } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'

const ChatComposer = forwardRef(function ChatComposer(
  { onSendMessage, sending = false, theme = 'dark' },
  ref
) {
  const [inputText, setInputText] = useState('')
  const [mediaFile, setMediaFile] = useState(null)
  const [mediaPreview, setMediaPreview] = useState(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const pickerRef = useRef(null)

  // Expose imperative handle for external auto-focusing
  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus()
    },
    appendText: (char) => {
      setInputText((prev) => prev + char)
      textareaRef.current?.focus()
    }
  }))

  // Close emoji picker when clicking outside
  useEffect(() => {
    if (!showEmojiPicker) return

    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [showEmojiPicker])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMediaFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setMediaPreview(reader.result)
    reader.readAsDataURL(file)
    // Clear input so same file can be re-selected if removed
    e.target.value = ''
  }

  const handleRemoveMedia = () => {
    setMediaFile(null)
    setMediaPreview(null)
  }

  const handleSend = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    const trimmed = inputText.trim()
    if (!trimmed && !mediaFile) return
    if (sending) return

    const mediaType = mediaFile?.type?.startsWith('video/')
      ? 'video'
      : (mediaPreview ? 'image' : 'text')

    onSendMessage({
      content: trimmed,
      mediaFile,
      mediaType,
      mediaPreview
    })

    // Reset composer state instantly
    setInputText('')
    setMediaFile(null)
    setMediaPreview(null)
    setShowEmojiPicker(false)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      // Maintain focus so mobile keyboard doesn't glitch closed
      textareaRef.current.focus()
    }
  }

  const handleTextareaChange = (e) => {
    setInputText(e.target.value)
    // Auto-grow height smoothly
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  const handleEmojiClick = (emojiData) => {
    setInputText((prev) => prev + emojiData.emoji)
    setShowEmojiPicker(false)
    textareaRef.current?.focus()
  }

  const canSend = (inputText.trim().length > 0 || Boolean(mediaFile)) && !sending

  return (
    <div className="shrink-0 w-full bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 transition-colors relative z-20">
      {/* Media Preview Tray */}
      {mediaPreview && (
        <div className="p-2.5 px-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/70 dark:bg-slate-950/50">
          <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 shadow-sm">
            {mediaFile?.type?.startsWith('video/') ? (
              <video src={mediaPreview} className="h-full w-full object-cover" />
            ) : (
              <img src={mediaPreview} alt="Upload preview" className="h-full w-full object-cover" />
            )}
            <button
              type="button"
              onClick={handleRemoveMedia}
              className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white rounded-full p-0.5 text-[10px] transition-all cursor-pointer"
              title="Remove media"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate block">
              {mediaFile?.name}
            </span>
            <span className="text-[10px] text-slate-400">
              {mediaFile ? `${(mediaFile.size / 1024).toFixed(1)} KB` : ''}
            </span>
          </div>
        </div>
      )}

      {/* Main Composer Form */}
      <form
        onSubmit={handleSend}
        className="px-3 py-2.5 sm:px-4 sm:py-3 flex items-end gap-2 relative"
      >
        {/* Emoji Picker Popover */}
        {showEmojiPicker && (
          <div
            ref={pickerRef}
            className="absolute bottom-16 left-3 sm:left-4 z-50 shadow-2xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-w-[calc(100vw-24px)]"
          >
            <EmojiPicker
              theme={theme === 'dark' ? 'dark' : 'light'}
              onEmojiClick={handleEmojiClick}
              width="100%"
              height={360}
              lazyLoadEmojis={true}
            />
          </div>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,video/*"
          className="hidden"
        />

        {/* Left Action Buttons: Emojis & Attachment */}
        <div className="flex items-center gap-0.5 sm:gap-1 text-slate-400 dark:text-slate-500 pb-0.5">
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="p-2 rounded-xl hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Choose Emoji"
          >
            <Smile className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Attach Media"
          >
            <Paperclip className="h-5 w-5" />
          </button>
        </div>

        {/* Multiline Textarea: 16px font size on mobile to prevent iOS Safari auto-zoom */}
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Type a message..."
          value={inputText}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-slate-100 dark:bg-slate-800/80 border border-transparent dark:border-slate-700/50 rounded-2xl py-2 px-3.5 sm:px-4 text-[16px] md:text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-slate-300 dark:focus:border-slate-700 transition-all resize-none max-h-32 no-scrollbar leading-relaxed"
          style={{ minHeight: '40px' }}
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!canSend}
          className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all shrink-0 cursor-pointer ${
            canSend
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-95'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
          }`}
          title="Send Message"
        >
          {sending ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
          ) : (
            <Send className="h-4.5 w-4.5" />
          )}
        </button>
      </form>
    </div>
  )
})

export default memo(ChatComposer)
