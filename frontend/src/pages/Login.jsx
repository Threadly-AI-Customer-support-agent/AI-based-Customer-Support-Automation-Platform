import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { SignInCard } from '../components/ui/sign-in-card-2'

export default function Login() {
  const [error, setError] = useState('')
  const { loginUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async ({ email, password, role }) => {
    setError('')
    try {
      const res = await login({ email, password })
      const actualRole = res.data.user.role

      // Validate the selected role matches the account's actual role
      if (role === 'AGENT' && actualRole !== 'AGENT') {
        setError('This account is not registered as an Agent.')
        throw new Error('Role mismatch')
      }
      if (role === 'CUSTOMER' && actualRole !== 'CUSTOMER') {
        setError('This account is not registered as a User.')
        throw new Error('Role mismatch')
      }

      loginUser(res.data.token, res.data.user)

      if (actualRole === 'CUSTOMER') {
        navigate('/chat')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      if (!err.message?.includes('Role mismatch')) {
        setError(err.response?.data?.message || 'Login failed')
      }
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
        title="Welcome Back"
        subtitle="Sign in to continue to Threadly"
        buttonText="Sign In"
        bottomText="Don't have an account?"
        bottomLink="/register"
        bottomLinkText="Sign up"
        onSubmit={handleSubmit}
      />
    </>
  )
}