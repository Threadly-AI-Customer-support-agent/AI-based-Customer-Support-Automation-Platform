import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllTickets, getEscalatedTickets, updateTicketStatus, assignTicket, resolveTicket, logout } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { TextScramble } from '../components/ui/text-scramble'
import { AnimatePresence, motion } from 'framer-motion'
import { LogOut, X, AlertTriangle, CheckCircle, Clock, ChevronRight, Send, Shield, Ticket, Flame, TrendingUp } from 'lucide-react'

// ── Mock Data (used as fallback when backend is unavailable) ──────────
const MOCK_TICKETS = [
  {
    id: 'mock-001-a1b2c3d4',
    user: { id: 'u1', email: 'sarah.jones@example.com' },
    priority: 'HIGH',
    status: 'ESCALATED',
    category: 'Payment Failure',
    assignedTo: null,
    angryCount: 3,
    aiFailCount: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'mock-002-e5f6g7h8',
    user: { id: 'u2', email: 'james.wilson@example.com' },
    priority: 'HIGH',
    status: 'OPEN',
    category: 'Defective Product',
    assignedTo: null,
    angryCount: 2,
    aiFailCount: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'mock-003-i9j0k1l2',
    user: { id: 'u3', email: 'amy.chen@example.com' },
    priority: 'MEDIUM',
    status: 'ESCALATED',
    category: 'Shipping Delay',
    assignedTo: null,
    angryCount: 1,
    aiFailCount: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'mock-004-m3n4o5p6',
    user: { id: 'u4', email: 'raj.patel@example.com' },
    priority: 'LOW',
    status: 'OPEN',
    category: 'General Inquiry',
    assignedTo: null,
    angryCount: 0,
    aiFailCount: 0,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 'mock-005-q7r8s9t0',
    user: { id: 'u5', email: 'lisa.martinez@example.com' },
    priority: 'MEDIUM',
    status: 'OPEN',
    category: 'Return Request',
    assignedTo: 'agent-1',
    angryCount: 1,
    aiFailCount: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'mock-006-u1v2w3x4',
    user: { id: 'u6', email: 'tom.nguyen@example.com' },
    priority: 'HIGH',
    status: 'ESCALATED',
    category: 'Account Locked',
    assignedTo: null,
    angryCount: 3,
    aiFailCount: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'mock-007-y5z6a7b8',
    user: { id: 'u7', email: 'emma.brown@example.com' },
    priority: 'LOW',
    status: 'CLOSED',
    category: 'Password Reset',
    assignedTo: 'agent-1',
    angryCount: 0,
    aiFailCount: 0,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
]

// ── Utility Helpers ──────────────────────────────────────────────────
const getPriorityConfig = (priority) => {
  switch (priority) {
    case 'HIGH':
      return {
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        glow: 'shadow-red-500/20',
        icon: <Flame className="w-3 h-3" />,
        label: 'HIGH',
      }
    case 'MEDIUM':
      return {
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        glow: 'shadow-amber-500/20',
        icon: <TrendingUp className="w-3 h-3" />,
        label: 'MEDIUM',
      }
    case 'LOW':
      return {
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        glow: 'shadow-emerald-500/20',
        icon: <CheckCircle className="w-3 h-3" />,
        label: 'LOW',
      }
    default:
      return {
        color: 'text-gray-400',
        bg: 'bg-gray-500/10',
        border: 'border-gray-500/30',
        glow: '',
        icon: null,
        label: priority,
      }
  }
}

const getStatusConfig = (status) => {
  switch (status) {
    case 'ESCALATED':
      return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: '🔴 Escalated' }
    case 'OPEN':
      return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: '🟡 Open' }
    case 'CLOSED':
      return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: '✅ Resolved' }
    default:
      return { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', label: status }
  }
}

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ── Toast Notification ───────────────────────────────────────────────
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: -30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-xl shadow-2xl ${
        type === 'success'
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : 'bg-red-500/10 border-red-500/30 text-red-400'
      }`}
    >
      {type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      <span className="text-sm font-medium">{message}</span>
    </motion.div>
  )
}

// ── Main Component ───────────────────────────────────────────────────
export default function AgentDashboard() {
  const [tickets, setTickets] = useState([])
  const [escalatedTickets, setEscalatedTickets] = useState([])
  const [activeTab, setActiveTab] = useState('escalated')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [toast, setToast] = useState(null)
  const [usingMock, setUsingMock] = useState(false)

  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()

  // ── Data Fetching with Mock Fallback ─────────────────────────────
  const loadTickets = useCallback(async () => {
    try {
      const [allRes, escalatedRes] = await Promise.all([
        getAllTickets(),
        getEscalatedTickets(),
      ])
      setTickets(allRes.data.tickets)
      setEscalatedTickets(escalatedRes.data.tickets)
      setUsingMock(false)
    } catch (err) {
      console.warn('API unavailable, using mock data:', err.message)
      setTickets(MOCK_TICKETS)
      setEscalatedTickets(MOCK_TICKETS.filter((t) => t.status === 'ESCALATED'))
      setUsingMock(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  // ── Actions ──────────────────────────────────────────────────────
  const handleAssign = async (ticketId) => {
    setActionLoading(ticketId)
    try {
      if (usingMock) {
        // Simulate assignment in mock data
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, assignedTo: 'current-agent', status: 'OPEN' } : t))
        )
        setEscalatedTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, assignedTo: 'current-agent', status: 'OPEN' } : t))
        )
        setToast({ message: 'Ticket assigned to you', type: 'success' })
      } else {
        await assignTicket(ticketId)
        await loadTickets()
        setToast({ message: 'Ticket assigned successfully', type: 'success' })
      }
    } catch (err) {
      console.error(err)
      setToast({ message: 'Failed to assign ticket', type: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleResolve = async () => {
    if (!selectedTicket) return
    setActionLoading(selectedTicket.id)
    try {
      if (usingMock) {
        // Simulate resolution in mock data
        setTickets((prev) =>
          prev.map((t) => (t.id === selectedTicket.id ? { ...t, status: 'CLOSED', priority: 'LOW' } : t))
        )
        setEscalatedTickets((prev) => prev.filter((t) => t.id !== selectedTicket.id))
        setToast({ message: `Ticket resolved — notification sent to ${selectedTicket.user?.email}`, type: 'success' })
      } else {
        await resolveTicket(selectedTicket.id, { resolutionNotes })
        await loadTickets()
        setToast({ message: `Ticket resolved — notification sent to ${selectedTicket.user?.email}`, type: 'success' })
      }
      setSelectedTicket(null)
      setResolutionNotes('')
    } catch (err) {
      console.error(err)
      setToast({ message: 'Failed to resolve ticket', type: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error(err)
    } finally {
      logoutUser()
      navigate('/login')
    }
  }

  // ── Derived State ────────────────────────────────────────────────
  const displayTickets = activeTab === 'escalated' ? escalatedTickets : tickets
  const openCount = tickets.filter((t) => t.status === 'OPEN' || t.status === 'ESCALATED').length
  const resolvedCount = tickets.filter((t) => t.status === 'CLOSED').length
  const highCount = tickets.filter((t) => t.priority === 'HIGH' && t.status !== 'CLOSED').length

  return (
    <div className="min-h-screen bg-transparent">
      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="w-full flex justify-center border-b border-white/10 bg-black/40 backdrop-blur-xl z-20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between w-full max-w-7xl px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <TextScramble as="h1" className="text-white font-semibold text-sm">
                Threadly Dashboard
              </TextScramble>
              <p className="text-gray-500 text-xs">
                {user?.email || 'Agent Console'} {usingMock && <span className="text-amber-500 ml-1">• Demo Mode</span>}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 text-xs border border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 px-4 py-2 rounded-xl transition-all duration-300"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>

      {/* ─── Main Content ───────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Tickets', value: tickets.length, color: 'text-white', icon: <Ticket className="w-4 h-4 text-blue-400" /> },
            { label: 'Open', value: openCount, color: 'text-amber-400', icon: <Clock className="w-4 h-4 text-amber-400" /> },
            { label: 'Escalated', value: escalatedTickets.length, color: 'text-red-400', icon: <AlertTriangle className="w-4 h-4 text-red-400" /> },
            { label: 'Resolved', value: resolvedCount, color: 'text-emerald-400', icon: <CheckCircle className="w-4 h-4 text-emerald-400" /> },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 group hover:bg-white/20 hover:border-white/30 transition-all duration-500"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  {stat.icon}
                </div>
                {stat.label === 'Escalated' && escalatedTickets.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                )}
              </div>
              <p className={`text-3xl font-bold ${stat.color} tracking-tight`}>{stat.value}</p>
              <p className="text-gray-500 text-xs mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* High Priority Alert Banner */}
        <AnimatePresence>
          {highCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl px-5 py-3 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <Flame className="w-4 h-4 text-red-400" />
                <p className="text-red-400 text-sm">
                  <span className="font-semibold">{highCount} high priority</span> ticket{highCount !== 1 && 's'} require{highCount === 1 && 's'} immediate attention
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'escalated', label: 'Escalated', count: escalatedTickets.length, activeClass: 'bg-red-500/10 text-red-400 border-red-500/30', emoji: '🔴' },
            { key: 'all', label: 'All Tickets', count: tickets.length, activeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30', emoji: '📋' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 rounded-xl text-sm transition-all duration-300 border ${
                activeTab === tab.key
                  ? tab.activeClass
                  : 'text-gray-500 border-white/20 hover:text-gray-300 hover:bg-white/10 hover:border-white/30'
              }`}
            >
              {tab.emoji} {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <div className="w-12 h-12 border-2 border-white/10 border-t-blue-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Loading tickets...</p>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && displayTickets.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-white text-lg font-semibold">
              {activeTab === 'escalated' ? 'No escalated tickets' : 'No tickets yet'}
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              {activeTab === 'escalated' ? 'All clear — no issues need escalation' : 'Tickets will appear here when created'}
            </p>
          </motion.div>
        )}

        {/* Ticket List */}
        {!loading && displayTickets.length > 0 && (
          <motion.div layout className="space-y-3">
            {displayTickets.map((ticket, index) => {
              const priority = getPriorityConfig(ticket.priority)
              const status = getStatusConfig(ticket.status)
              const isHighPriority = ticket.priority === 'HIGH' && ticket.status !== 'CLOSED'

              return (
                <motion.div
                  key={ticket.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => {
                    if (ticket.status !== 'CLOSED') {
                      setSelectedTicket(ticket)
                      setResolutionNotes('')
                    }
                  }}
                  className={`group relative bg-white/10 backdrop-blur-xl border rounded-2xl p-5 transition-all duration-300 ${
                    isHighPriority
                      ? 'border-red-500/40 hover:border-red-500/60 hover:shadow-lg hover:shadow-red-500/10'
                      : 'border-white/20 hover:border-white/30 hover:shadow-lg hover:shadow-white/10'
                  } ${ticket.status !== 'CLOSED' ? 'cursor-pointer hover:bg-white/20' : ''}`}
                >
                  {/* High Priority Pulse Indicator */}
                  {isHighPriority && (
                    <div className="absolute top-4 right-4">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                      </span>
                    </div>
                  )}

                  {/* Top Row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">
                        {ticket.user?.email || 'Unknown User'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-gray-600 text-xs font-mono">
                          #{ticket.id.slice(0, 8)}
                        </span>
                        {ticket.category && (
                          <>
                            <span className="text-gray-700">·</span>
                            <span className="text-gray-500 text-xs">{ticket.category}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {/* Priority Badge */}
                      <span
                        className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-medium ${priority.color} ${priority.bg} ${priority.border} shadow-sm ${priority.glow}`}
                      >
                        {priority.icon}
                        {priority.label}
                      </span>
                      {/* Status Badge */}
                      <span className={`text-xs px-3 py-1 rounded-full border ${status.color} ${status.bg} ${status.border}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Info Row */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 bg-black/40 rounded-xl px-4 py-2.5">
                      <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-0.5">Frustration</p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-white text-sm font-medium">{ticket.angryCount}/3</p>
                        <div className="flex gap-0.5 ml-1">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full ${
                                i <= ticket.angryCount ? 'bg-red-400' : 'bg-gray-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 bg-black/40 rounded-xl px-4 py-2.5">
                      <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-0.5">AI Failures</p>
                      <p className="text-white text-sm font-medium">{ticket.aiFailCount}</p>
                    </div>
                    <div className="flex-1 bg-black/40 rounded-xl px-4 py-2.5">
                      <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-0.5">Created</p>
                      <p className="text-white text-sm font-medium">{timeAgo(ticket.createdAt)}</p>
                    </div>
                  </div>

                  {/* Assignment Indicator */}
                  {ticket.assignedTo && ticket.status !== 'CLOSED' && (
                    <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-2 mb-3">
                      <p className="text-blue-400 text-xs flex items-center gap-1.5">
                        <Shield className="w-3 h-3" /> Assigned to agent
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {ticket.status !== 'CLOSED' && (
                    <div className="flex items-center gap-2">
                      {!ticket.assignedTo && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAssign(ticket.id)
                          }}
                          disabled={actionLoading === ticket.id}
                          className="flex-1 flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/30 text-blue-400 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 disabled:opacity-50"
                        >
                          {actionLoading === ticket.id ? (
                            <div className="w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                          ) : (
                            <Shield className="w-3.5 h-3.5" />
                          )}
                          Assign to Me
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedTicket(ticket)
                          setResolutionNotes('')
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-gray-400 hover:text-white py-2.5 rounded-xl text-xs font-medium transition-all duration-300"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                        Resolve Ticket
                      </button>
                    </div>
                  )}

                  {/* Closed */}
                  {ticket.status === 'CLOSED' && (
                    <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-4 py-2.5">
                      <p className="text-emerald-400 text-xs text-center flex items-center justify-center gap-1.5">
                        <CheckCircle className="w-3 h-3" /> Resolved
                      </p>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>

      {/* ─── Resolve Ticket Slide-Over Panel ────────────────────── */}
      <AnimatePresence>
        {selectedTicket && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicket(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-gray-950/95 backdrop-blur-xl border-l border-white/[0.06] z-50 flex flex-col shadow-2xl shadow-black/50"
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                <div>
                  <h2 className="text-white font-semibold text-sm">Resolve Ticket</h2>
                  <p className="text-gray-600 text-xs mt-0.5">#{selectedTicket.id.slice(0, 8)}</p>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Panel Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                {/* Customer Info */}
                <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-2">Customer</p>
                  <p className="text-white text-sm font-medium">{selectedTicket.user?.email || 'Unknown'}</p>
                </div>

                {/* Ticket Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-2">Priority</p>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border ${
                        getPriorityConfig(selectedTicket.priority).color
                      } ${getPriorityConfig(selectedTicket.priority).bg} ${
                        getPriorityConfig(selectedTicket.priority).border
                      }`}
                    >
                      {getPriorityConfig(selectedTicket.priority).icon}
                      {selectedTicket.priority}
                    </span>
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-2">Status</p>
                    <span
                      className={`text-xs font-medium ${getStatusConfig(selectedTicket.status).color}`}
                    >
                      {getStatusConfig(selectedTicket.status).label}
                    </span>
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-2">Category</p>
                    <p className="text-white text-sm">{selectedTicket.category || 'Uncategorized'}</p>
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-2">Created</p>
                    <p className="text-white text-sm">{timeAgo(selectedTicket.createdAt)}</p>
                  </div>
                </div>

                {/* Frustration Meter */}
                <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-3">Customer Frustration</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(selectedTicket.angryCount / 3) * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          selectedTicket.angryCount >= 3
                            ? 'bg-red-500'
                            : selectedTicket.angryCount >= 2
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                    <span className="text-gray-400 text-xs font-mono">{selectedTicket.angryCount}/3</span>
                  </div>
                </div>

                {/* Resolution Notes */}
                <div>
                  <label className="text-gray-500 text-[10px] uppercase tracking-wider block mb-2">
                    Resolution Notes
                  </label>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Describe how this issue was resolved..."
                    rows={5}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 focus:bg-white/20 transition-all duration-300 resize-none"
                  />
                </div>
              </div>

              {/* Panel Footer — Mark as Resolved */}
              <div className="px-6 py-5 border-t border-white/[0.06]">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleResolve}
                  disabled={actionLoading === selectedTicket.id}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 py-3 rounded-xl text-sm font-medium transition-all duration-300 disabled:opacity-50 shadow-lg shadow-emerald-500/5"
                >
                  {actionLoading === selectedTicket.id ? (
                    <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Mark as Resolved
                    </>
                  )}
                </motion.button>
                <p className="text-gray-600 text-[10px] text-center mt-2">
                  This will close the ticket and notify the customer
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}