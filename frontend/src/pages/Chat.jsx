import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { sendMessage, getChatHistory, uploadImage, uploadVoice, logout, sendFeedback } from '../services/api'
import { AIInputWithLoading } from '../components/ui/ai-input-with-loading'
import { TextScramble } from '../components/ui/text-scramble'
import { CanvasRevealEffect } from '../components/ui/canvas-effect'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Send, Mic } from 'lucide-react'
import { Input } from '../components/ui/input'
import { Tiles } from '../components/ui/tiles'
import { Button } from '../components/ui/button'

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [rating, setRating] = useState(0)
  const [escalated, setEscalated] = useState(false)

  const { logoutUser } = useAuth()
  const navigate = useNavigate()
  const messagesEndRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await getChatHistory()
        setMessages(res.data.messages)
      } catch (err) {
        console.error(err)
      }
    }
    loadHistory()
  }, [])

  // Recording timer
  useEffect(() => {
    if (recording) {
      setRecordingTime(0)
      timerRef.current = setInterval(() => {
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
      const res = await sendMessage({ message: userMessage })
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

  // Removed handleKeyDown since AIInputWithLoading handles it

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
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
      const res = await uploadImage(formData)
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        content: res.data.reply,
        sender: 'AI',
        type: 'TEXT'
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        content: 'Image upload failed. Please try again.',
        sender: 'AI',
        type: 'TEXT'
      }])
    } finally {
      setLoading(false)
      e.target.value = ''
    }
  }

  const handleVoiceToggle = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop()
      setRecording(false)
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaRecorderRef.current = new MediaRecorder(stream)
        audioChunksRef.current = []

        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data)
        }

        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          const audioURL = URL.createObjectURL(audioBlob)
          const duration = recordingTime

          const formData = new FormData()
          formData.append('audio', audioBlob, 'recording.webm')

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
            setMessages(prev => [...prev, {
              id: Date.now() + 1,
              content: res.data.reply,
              sender: 'AI',
              type: 'TEXT'
            }])
          } catch (err) {
            setMessages(prev => [...prev, {
              id: Date.now() + 1,
              content: 'Voice message sent. Processing...',
              sender: 'AI',
              type: 'TEXT'
            }])
          } finally {
            setLoading(false)
          }

          stream.getTracks().forEach(track => track.stop())
        }

        mediaRecorderRef.current.start()
        setRecording(true)
      } catch (err) {
        alert('Microphone access denied')
      }
    }
  }

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null
      mediaRecorderRef.current.onstop = null
      mediaRecorderRef.current.stop()
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
    <div className="flex flex-col h-screen w-full relative">
      {/* Absolute background if needed */}
      <div className="absolute inset-0 z-0 bg-transparent pointer-events-none" />

      {/* Full-width Header */}
      <div className="w-full flex justify-center border-b border-white/5 bg-[#030303] backdrop-blur-md z-20 shrink-0">
        <div className="flex items-center justify-between w-full max-w-7xl px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <TextScramble as="h1" className="text-white font-semibold text-sm">Threadly</TextScramble>
              <p className="text-xs" style={{ color: escalated ? '#f97316' : '#4ade80' }}>
                {escalated ? '🔴 Connected to Agent' : '🟢 AI Assistant'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFeedback(true)}
              className="text-gray-400 hover:text-white text-xs border border-gray-700 px-3 py-1.5 rounded-lg transition">
              ⭐ Rate
            </button>
            <button onClick={() => navigate('/orders')}
              className="text-gray-400 hover:text-white text-xs border border-gray-700 px-3 py-1.5 rounded-lg transition">
              📦 Orders
            </button>
            <button onClick={handleLogout}
              className="text-red-400 hover:text-red-300 text-xs border border-red-900 px-3 py-1.5 rounded-lg transition">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Container Area */}
      <div className="flex-1 flex justify-center items-center w-full relative z-10 overflow-hidden">
        {/* Main Chat Center */}
        <div className="flex justify-center items-center flex-1 overflow-hidden w-full p-4 lg:p-8 relative z-10">
          <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="flex flex-col w-full max-w-3xl h-[600px] bg-white sm:rounded-3xl sm:border border-black/5 shadow-[0_0_80px_rgba(0,0,0,0.1)] relative overflow-hidden group z-10"
          >
            {/* Tiles Background for Chat Widget */}
            <div className="absolute inset-0 z-0 pointer-events-none text-gray-200">
              <Tiles rows={50} cols={8} tileSize="md" className="opacity-100" />
            </div>

            <AnimatePresence>
              {hovered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 h-full w-full object-cover pointer-events-none z-0"
                >
                  <CanvasRevealEffect
                    animationSpeed={5}
                    containerClassName="bg-transparent"
                    colors={[[245, 5, 55], [155, 30, 255]]}
                    opacities={[0.2, 0.4, 0.2, 0.4, 0.1, 0.4, 0.2, 0.1, 0.2, 0.5]}
                    dotSize={2}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3 z-10 relative">

              {messages.length === 0 && (
                <div className="relative flex w-full flex-col items-center justify-center pt-24 pb-12 text-center z-10">
                  <h1 className="flex select-none py-2 text-center text-3xl font-extrabold leading-none tracking-tight md:text-5xl lg:text-6xl">
                    <span data-content="AI." className="before:animate-gradient-background-1 relative before:absolute before:bottom-4 before:left-0 before:top-0 before:z-0 before:w-full before:px-2 before:content-[attr(data-content)] sm:before:top-0">
                      <span className="from-gradient-1-start to-gradient-1-end animate-gradient-foreground-1 bg-gradient-to-r bg-clip-text px-2 text-transparent">AI.</span>
                    </span>
                    <span data-content="Chat." className="before:animate-gradient-background-2 relative before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:w-full before:px-2 before:content-[attr(data-content)] sm:before:top-0">
                      <span className="from-gradient-2-start to-gradient-2-end animate-gradient-foreground-2 bg-gradient-to-r bg-clip-text px-2 text-transparent">Chat.</span>
                    </span>
                    <span data-content="Experience." className="before:animate-gradient-background-3 relative before:absolute before:bottom-1 before:left-0 before:top-0 before:z-0 before:w-full before:px-2 before:content-[attr(data-content)] sm:before:top-0">
                      <span className="from-gradient-3-start to-gradient-3-end animate-gradient-foreground-3 bg-gradient-to-r bg-clip-text px-2 text-transparent">Experience.</span>
                    </span>
                  </h1>
                  <p className="md:text-lg lg:text-xl mx-auto mt-6 text-center text-black/50 tracking-wide font-medium">
                    How can I help you today?
                  </p>
                </div>
              )}

              {messages.map((msg, index) => (
                <div key={msg.id || index}
                  className={`flex items-end gap-2 ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>

                  {msg.sender === 'AI' && (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm flex-shrink-0">
                      🤖
                    </div>
                  )}

                  <div className={`max-w-xs lg:max-w-md ${msg.sender === 'USER' ? 'items-end' : 'items-start'
                    } flex flex-col`}>

                    {/* IMAGE bubble */}
                    {msg.type === 'IMAGE' && (
                      <div className={`rounded-2xl overflow-hidden ${msg.sender === 'USER' ? 'rounded-br-sm' : 'rounded-bl-sm'
                        }`}>
                        <img
                          src={msg.content}
                          alt="uploaded"
                          className="max-w-xs max-h-64 object-cover"
                        />
                      </div>
                    )}

                    {/* VOICE bubble — WhatsApp style */}
                    {msg.type === 'VOICE' && (
                      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${msg.sender === 'USER'
                        ? 'bg-blue-600 rounded-br-sm'
                        : 'bg-gray-800 rounded-bl-sm'
                        }`}>
                        {/* Play button */}
                        <audio src={msg.content} controls
                          className="hidden"
                          id={`audio-${msg.id || index}`}
                        />
                        <button
                          onClick={() => {
                            const audio = document.getElementById(`audio-${msg.id || index}`)
                            audio?.paused ? audio?.play() : audio?.pause()
                          }}
                          className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"
                        >
                          ▶️
                        </button>

                        {/* Waveform bars */}
                        <div className="flex items-center gap-0.5">
                          {[3, 5, 8, 5, 9, 4, 7, 5, 3, 6, 8, 4, 6].map((h, i) => (
                            <div
                              key={i}
                              className="w-1 rounded-full bg-white/70"
                              style={{ height: `${h * 2}px` }}
                            />
                          ))}
                        </div>

                        {/* Duration */}
                        <span className="text-white/70 text-xs flex-shrink-0">
                          {formatTime(msg.duration || 0)}
                        </span>
                      </div>
                    )}

                    {/* TEXT bubble */}
                    {msg.type === 'TEXT' && (
                      <div className={`px-4 py-3 rounded-2xl text-sm ${msg.sender === 'USER'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm'
                        }`}>
                        {msg.content}
                      </div>
                    )}

                  </div>

                  {msg.sender === 'USER' && (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm flex-shrink-0">
                      👤
                    </div>
                  )}
                </div>
              ))}

              {/* Loading dots */}
              {loading && (
                <div className="flex items-end gap-2 justify-start">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm">🤖</div>
                  <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl rounded-bl-sm border border-white/10">
                    <div className="flex gap-1 items-center">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Escalated Banner */}
            {escalated && (
              <div className="bg-orange-500/10 border-t border-orange-500/30 px-6 py-3 text-center">
                <p className="text-orange-400 text-sm">
                  ⚠️ Your issue has been escalated. A human agent will contact you shortly.
                </p>
              </div>
            )}

            {/* Recording UI — WhatsApp style */}
            {recording ? (
              <div className="px-4 py-4 bg-gray-900 border-t border-gray-800">
                <div className="flex items-center gap-3 bg-gray-800 rounded-2xl px-4 py-3">

                  {/* Cancel button */}
                  <button onClick={handleCancelRecording}
                    className="text-gray-400 hover:text-red-400 transition text-lg flex-shrink-0">
                    ✕
                  </button>

                  {/* Red dot + timer */}
                  <div className="flex items-center gap-2 flex-1">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse flex-shrink-0"></span>
                    <span className="text-white text-sm font-mono">{formatTime(recordingTime)}</span>

                    {/* Animated bars */}
                    <div className="flex items-center gap-0.5 ml-2">
                      {[4, 7, 5, 9, 6, 8, 4, 7, 5, 6].map((h, i) => (
                        <div
                          key={i}
                          className="w-1 bg-red-400 rounded-full animate-pulse"
                          style={{
                            height: `${h * 2}px`,
                            animationDelay: `${i * 100}ms`
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Stop/Send button */}
                  <button onClick={handleVoiceToggle}
                    className="w-10 h-10 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition flex-shrink-0">
                    <span className="text-white text-sm">⏹</span>
                  </button>

                </div>
                <p className="text-gray-600 text-xs text-center mt-2">
                  ✕ to cancel • ⏹ to send
                </p>
              </div>
            ) : (
              /* Normal Input */
              <div className="px-4 py-4 z-20">
                <div className="relative w-full">
                  <Input
                    className="pl-12 pr-20 h-12 rounded-xl text-black bg-white border border-gray-200 shadow-md focus-visible:ring-1 focus-visible:ring-gray-300"
                    placeholder="Ask something with AI"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && input.trim()) {
                        e.preventDefault();
                        handleSend(input);
                        setInput('');
                      }
                    }}
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-1.5 top-1.5 h-9 w-9 text-gray-400 hover:text-black hover:bg-black/5"
                    onClick={() => {
                      const fileInput = document.createElement('input');
                      fileInput.type = 'file';
                      fileInput.accept = 'image/*';
                      fileInput.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) handleImageUpload(file);
                      };
                      fileInput.click();
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">New Chat</span>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-10 top-1.5 h-9 w-9 text-gray-400 hover:text-black hover:bg-black/5"
                    onClick={handleVoiceToggle}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>

                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1.5 top-1.5 h-9 w-9 text-gray-400 hover:text-black hover:bg-black/5"
                    onClick={() => {
                      if (input.trim()) {
                        handleSend(input);
                        setInput('');
                      }
                    }}
                    disabled={!input.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Feedback Modal */}
            {showFeedback && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center w-80">
                  <h3 className="text-white font-semibold mb-2">Rate your experience</h3>
                  <p className="text-gray-400 text-sm mb-6">How was your support experience?</p>
                  <div className="flex justify-center gap-3 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => handleFeedback(star)}
                        className={`text-3xl transition hover:scale-110 ${rating >= star ? 'opacity-100' : 'opacity-40'}`}>
                        ⭐
                      </button>
                    ))}
                  </div>
                  {rating > 0 && <p className="text-green-400 text-sm">Thank you! ✅</p>}
                  <button onClick={() => setShowFeedback(false)}
                    className="mt-4 text-gray-400 hover:text-white text-sm">
                    Close
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}