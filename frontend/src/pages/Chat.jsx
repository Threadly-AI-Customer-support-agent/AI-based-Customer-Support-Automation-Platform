import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { sendMessage, getChatHistory, uploadImage, uploadVoice, logout, sendFeedback } from '../services/api'

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
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

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMessage = input.trim()
    setInput('')

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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

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
    <div className="flex flex-col h-screen bg-gray-950">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h1 className="text-white font-semibold text-sm">AI Support</h1>
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">

        {messages.length === 0 && (
          <div className="text-center mt-20">
            <div className="text-5xl mb-4">👋</div>
            <h2 className="text-white text-xl font-semibold">How can I help you?</h2>
            <p className="text-gray-400 text-sm mt-2">Ask about orders, returns, or products.</p>
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

            <div className={`max-w-xs lg:max-w-md ${
              msg.sender === 'USER' ? 'items-end' : 'items-start'
            } flex flex-col`}>

              {/* IMAGE bubble */}
              {msg.type === 'IMAGE' && (
                <div className={`rounded-2xl overflow-hidden ${
                  msg.sender === 'USER' ? 'rounded-br-sm' : 'rounded-bl-sm'
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
                <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${
                  msg.sender === 'USER'
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
                <div className={`px-4 py-3 rounded-2xl text-sm ${
                  msg.sender === 'USER'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-800 text-gray-100 rounded-bl-sm'
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
            <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-sm">
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
        <div className="px-4 py-4 bg-gray-900 border-t border-gray-800">
          <div className="flex items-center gap-2 bg-gray-800 rounded-2xl px-4 py-2">

            {/* Image Upload */}
            <label className="cursor-pointer text-gray-400 hover:text-white transition flex-shrink-0 text-xl">
              📷
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>

            {/* Text Input */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={escalated ? 'Agent will respond soon...' : 'Type a message...'}
              disabled={loading || escalated}
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500 disabled:cursor-not-allowed"
            />

            {/* Voice Button */}
            <button
              onClick={handleVoiceToggle}
              disabled={loading || escalated}
              className="flex-shrink-0 text-gray-400 hover:text-white transition text-xl disabled:cursor-not-allowed"
            >
              🎤
            </button>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading || escalated}
              className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-xl text-sm transition"
            >
              Send
            </button>

          </div>
          <p className="text-gray-600 text-xs text-center mt-2">
            🎤 to record • 📷 to upload image
          </p>
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
  )
}