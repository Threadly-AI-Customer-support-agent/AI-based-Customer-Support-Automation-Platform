import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { sendMessage, getChatHistory, uploadImage, uploadVoice, logout, sendFeedback, getSessions } from '../services/api'
import { TextScramble } from '../components/ui/text-scramble'
import { Plus, Send, Mic, Bot, User, Star, Package, LogOut, Clock, X, MessageSquare, ImagePlus, HelpCircle } from 'lucide-react'
import { Button } from '../components/ui/button'

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sessions, setSessions] = useState([])
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [rating, setRating] = useState(0)
  const [escalated, setEscalated] = useState(false)

  const { logoutUser } = useAuth()
  const navigate = useNavigate()
  const messagesContainerRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)
  const recordingTimeRef = useRef(0)
  const activeStreamRef = useRef(null)

  // ── Instant scroll to bottom (no animation, no jump) ──
  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current
    if (container) {
      // Use requestAnimationFrame to ensure DOM has painted
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight
      })
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading, scrollToBottom])

  // ── Sessions ──
  const loadSessions = async () => {
    try {
      const res = await getSessions()
      setSessions(res.data.sessions || [])
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const handleSelectSession = async (sessionId) => {
    setLoading(true)
    try {
      setCurrentSessionId(sessionId)
      const res = await getChatHistory(sessionId)
      setMessages(res.data.messages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleNewChat = () => {
    setCurrentSessionId(null)
    setMessages([])
  }

  // ── Recording timer ──
  useEffect(() => {
    if (recording) {
      setRecordingTime(0)
      recordingTimeRef.current = 0
      timerRef.current = setInterval(() => {
        recordingTimeRef.current += 1
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } else {
      clearInterval(timerRef.current)
      setRecordingTime(0)
    }
    return () => clearInterval(timerRef.current)
  }, [recording])

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // ── Send message ──
  const handleSend = async (messageText) => {
    if (!messageText.trim() || loading) return
    const userMessage = messageText.trim()

    setMessages(prev => [...prev, {
      id: Date.now(),
      content: userMessage,
      sender: 'USER',
      type: 'TEXT'
    }])

    setLoading(true)
    try {
      const res = await sendMessage({ message: userMessage, sessionId: currentSessionId })

      if (!currentSessionId && res.data.sessionId) {
        setCurrentSessionId(res.data.sessionId)
        loadSessions()
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        content: res.data.reply,
        sender: 'AI',
        type: 'TEXT'
      }])
      if (
        res.data.reply.toLowerCase().includes('connecting you to an agent') ||
        res.data.reply.toLowerCase().includes('human agent')
      ) {
        setEscalated(true)
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        content: 'Something went wrong. Please try again.',
        sender: 'AI',
        type: 'TEXT'
      }])
    } finally {
      setLoading(false)
    }
  }

  // ── Image upload ──
  const handleImageUpload = async (e) => {
    const file = e.target?.files?.[0]
    if (!file) return

    const previewURL = URL.createObjectURL(file)

    setMessages(prev => [...prev, {
      id: Date.now(),
      content: previewURL,
      fileName: file.name,
      sender: 'USER',
      type: 'IMAGE'
    }])

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      if (currentSessionId) formData.append('sessionId', currentSessionId)

      const res = await uploadImage(formData)

      if (!currentSessionId && res.data.sessionId) {
        setCurrentSessionId(res.data.sessionId)
        loadSessions()
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        content: res.data.reply,
        sender: 'AI',
        type: 'TEXT'
      }])

      // Show escalation banner if ticket was escalated
      if (res.data.escalated) {
        setEscalated(true)
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        content: 'Image upload failed. Please try again.',
        sender: 'AI',
        type: 'TEXT'
      }])
    } finally {
      setLoading(false)
    }
  }

  // ── Voice toggle ──
  const handleVoiceToggle = async () => {
    if (loading) return
    if (recording) {
      mediaRecorderRef.current?.stop()
      setRecording(false)
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        activeStreamRef.current = stream
        mediaRecorderRef.current = new MediaRecorder(stream)
        audioChunksRef.current = []

        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data)
        }

        mediaRecorderRef.current.onstop = async () => {
          const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm'
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
          const audioURL = URL.createObjectURL(audioBlob)
          const duration = recordingTimeRef.current

          const formData = new FormData()
          formData.append('audio', audioBlob, 'recording.webm')
          if (currentSessionId) formData.append('sessionId', currentSessionId)

          setMessages(prev => [...prev, {
            id: Date.now(),
            content: audioURL,
            duration: duration,
            sender: 'USER',
            type: 'VOICE'
          }])

          setLoading(true)
          try {
            const res = await uploadVoice(formData)
            if (res.data.transcribedText) {
              setMessages(prev => [...prev, {
                id: Date.now() + 1,
                content: `🎙️ "${res.data.transcribedText}"`,
                sender: 'USER',
                type: 'TEXT'
              }])
            }
            setMessages(prev => [...prev, {
              id: Date.now() + 2,
              content: res.data.reply,
              sender: 'AI',
              type: 'TEXT'
            }])
          } catch (err) {
            setMessages(prev => [...prev, {
              id: Date.now() + 1,
              content: 'Voice message failed to process. Please try again.',
              sender: 'AI',
              type: 'TEXT'
            }])
          } finally {
            setLoading(false)
          }

          stream.getTracks().forEach(track => track.stop())
          activeStreamRef.current = null
        }

        mediaRecorderRef.current.start()
        setRecording(true)
      } catch (err) {
        alert('Microphone access denied. Please allow microphone access in your browser settings.')
      }
    }
  }

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null
      mediaRecorderRef.current.onstop = null
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => track.stop())
      activeStreamRef.current = null
    }
    setRecording(false)
    audioChunksRef.current = []
  }

  const handleLogout = async () => {
    try { await logout() } catch (err) { console.error(err) }
    finally { logoutUser(); navigate('/login') }
  }

  const handleFeedback = async (star) => {
    try {
      await sendFeedback({ rating: star })
      setRating(star)
      setTimeout(() => setShowFeedback(false), 1500)
    } catch (err) { console.error(err) }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden relative">

      {/* ═══════════════ SIDEBAR ═══════════════ */}
      <aside
        className={`
          ${sidebarOpen ? 'w-72' : 'w-0'}
          shrink-0 transition-all duration-300 ease-in-out overflow-hidden
          bg-[#0a0e1a] border-r border-white/[0.08]
          flex flex-col relative z-20
        `}
      >
        {/* Sidebar Header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Bot className="w-4.5 h-4.5 text-white" />
              </div>
              <TextScramble as="span" className="text-white font-semibold text-sm tracking-wide">
                Threadly
              </TextScramble>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
              bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium
              hover:from-blue-500 hover:to-blue-400 transition-all duration-200
              shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30
              active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto py-3 px-3" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
          <p className="text-[11px] font-medium text-white/50 uppercase tracking-wider px-2 mb-2">
            Recent Chats
          </p>
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="w-8 h-8 text-white/20 mb-3" />
              <p className="text-white/40 text-xs">No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSession(s.id)}
                  className={`
                    w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 group
                    ${currentSessionId === s.id
                      ? 'bg-blue-500/15 text-white shadow-sm border border-blue-500/20'
                      : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
                    }
                  `}
                >
                  <p className="truncate text-sm font-medium leading-snug">{s.title}</p>
                  <p className={`text-[11px] mt-0.5 ${currentSessionId === s.id ? 'text-blue-300/60' : 'text-white/40 group-hover:text-white/50'}`}>
                    {new Date(s.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="px-3 py-3 border-t border-white/[0.06] space-y-1 shrink-0">
          <button onClick={() => navigate('/orders')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.06] transition-all text-sm">
            <Package className="w-4 h-4" /> Orders
          </button>
          <button onClick={() => navigate('/faqs')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.06] transition-all text-sm">
            <HelpCircle className="w-4 h-4" /> FAQs
          </button>
          <button onClick={() => setShowFeedback(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.06] transition-all text-sm">
            <Star className="w-4 h-4" /> Rate Experience
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-400/80 hover:text-red-400 hover:bg-red-400/[0.08] transition-all text-sm">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ═══════════════ MAIN CHAT AREA ═══════════════ */}
      <main className="flex-1 flex flex-col min-w-0 relative bg-[#0c1017]/80">

        {/* Chat Header */}
        <header className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/[0.08] bg-[#0d1118]/95 backdrop-blur-xl z-10">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle (always visible) */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-400" />
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black ${escalated ? 'bg-orange-500' : 'bg-emerald-500'}`} />
              </div>
              <div>
                <h1 className="text-white font-semibold text-sm leading-tight">AI Assistant</h1>
                <p className="text-[11px] leading-tight" style={{ color: escalated ? '#fb923c' : '#4ade80' }}>
                  {escalated ? 'Connected to Agent' : 'Online'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={handleNewChat}
              className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors" title="New Chat">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ── Messages Area ── */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">

            {/* Empty State */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center pt-24 pb-12 text-center select-none">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/10 flex items-center justify-center mb-5">
                  <Bot className="w-8 h-8 text-blue-400/60" />
                </div>
                <h2 className="text-xl font-semibold text-white/80 mb-2">How can I help you today?</h2>
                <p className="text-sm text-white/50 max-w-sm">
                  Ask me anything about your orders, products, or account. I'm here to assist you.
                </p>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`flex items-end gap-2.5 ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}
              >
                {/* AI Avatar */}
                {msg.sender === 'AI' && (
                  <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/15 flex items-center justify-center shrink-0 mb-0.5">
                    <Bot className="w-4 h-4 text-blue-400" />
                  </div>
                )}

                <div className={`max-w-[75%] sm:max-w-[65%] flex flex-col ${msg.sender === 'USER' ? 'items-end' : 'items-start'}`}>

                  {/* IMAGE bubble */}
                  {msg.type === 'IMAGE' && (
                    <div className={`rounded-2xl overflow-hidden shadow-lg ${msg.sender === 'USER' ? 'rounded-br-md' : 'rounded-bl-md'}`}>
                      <img src={msg.content} alt="uploaded" className="max-w-xs max-h-64 object-cover" />
                    </div>
                  )}

                  {/* VOICE bubble */}
                  {msg.type === 'VOICE' && (
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-md ${
                      msg.sender === 'USER'
                        ? 'bg-gradient-to-br from-blue-600 to-blue-500 rounded-br-md'
                        : 'bg-[#1a1f2e] border border-white/[0.08] rounded-bl-md'
                    }`}>
                      <audio src={msg.content} controls className="hidden" id={`audio-${msg.id || index}`} />
                      <button
                        onClick={() => {
                          const audio = document.getElementById(`audio-${msg.id || index}`)
                          audio?.paused ? audio?.play() : audio?.pause()
                        }}
                        className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center shrink-0 transition-colors"
                      >
                        ▶️
                      </button>
                      <div className="flex items-center gap-[3px]">
                        {[3, 5, 8, 5, 9, 4, 7, 5, 3, 6, 8, 4, 6].map((h, i) => (
                          <div key={i} className="w-[3px] rounded-full bg-white/50" style={{ height: `${h * 2}px` }} />
                        ))}
                      </div>
                      <span className="text-white/50 text-xs shrink-0 font-mono">{formatTime(msg.duration || 0)}</span>
                    </div>
                  )}

                  {/* TEXT bubble */}
                  {msg.type === 'TEXT' && (
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-md ${
                      msg.sender === 'USER'
                        ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-br-md'
                        : 'bg-[#1a1f2e] text-white border border-white/[0.08] rounded-bl-md'
                    }`}>
                      {msg.content}
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {msg.sender === 'USER' && (
                  <div className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0 mb-0.5">
                    <User className="w-4 h-4 text-white/60" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex items-end gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/15 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-[#1a1f2e] border border-white/[0.08] shadow-md">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-[pulse_1.2s_ease-in-out_infinite]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-[pulse_1.2s_ease-in-out_0.2s_infinite]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-[pulse_1.2s_ease-in-out_0.4s_infinite]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Escalated Banner */}
        {escalated && (
          <div className="shrink-0 bg-orange-500/[0.06] border-t border-orange-500/20 px-6 py-2.5 text-center">
            <p className="text-orange-400 text-xs font-medium">
              ⚠️ Your issue has been escalated. A human agent will contact you shortly.
            </p>
          </div>
        )}

        {/* ── Input Area ── */}
        {recording ? (
          /* Recording UI */
          <div className="shrink-0 px-4 py-4 bg-[#0d1118]/95 backdrop-blur-xl border-t border-white/[0.08]">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 bg-white/[0.04] rounded-2xl px-4 py-3 border border-red-500/20">
                <button onClick={handleCancelRecording}
                  className="text-white/40 hover:text-red-400 transition-colors text-lg shrink-0">
                  ✕
                </button>
                <div className="flex items-center gap-2.5 flex-1">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shrink-0" />
                  <span className="text-white/80 text-sm font-mono">{formatTime(recordingTime)}</span>
                  <div className="flex items-center gap-[2px] ml-1">
                    {[4, 7, 5, 9, 6, 8, 4, 7, 5, 6].map((h, i) => (
                      <div key={i} className="w-[3px] bg-red-400/60 rounded-full animate-pulse"
                        style={{ height: `${h * 2}px`, animationDelay: `${i * 100}ms` }} />
                    ))}
                  </div>
                </div>
                <button onClick={handleVoiceToggle}
                  className="w-10 h-10 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors shrink-0 shadow-lg shadow-red-500/20">
                  <span className="text-white text-sm">⏹</span>
                </button>
              </div>
              <p className="text-white/20 text-[11px] text-center mt-2">✕ cancel • ⏹ send</p>
            </div>
          </div>
        ) : (
          /* Normal Input */
          <div className="shrink-0 px-4 py-3 bg-[#0d1118]/95 backdrop-blur-xl border-t border-white/[0.08]">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-2 bg-white/[0.06] rounded-2xl px-2 py-1.5 border border-white/[0.10]
                transition-all duration-200 focus-within:border-blue-500/30 focus-within:bg-white/[0.08]
                focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.08)]">
                <input
                  className="flex-1 bg-transparent px-3 py-2 min-w-0 text-sm text-white focus:outline-none placeholder:text-white/40"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && input.trim()) {
                      e.preventDefault()
                      handleSend(input)
                      setInput('')
                    }
                  }}
                />
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
                    onClick={() => {
                      const fileInput = document.createElement('input')
                      fileInput.type = 'file'
                      fileInput.accept = 'image/*'
                      fileInput.onchange = (e) => handleImageUpload(e)
                      fileInput.click()
                    }}
                    title="Upload image"
                  >
                    <ImagePlus className="w-5 h-5" />
                  </button>
                  <button
                    className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
                    onClick={handleVoiceToggle}
                    title="Voice message"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                  <button
                    className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-colors
                      disabled:opacity-30 disabled:hover:bg-blue-600 disabled:cursor-not-allowed
                      shadow-lg shadow-blue-600/20"
                    onClick={() => {
                      if (input.trim()) {
                        handleSend(input)
                        setInput('')
                      }
                    }}
                    disabled={!input.trim()}
                    title="Send"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ═══════════════ FEEDBACK MODAL ═══════════════ */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowFeedback(false)}>
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl p-8 border border-white/[0.08] text-center w-80 shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-semibold text-lg mb-1">Rate your experience</h3>
            <p className="text-white/40 text-sm mb-6">How was your support experience?</p>
            <div className="flex justify-center gap-3 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => handleFeedback(star)}
                  className={`text-3xl transition-all duration-150 hover:scale-110 active:scale-95 ${rating >= star ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}>
                  ⭐
                </button>
              ))}
            </div>
            {rating > 0 && <p className="text-emerald-400 text-sm font-medium">Thank you! ✅</p>}
            <button onClick={() => setShowFeedback(false)}
              className="mt-4 text-white/30 hover:text-white/60 text-sm transition-colors">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}