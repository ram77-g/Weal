import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import { useStatus } from '../hooks/useStatus'
import logo from '../assets/weal-logo.jpeg'

export default function AuthPage() {
  const { login, signup, sendOtp, googleLogin, darkMode } = useAuth()
  const navigate = useNavigate()
  const { status, setStatus } = useStatus()
  const [authMode, setAuthMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true)
      const user = await googleLogin(credentialResponse.credential)
      if (user?.role === 'ADMIN') {
        navigate('/admin')
      } else if (!user.hasPassword) {
        navigate('/set-password')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setStatus({ message: err.message || 'Google Auth failed', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setStatus({ message: '', type: '' })
      
      if (authMode === 'login') {
        const user = await login(email, password)
        setEmail('')
        setPassword('')
        if (user?.role === 'ADMIN') {
          navigate('/admin')
        } else if (!user.hasPassword) {
          navigate('/set-password')
        } else {
          navigate('/dashboard')
        }
      } else {
        if (!otpSent) {
          await sendOtp(email)
          setOtpSent(true)
          setStatus({ message: 'OTP sent to your email! (Check terminal)', type: 'success' })
          return
        } else {
          const user = await signup(email, password, otp)
          setEmail('')
          setPassword('')
          setOtp('')
          setOtpSent(false)
          if (user?.role === 'ADMIN') {
            navigate('/admin')
          } else {
            navigate('/dashboard')
          }
        }
      }
    } catch (err) {
      setStatus({ message: err.message || 'Auth failed', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${darkMode ? 'dark bg-slate-950' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-white'} min-h-screen flex items-center justify-center px-4 relative overflow-hidden`}>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-400 rounded-full opacity-10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400 rounded-full opacity-10 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src={logo} alt="WEAL logo" className="h-16 w-16 rounded-full object-cover ring-4 ring-indigo-300" />
          </div>
          <h1 className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-300 tracking-tight">WEAL</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Your safe space for mental wellness</p>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-xl">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-700 p-1 mb-6">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${authMode === 'login' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 dark:text-slate-300 hover:text-indigo-600'}`}
            >
              Login
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${authMode === 'signup' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 dark:text-slate-300 hover:text-indigo-600'}`}
            >
              Sign up
            </button>
          </div>

          <div className="mb-5 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setStatus({ message: 'Google login failed', type: 'error' })}
              useOneTap
              theme={darkMode ? 'filled_black' : 'outline'}
              width="100%"
            />
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white dark:bg-slate-800 px-2 text-slate-400">Or continue with email</span></div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">Password</label>
                {authMode === 'login' && (
                  <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>
            {authMode === 'signup' && otpSent && (
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
            )}
            {status.message && status.type === 'error' && (
              <p className="text-xs px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800">{status.message}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md disabled:opacity-60"
            >
              {loading ? 'Please wait...' : authMode === 'login' ? 'Login to WEAL' : (otpSent ? 'Verify & Create Account' : 'Send Verification Code')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => navigate('/')} className="text-xs text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors">
              ← Back to home
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">© 2026 WEAL · Safe space for mental health support</p>
      </div>
    </div>
  )
}
