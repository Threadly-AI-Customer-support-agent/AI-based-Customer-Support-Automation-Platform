import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { register, login } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { SignInCard } from '../components/ui/sign-in-card-2'

export default function Register() {
  const [error, setError] = useState('')
  const { loginUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async ({ email, password }) => {
    setError('')
    try {
      // Always register as CUSTOMER — agents are created by admins
      await register({ email, password, role: 'CUSTOMER' })
      const res = await login({ email, password })

      loginUser(res.data.token, res.data.user)
      navigate('/chat')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
      throw err
    }
  }

  return (
    <>
      <div className="absolute top-4 w-full flex justify-center z-50 pointer-events-none">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-6 py-3 rounded-2xl text-sm shadow-xl backdrop-blur-md animate-in slide-in-from-top-4 pointer-events-auto">
            {error}
          </div>
        )}
      </div>
      <SignInCard
        title="Join Us"
        subtitle="Create an account on Threadly"
        buttonText="Sign Up"
        bottomText="Already have an account?"
        bottomLink="/login"
        bottomLinkText="Sign in"
        showRoleToggle={false}
        onSubmit={handleSubmit}
      />
    </>
  )
}