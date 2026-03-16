import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:5000/api'
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth
export const register = (data) => API.post('/auth/register', data)
export const login = (data) => API.post('/auth/login', data)
export const logout = () => API.post('/auth/logout')
export const getMe = () => API.get('/auth/me')

// Chat
export const sendMessage = (data) => API.post('/chat/message', data)
export const getChatHistory = () => API.get('/chat/history')
export const sendFeedback = (data) => API.post('/chat/feedback', data)
export const uploadImage = (formData) => API.post('/chat/image', formData)
export const uploadVoice = (formData) => API.post('/chat/voice', formData)

// Orders
export const getOrders = () => API.get('/orders')
export const getOrder = (id) => API.get(`/orders/${id}`)
export const initiateReturn = (orderId, data) => API.post(`/orders/${orderId}/return`, data)

// Tickets
export const getMyTickets = () => API.get('/tickets/my')
export const getAllTickets = () => API.get('/tickets')
export const getEscalatedTickets = () => API.get('/tickets/filter/escalated')
export const updateTicketStatus = (id, data) => API.patch(`/tickets/${id}/status`, data)
export const assignTicket = (id) => API.patch(`/tickets/${id}/assign`)