import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/weal-logo.jpeg'

export default function ForgotPasswordPage() {
  const { darkMode } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Email, 2: OTP & New Password
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })

  const handleSendOtp = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setStatus({ type: '', message: '' })
      const res = await fetch(`${API_URL}/auth/forgot-password-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send reset code')
      
      setStep(2)
      setStatus({ type: 'success', message: 'Reset code sent to your email!' })
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match' })
      return
    }
    try {
      setLoading(true)
      setStatus({ type: '', message: '' })
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to reset password')
      
      setStatus({ type: 'success', message: 'Password reset successfully! Redirecting...' })
      setTimeout(() => navigate('/auth'), 2000)
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
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
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Reset Password</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {step === 1 ? 'Enter your email to receive a password reset code.' : 'Enter the code from your email and your new password.'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Email Address</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>

            {status.message && (
              <p className={`text-xs px-3 py-2 rounded-lg border ${status.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 border-green-200 dark:border-green-800'}`}>
                {status.message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">OTP Code</label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                type="text"
                placeholder="123456"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">New Password</label>
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Confirm Password</label>
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>

            {status.message && (
              <p className={`text-xs px-3 py-2 rounded-lg border ${status.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 border-green-200 dark:border-green-800'}`}>
                {status.message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md disabled:opacity-60"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button onClick={() => navigate('/auth')} className="text-xs text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors">
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}
