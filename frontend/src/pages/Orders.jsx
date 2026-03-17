import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOrders, initiateReturn } from '../services/api'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [returningId, setReturningId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await getOrders()
        setOrders(res.data.orders)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadOrders()
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'DELIVERED': return 'text-green-400 bg-green-400/10 border-green-400/30'
      case 'SHIPPED': return 'text-blue-400 bg-blue-400/10 border-blue-400/30'
      case 'PROCESSING': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
      case 'CANCELLED': return 'text-red-400 bg-red-400/10 border-red-400/30'
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DELIVERED': return '✅'
      case 'SHIPPED': return '🚚'
      case 'PROCESSING': return '⏳'
      case 'CANCELLED': return '❌'
      default: return '📦'
    }
  }

  const handleReturn = async (orderId) => {
    setReturningId(orderId)
    try {
      await initiateReturn(orderId, {
        defectLabel: 'manual',
        confidence: 0,
      })
      const res = await getOrders()
      setOrders(res.data.orders)
      alert('Return initiated successfully ✅')
    } catch (err) {
      alert(err.response?.data?.message || 'Return failed')
    } finally {
      setReturningId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/chat')}
          className="text-gray-400 hover:text-white transition"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-white font-semibold">My Orders</h1>
          <p className="text-gray-400 text-xs">Track your orders and returns</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <div className="text-4xl mb-4 animate-spin">⏳</div>
            <p className="text-gray-400">Loading orders...</p>
          </div>
        )}

        {/* No Orders */}
        {!loading && orders.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📦</div>
            <h2 className="text-white text-lg font-semibold">No orders yet</h2>
            <p className="text-gray-400 text-sm mt-2">Your orders will appear here</p>
            <button
              onClick={() => navigate('/chat')}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm transition"
            >
              Go to Chat
            </button>
          </div>
        )}

        {/* Orders List */}
        {!loading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-5"
              >
                {/* Order Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-medium">{order.productName}</h3>
                    <p className="text-gray-500 text-xs mt-1">
                      Order ID: {order.id.slice(0, 8)}...
                    </p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full border font-medium ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)} {order.status}
                  </span>
                </div>

                {/* Tracking */}
                {order.trackingNo && (
                  <div className="bg-gray-800 rounded-xl px-4 py-3 mb-4">
                    <p className="text-gray-400 text-xs mb-1">Tracking Number</p>
                    <p className="text-white text-sm font-mono">{order.trackingNo}</p>
                  </div>
                )}

                {/* Date */}
                <p className="text-gray-500 text-xs mb-4">
                  Ordered on: {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>

                {/* Return Section */}
                {order.returns && order.returns.length > 0 ? (
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3">
                    <p className="text-orange-400 text-sm font-medium">
                      Return Status: {order.returns[0].status}
                    </p>
                    {order.returns[0].defectLabel && (
                      <p className="text-gray-400 text-xs mt-1">
                        Defect: {order.returns[0].defectLabel}
                      </p>
                    )}
                  </div>
                ) : (
                  order.status !== 'CANCELLED' && (
                    <button
                      onClick={() => handleReturn(order.id)}
                      disabled={returningId === order.id}
                      className="w-full border border-red-900 text-red-400 hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed py-2 rounded-xl text-sm transition"
                    >
                      {returningId === order.id ? 'Processing...' : '↩ Initiate Return'}
                    </button>
                  )
                )}

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}