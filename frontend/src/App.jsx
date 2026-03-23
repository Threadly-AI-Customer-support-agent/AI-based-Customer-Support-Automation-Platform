import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Chat from './pages/Chat'
import Orders from './pages/Orders'
import AgentDashboard from './pages/AgentDashboard'
import Landing from './pages/Landing'
import { Component as EtheralShadow } from './components/ui/etheral-shadow'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      Loading...
    </div>
  )
  return user ? children : <Navigate to="/login" />
}

const AgentRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      Loading...
    </div>
  )
  if (!user) return <Navigate to="/login" />
  if (user.role === 'CUSTOMER') return <Navigate to="/chat" />
  return children
}

function App() {
  return (
    <AuthProvider>
      <EtheralShadow
        color="rgba(255, 255, 255, 1)"
        animation={{ scale: 100, speed: 90 }}
        noise={{ opacity: 1, scale: 1.2 }}
        className="fixed inset-0 z-0 pointer-events-none"
        sizing="fill"
      />
      <div className="relative z-10 w-full h-full min-h-screen">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/chat" element={
              <ProtectedRoute><Chat /></ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute><Orders /></ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <AgentRoute><AgentDashboard /></AgentRoute>
            } />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  )
}

export default App