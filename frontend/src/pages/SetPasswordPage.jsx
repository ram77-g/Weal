import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../lib/api'
import logo from '../assets/weal-logo.jpeg'

export default function SetPasswordPage() {
  const { token, user, setUser, darkMode } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // If they somehow land here but aren't logged in, or already have a password
  if (!token || user?.hasPassword) {
    navigate('/dashboard', { replace: true })
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`${API_URL}/auth/set-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to set password')
      
      setUser(data.user)
      if (data.user.role === 'ADMIN') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${darkMode ? 'dark bg-slate-950' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-white'} min-h-screen flex items-center justify-center px-4 relative overflow-hidden`}>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-400 rounded-full opacity-10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400 rounded-full opacity-10 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-6">
          <img src={logo} alt="WEAL logo" className="h-12 w-12 mx-auto rounded-full object-cover ring-2 ring-indigo-300 mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Secure Your Account</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Since you signed in with Google, please set a password for your WEAL account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">New Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              minLength={6}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </div>
          
          {error && (
            <p className="text-xs px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Set Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
