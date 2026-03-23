import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEscalatedTickets, getAllTickets, updateTicketStatus, assignTicket } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { logout } from '../services/api'
import { TextScramble } from '../components/ui/text-scramble'

export default function AgentDashboard() {
  const [tickets, setTickets] = useState([])
  const [escalatedTickets, setEscalatedTickets] = useState([])
  const [activeTab, setActiveTab] = useState('escalated')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  const { logoutUser } = useAuth()
  const navigate = useNavigate()

  const loadTickets = async () => {
    try {
      const [allRes, escalatedRes] = await Promise.all([
        getAllTickets(),
        getEscalatedTickets()
      ])
      setTickets(allRes.data.tickets)
      setEscalatedTickets(escalatedRes.data.tickets)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'text-red-400 bg-red-400/10 border-red-400/30'
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
      case 'LOW': return 'text-green-400 bg-green-400/10 border-green-400/30'
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ESCALATED': return 'text-red-400'
      case 'OPEN': return 'text-yellow-400'
      case 'CLOSED': return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  const handleAssign = async (ticketId) => {
    setActionLoading(ticketId)
    try {
      await assignTicket(ticketId)
      await loadTickets()
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleClose = async (ticketId) => {
    setActionLoading(ticketId)
    try {
      await updateTicketStatus(ticketId, { status: 'CLOSED', priority: 'LOW' })
      await loadTickets()
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleLogout = async () => {
    try { await logout() } catch (err) { console.error(err) }
    finally { logoutUser(); navigate('/login') }
  }

  const displayTickets = activeTab === 'escalated' ? escalatedTickets : tickets

  return (
    <div className="min-h-screen bg-transparent">

      {/* Header */}
      <div className="bg-white/5 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <TextScramble as="h1" className="text-white font-semibold">Threadly Dashboard</TextScramble>
          <p className="text-gray-400 text-xs">Manage customer support tickets</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-red-400 hover:text-red-300 text-xs border border-red-900 px-3 py-1.5 rounded-lg transition"
        >
          Logout
        </button>
      </div>

      {/* Stats */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-white">{tickets.length}</p>
            <p className="text-gray-400 text-xs mt-1">Total Tickets</p>
          </div>
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-red-400">{escalatedTickets.length}</p>
            <p className="text-gray-400 text-xs mt-1">Escalated</p>
          </div>
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-green-400">
              {tickets.filter(t => t.status === 'CLOSED').length}
            </p>
            <p className="text-gray-400 text-xs mt-1">Resolved</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('escalated')}
            className={`px-4 py-2 rounded-xl text-sm transition ${activeTab === 'escalated'
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'text-gray-400 border border-white/10 hover:text-white hover:bg-white/5'
              }`}
          >
            🔴 Escalated ({escalatedTickets.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-sm transition ${activeTab === 'all'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'text-gray-400 border border-white/10 hover:text-white hover:bg-white/5'
              }`}
          >
            📋 All Tickets ({tickets.length})
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <div className="text-4xl mb-4 animate-spin">⏳</div>
            <p className="text-gray-400">Loading tickets...</p>
          </div>
        )}

        {/* No Tickets */}
        {!loading && displayTickets.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-white text-lg font-semibold">
              {activeTab === 'escalated' ? 'No escalated tickets!' : 'No tickets yet'}
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              {activeTab === 'escalated' ? 'All clear for now' : 'Tickets will appear here'}
            </p>
          </div>
        )}

        {/* Tickets List */}
        {!loading && displayTickets.length > 0 && (
          <div className="space-y-4">
            {displayTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5"
              >
                {/* Ticket Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-white font-medium text-sm">
                      {ticket.user?.email || 'Unknown User'}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      ID: {ticket.id.slice(0, 8)}...
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full border font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                    <span className={`text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </div>
                </div>

                {/* Ticket Info */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-black/20 rounded-xl px-4 py-3">
                    <p className="text-gray-400 text-xs mb-1">Angry Count</p>
                    <p className="text-white text-sm font-medium">
                      {ticket.angryCount} / 3
                    </p>
                  </div>
                  <div className="bg-black/20 rounded-xl px-4 py-3">
                    <p className="text-gray-400 text-xs mb-1">Created</p>
                    <p className="text-white text-sm">
                      {new Date(ticket.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Assigned To */}
                {ticket.assignedTo && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2 mb-4">
                    <p className="text-blue-400 text-xs">
                      ✅ Assigned to agent
                    </p>
                  </div>
                )}

                {/* Actions */}
                {ticket.status !== 'CLOSED' && (
                  <div className="flex gap-2">
                    {!ticket.assignedTo && (
                      <button
                        onClick={() => handleAssign(ticket.id)}
                        disabled={actionLoading === ticket.id}
                        className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 text-blue-400 py-2 rounded-xl text-sm transition disabled:opacity-50"
                      >
                        {actionLoading === ticket.id ? '...' : '👤 Assign to Me'}
                      </button>
                    )}
                    <button
                      onClick={() => handleClose(ticket.id)}
                      disabled={actionLoading === ticket.id}
                      className="flex-1 bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 text-green-400 py-2 rounded-xl text-sm transition disabled:opacity-50"
                    >
                      {actionLoading === ticket.id ? '...' : '✅ Close Ticket'}
                    </button>
                  </div>
                )}

                {ticket.status === 'CLOSED' && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2">
                    <p className="text-green-400 text-xs text-center">✅ Resolved</p>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}