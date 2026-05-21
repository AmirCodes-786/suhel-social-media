import React, { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import { Send, Image, Plus, MessageSquare, Loader2, ArrowLeft, MoreVertical, Activity, Search, Phone, Video, Paperclip, Smile, Mic, Trash, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { chatService, followsService } from '../supabaseService'
import { Link, useNavigate } from 'react-router-dom'
import ConfirmationModal from '../components/ConfirmationModal'

const Messages = () => {
  const { user, isDevMode } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [mediaFile, setMediaFile] = useState(null)
  const [mediaPreview, setMediaPreview] = useState(null)
  const [loadingConv, setLoadingConv] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [convSearchQuery, setConvSearchQuery] = useState('')
  const [deleteMsgModal, setDeleteMsgModal] = useState({ isOpen: false, messageId: null })
  const [clearChatModalOpen, setClearChatModalOpen] = useState(false)

  const [friends, setFriends] = useState([])
  const [loadingFriends, setLoadingFriends] = useState(false)

  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch Conversation List
  const fetchConversations = async (selectFirstId = null) => {
    if (!user) return
    try {
      const data = await chatService.getConversations(user.id)
      setConversations(data)
      setLoadingConv(false)

      if (selectFirstId) {
        const found = data.find(c => c.id === selectFirstId)
        if (found) setActiveConversation(found)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      setLoadingConv(false)
    }
  }

  // Fetch Messages for active Conversation
  const fetchMessages = async (convId) => {
    if (!user) return
    try {
      const data = await chatService.getMessages(convId)
      setMessages(data)
      
      // Mark conversation as read
      await chatService.markAsRead(convId, user.id)
      
      // Update local unread counts in state
      setConversations(prev => 
        prev.map(c => c.id === convId ? { ...c, unread_count: 0 } : c)
      )
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [user])

  // Fetch followed users (friends)
  useEffect(() => {
    const fetchFriends = async () => {
      if (!user?.username) return
      setLoadingFriends(true)
      try {
        const data = await followsService.getFollowing(user.username)
        setFriends(data)
      } catch (error) {
        console.error('Error fetching followed friends:', error)
      } finally {
        setLoadingFriends(false)
      }
    }

    if (user) {
      fetchFriends()
    }
  }, [user])

  const handleStartChat = async (friend) => {
    if (!user) return
    try {
      const convId = await chatService.getOrCreateConversation(user.id, friend.id)
      
      // Look for conversation in our local list first
      const existingConv = conversations.find(c => c.id === convId)
      if (existingConv) {
        setActiveConversation(existingConv)
      } else {
        // Reload conversations to include the new one, then select it
        setLoadingConv(true)
        const data = await chatService.getConversations(user.id)
        setConversations(data)
        setLoadingConv(false)
        const found = data.find(c => c.id === convId)
        if (found) {
          setActiveConversation(found)
        }
      }
    } catch (error) {
      console.error('Error starting chat with friend:', error)
      alert('Failed to start chat.')
    }
  }

  useEffect(() => {
    if (!activeConversation) return

    setLoadingMessages(true)
    fetchMessages(activeConversation.id).finally(() => setLoadingMessages(false))
  }, [activeConversation])

  // Real-time Setup
  useEffect(() => {
    if (!activeConversation || !user) return

    const channel = supabase
      .channel(`room:${activeConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new
            if (newMsg && newMsg.conversation_id === activeConversation.id) {
              fetchMessages(activeConversation.id)
            }
          } else if (payload.eventType === 'DELETE') {
            const oldMsgId = payload.old?.id
            if (oldMsgId) {
              setMessages(prev => prev.filter(m => m.id !== oldMsgId))
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeConversation, user])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setMediaFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setMediaPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputText.trim() && !mediaFile) return
    if (!user || !activeConversation) return

    setSending(true)
    try {
      const sentData = await chatService.sendMessage(activeConversation.id, user.id, inputText, mediaFile)
      
      setMessages((prev) => [...prev, sentData])
      
      setConversations(prev => 
        prev.map(c => c.id === activeConversation.id 
          ? { ...c, last_message: sentData, updated_at: sentData.created_at } 
          : c
        ).sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at))
      )

      setInputText('')
      setMediaFile(null)
      setMediaPreview(null)
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  const handleDeleteMessage = (messageId) => {
    setDeleteMsgModal({ isOpen: true, messageId })
  }

  const confirmDeleteMessage = async () => {
    const { messageId } = deleteMsgModal
    if (!messageId) return
    try {
      await chatService.deleteMessage(messageId)
      setMessages(prev => prev.filter(m => m.id !== messageId))
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  const handleClearChat = () => {
    if (!activeConversation) return
    setClearChatModalOpen(true)
  }

  const confirmClearChat = async () => {
    if (!activeConversation) return
    try {
      await chatService.clearChat(activeConversation.id)
      setMessages([])
      setConversations(prev =>
        prev.map(c => c.id === activeConversation.id ? { ...c, last_message: null } : c)
      )
    } catch (error) {
      console.error('Error clearing chat:', error)
    }
  }

  const getChatPartner = (conv) => {
    if (!conv) return null
    return conv.partner || conv.participants_detail?.find(p => p.id !== user?.id)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  // Filter conversation list by partner name
  const filteredConversations = conversations.filter(conv => {
    const partner = getChatPartner(conv)
    if (!partner) return false
    return partner.username.toLowerCase().includes(convSearchQuery.toLowerCase())
  })

  return (
    <div className="min-h-screen w-screen bg-slate-50 text-slate-900 font-outfit pb-16 md:pb-0 flex flex-col">
      
      {/* Top Header Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 z-40">
        {/* Left: Brand */}
        <Link to="/" className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-indigo-600 animate-pulse" />
          <span className="text-xl font-bold tracking-tight text-slate-950">VibeHub</span>
        </Link>

        {/* Center: Search */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search vibe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-transparent rounded-full py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-200 transition-all"
          />
        </form>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center justify-center h-9 w-9 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200/50 hover:border-indigo-100 transition-all"
          >
            <Plus className="h-5 w-5" />
          </Link>
          
          <Link to={`/profile/${user?.username}`}>
            <img
              src={user?.profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
              alt={user?.username}
              className="h-9 w-9 rounded-full object-cover border border-slate-200 hover:border-indigo-500 transition-colors"
            />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex pt-16 md:pl-64 h-[calc(100vh-64px)] overflow-hidden">
        {/* Sidebar navigation */}
        <Sidebar unreadMessagesCount={conversations.reduce((a,c)=>a+(c.unread_count||0),0)} />

        {/* Outer Chat Split Area */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Side: Conversations Sidebar */}
          <div className={`w-full md:w-80 border-r border-slate-100 bg-white flex flex-col shrink-0 ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-6 pb-4 flex flex-col text-left space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">Messages</h3>
                <button className="text-slate-400 hover:text-slate-600 p-1">
                  <MoreVertical className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Conversation Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={convSearchQuery}
                  onChange={(e) => setConvSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-transparent rounded-full py-1.5 pl-9 pr-4 text-[11px] text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-200 transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5 no-scrollbar">
              {/* Direct Message Friends Horizontal Scroll */}
              {friends.length > 0 && (
                <div className="px-2 mb-4 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                    Direct Message Friends
                  </span>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    {friends.map((friend) => (
                      <button
                        key={friend.id}
                        onClick={() => handleStartChat(friend)}
                        className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none cursor-pointer"
                      >
                        <div className="relative">
                          <img
                            src={friend.profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                            alt={friend.username}
                            className="h-11 w-11 rounded-full object-cover border-2 border-transparent group-hover:border-indigo-500 transition-all shadow-sm"
                          />
                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                        </div>
                        <span className="text-[9px] font-medium text-slate-500 group-hover:text-indigo-600 truncate max-w-[55px] transition-colors leading-none">
                          @{friend.username}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="border-b border-slate-100/80 my-2"></div>
                </div>
              )}

              {loadingConv ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-10 px-4 text-xs text-slate-400 font-light space-y-2 text-left">
                  <p>No conversations yet.</p>
                  {friends.length === 0 && (
                    <p className="text-[10px] text-slate-400/85">Explore profiles and follow creators to start a chat!</p>
                  )}
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const partner = getChatPartner(conv)
                  const isSelected = activeConversation?.id === conv.id
                  
                  return (
                    <div
                      key={conv.id}
                      onClick={() => setActiveConversation(conv)}
                      className={`flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer transition-all border ${
                        isSelected 
                          ? 'bg-indigo-50 border-transparent text-indigo-900 font-semibold' 
                          : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={partner?.profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                          alt={partner?.username}
                          className="h-10 w-10 rounded-full border border-slate-100 object-cover"
                        />
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className="text-xs font-bold truncate leading-tight">
                            {partner?.username}
                          </span>
                          <span className="text-[8px] text-slate-400 font-light">
                            {conv.last_message ? new Date(conv.last_message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate leading-snug">
                          {conv.last_message?.content || (conv.last_message?.media ? 'Sent a photo' : 'No messages')}
                        </p>
                      </div>

                      {conv.unread_count > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[9px] font-bold text-white shrink-0">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Side: Chat Window */}
          <div className={`flex-1 flex flex-col bg-slate-50 ${!activeConversation ? 'hidden md:flex justify-center items-center text-slate-400' : 'flex'}`}>
            {activeConversation ? (
              <>
                {/* Chat Partner Header */}
                <div className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-6 shrink-0 z-10">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setActiveConversation(null)}
                      className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 mr-1"
                    >
                      <ArrowLeft className="h-4.5 w-4.5" />
                    </button>
                    <div className="relative">
                      <img
                        src={getChatPartner(activeConversation)?.profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                        alt="Partner"
                        className="h-9 w-9 rounded-full border border-slate-100 object-cover"
                      />
                      <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-white"></span>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-800 leading-snug">
                        {getChatPartner(activeConversation)?.username}
                      </span>
                      <span className="text-[9px] text-slate-400 font-light">
                        Online
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-slate-400">
                    <button className="p-2 rounded-lg hover:text-indigo-600 hover:bg-slate-50 transition-colors">
                      <Phone className="h-4 w-4" />
                    </button>
                    <button className="p-2 rounded-lg hover:text-indigo-600 hover:bg-slate-50 transition-colors">
                      <Video className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={handleClearChat}
                      className="p-2 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50/50 transition-colors cursor-pointer"
                      title="Clear Chat"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button className="p-2 rounded-lg hover:text-indigo-600 hover:bg-slate-50 transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Message Feed Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 no-scrollbar">
                  {loadingMessages ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-full text-slate-400 text-xs">
                      <MessageSquare className="h-8 w-8 text-slate-300 mb-2" />
                      <span>No messages yet. Say hi!</span>
                    </div>
                  ) : (
                    <>
                      {/* Optional Date Separator */}
                      <div className="text-[10px] text-slate-400 font-bold tracking-wider uppercase py-2">
                        Monday, October 23rd
                      </div>
                      
                      {messages.map((msg) => {
                        const isMe = msg.sender === user?.id
                        
                        return (
                          <div key={msg.id} className={`flex gap-3 text-left group ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {isMe && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="self-center opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 cursor-pointer"
                                title="Delete Message"
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {!isMe && (
                              <img
                                src={msg.sender_detail?.profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                                alt="Sender"
                                className="h-8 w-8 rounded-full border border-slate-100 object-cover self-end shrink-0"
                              />
                            )}
                            <div className="flex flex-col max-w-[70%]">
                              <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                                isMe 
                                  ? 'bg-indigo-600 text-white rounded-br-none shadow-sm' 
                                  : 'bg-[#f3f4f6] text-slate-800 rounded-bl-none'
                              }`}>
                                {msg.content && <p className="whitespace-pre-line">{msg.content}</p>}
                                {msg.media && (
                                  <img src={msg.media} alt="Message attachment" className="mt-2 rounded-lg max-h-[200px] object-cover" />
                                )}
                              </div>
                              <div className={`flex items-center gap-1 mt-1 text-[8px] text-slate-400 font-light ${isMe ? 'self-end' : 'self-start'}`}>
                                <span>{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                {isMe && (
                                  <svg className="h-3 w-3 text-indigo-500 fill-none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input Container */}
                <div className="p-4 border-t border-slate-100 bg-white flex flex-col shrink-0 relative">
                  {mediaPreview && (
                    <div className="absolute bottom-20 left-4 bg-white border border-slate-100 p-2.5 rounded-2xl flex items-center gap-2 shadow-lg">
                      <img src={mediaPreview} alt="Attached upload preview" className="h-12 w-12 rounded-xl object-cover" />
                      <button 
                        type="button" 
                        onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                        className="text-slate-400 hover:text-slate-800 text-xs font-bold px-1"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {/* Input Form Bar */}
                  <form onSubmit={handleSendMessage} className="flex items-center gap-3 relative bg-slate-50 border border-slate-200/50 rounded-2xl px-4 py-2">
                    {/* Attachments */}
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sending}
                        className="p-1.5 rounded-lg hover:text-indigo-600 hover:bg-slate-200/50 transition-colors"
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <Paperclip className="h-4.5 w-4.5" />
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 rounded-lg hover:text-indigo-600 hover:bg-slate-200/50 transition-colors"
                      >
                        <Image className="h-4.5 w-4.5" />
                      </button>
                    </div>

                    {/* Text Field */}
                    <input
                      type="text"
                      placeholder={`Message ${getChatPartner(activeConversation)?.username || ''}...`}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      disabled={sending}
                      className="flex-1 bg-transparent border-none outline-none py-2 text-xs text-slate-800 placeholder-slate-400"
                    />

                    {/* Emoji, Mic and Send */}
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <button
                        type="button"
                        className="p-1.5 rounded-lg hover:text-indigo-600 hover:bg-slate-200/50 transition-colors"
                      >
                        <Smile className="h-4.5 w-4.5" />
                      </button>

                      <button
                        type="button"
                        className="p-1.5 rounded-lg hover:text-indigo-600 hover:bg-slate-200/50 transition-colors"
                      >
                        <Mic className="h-4.5 w-4.5" />
                      </button>

                      <button
                        type="submit"
                        disabled={sending || (!inputText.trim() && !mediaFile)}
                        className="h-8 w-8 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </form>

                  {/* Secure Chat Footer */}
                  <span className="text-[8px] font-bold text-slate-300 tracking-wider text-center uppercase mt-3">
                    End-to-End Encrypted • Vibe Safely
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 shadow-sm mb-4">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-700">Select a chat</h3>
                <p className="text-xs text-slate-400 mt-1">Pick a conversation from the left to start vibes</p>
              </div>
            )}
          </div>

        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteMsgModal.isOpen}
        onClose={() => setDeleteMsgModal({ isOpen: false, messageId: null })}
        onConfirm={confirmDeleteMessage}
        title="Delete Message?"
        message="Are you sure you want to delete this message? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
      />

      <ConfirmationModal
        isOpen={clearChatModalOpen}
        onClose={() => setClearChatModalOpen(false)}
        onConfirm={confirmClearChat}
        title="Clear Chat?"
        message="Are you sure you want to clear all messages in this chat? This action cannot be undone."
        confirmText="Clear Chat"
        cancelText="Cancel"
        isDestructive={true}
      />
    </div>
  )
}

export default Messages
