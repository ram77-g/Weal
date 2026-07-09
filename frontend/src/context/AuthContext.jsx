import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { API_URL } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken') || '')
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true')

  const isAuthenticated = Boolean(token && user)
  const isAdmin = user?.role === 'ADMIN'

  // Sync token + user to localStorage
  useEffect(() => {
    if (token && user) {
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }, [token, user])

  // Sync refreshToken to localStorage
  useEffect(() => {
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    } else {
      localStorage.removeItem('refreshToken')
    }
  }, [refreshToken])

  // Dark mode class toggle
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  // Silent refresh every 13 minutes
  useEffect(() => {
    if (!refreshToken) return
    const refresh = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        })
        if (!res.ok) {
          setToken('')
          setRefreshToken('')
          setUser(null)
          return
        }
        const data = await res.json()
        setToken(data.token)
        setRefreshToken(data.refreshToken)
      } catch {
        // Silent failure — will retry on next interval
      }
    }
    
    // Immediately run refresh to ensure valid access token on load
    refresh()

    const interval = setInterval(refresh, 13 * 60 * 1000)
    return () => clearInterval(interval)
  }, [refreshToken])

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.error || 'Login failed')
    setToken(data.token)
    setRefreshToken(data.refreshToken || '')
    setUser(data.user)
    return data.user
  }, [])

  const sendOtp = useCallback(async (email) => {
    const res = await fetch(`${API_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to send OTP')
    return data
  }, [])

  const signup = useCallback(async (email, password, otp) => {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: email.split('@')[0], otp })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.error || 'Signup failed')
    setToken(data.token)
    setRefreshToken(data.refreshToken || '')
    setUser(data.user)
    return data.user
  }, [])

  const googleLogin = useCallback(async (tokenString) => {
    const res = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: tokenString })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.error || 'Google login failed')
    setToken(data.token)
    setRefreshToken(data.refreshToken || '')
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    if (refreshToken) {
      fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      }).catch(() => {})
    }
    setToken('')
    setRefreshToken('')
    setUser(null)
  }, [refreshToken])

  const updateProfile = useCallback(async (body) => {
    const res = await fetch(`${API_URL}/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to update profile')
    setUser(data.user)
    return data.user
  }, [token])

  return (
    <AuthContext.Provider value={{
      token, user, setUser,
      isAuthenticated, isAdmin,
      darkMode, setDarkMode,
      login, signup, sendOtp, googleLogin, logout, updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
