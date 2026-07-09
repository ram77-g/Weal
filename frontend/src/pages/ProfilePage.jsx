import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../lib/api'

export default function ProfilePage() {
  const { user, updateProfile, darkMode, setDarkMode, logout, token } = useAuth()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phoneNumber: user?.phoneNumber || '',
    dateOfBirth: user?.dateOfBirth || '',
    profilePicture: user?.profilePicture || ''
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  
  const fileInputRef = useRef(null)

  const handleLogout = () => {
    logout()
    navigate('/auth')
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    setError('')
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('image', file)
      
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formDataUpload
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to upload image')
      
      setFormData(prev => ({ ...prev, profilePicture: data.url }))
      await updateProfile({ ...formData, profilePicture: data.url })
      setMessage('Profile picture updated!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePicture = () => {
    setFormData(prev => ({ ...prev, profilePicture: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')
    try {
      await updateProfile(formData)
      setMessage('Profile updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} flex flex-col md:flex-row`}>
      {/* ── Sticky Left Sidebar Navigation (Desktop) ───────────────────── */}
      <aside className="group hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800 w-20 hover:w-64 transition-[width] duration-300 ease-in-out overflow-hidden fixed h-screen bg-white dark:bg-slate-900 py-6 px-4 hover:px-6 z-40 justify-between">
        <div className="space-y-8">
          <div className="flex items-center gap-3 px-2 cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-2xl font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent tracking-tight select-none flex">
              W<span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">EAL</span>
            </span>
          </div>

          <nav className="flex flex-col gap-1.5">
            <button onClick={() => navigate('/')} className="flex items-center gap-4 px-2 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold text-sm text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Home</span>
            </button>
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-4 px-2 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold text-sm text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12.75 19.5v-.75a7.5 7.5 0 00-7.5-7.5H4.5m0-3V4.5m0 0a3 3 0 013-3h1.5m-4.5 3.5v1.5a3 3 0 003 3h1.5m1.5-3v-1.5a3 3 0 013-3H15m-3 3.5v1.5a3 3 0 003 3h1.5m-7.5 6v1.5a3 3 0 003 3H12m0-3.5v-1.5a3 3 0 013-3h1.5m-3 7.5V21m-6-1.5h1.5M12 13.5v-1.5a1.5 1.5 0 011.5-1.5h3m-9 0h3a1.5 1.5 0 011.5 1.5v3" /></svg>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Feed</span>
            </button>
            <button className={`flex items-center gap-4 px-2 py-3 rounded-xl transition-all font-bold text-sm bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Profile</span>
            </button>
            {user?.role === 'ADMIN' && (
              <button onClick={() => navigate('/admin')} className="flex items-center gap-4 px-2 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold text-sm text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Admin Panel</span>
              </button>
            )}
            <button onClick={() => setDarkMode(!darkMode)} className="flex items-center gap-4 px-2 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold text-sm text-slate-700 dark:text-slate-300">
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
              )}
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </nav>
        </div>
        <div className="border-t border-slate-150 dark:border-slate-800 pt-4 flex flex-col gap-3">
          <div className="flex items-center gap-3 pl-1">
            <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow">
              {(user?.name || 'U').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="text-sm font-extrabold truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98]">
            <span className="shrink-0 text-base">🚪</span>
            <span className="opacity-0 hidden group-hover:block group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ───────────────────────────────── */}
      <div className="flex-1 md:pl-20 pb-20 md:pb-0 transition-all duration-300 ease-in-out">
        <main className="mx-auto max-w-3xl px-4 py-8">
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Your Profile</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Manage your personal information and preferences.</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {message && <div className="p-3 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-xl text-sm font-medium">{message}</div>}
              {error && <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 rounded-xl text-sm font-medium">{error}</div>}

              {/* Profile Picture Section */}
              <div className="flex items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="relative group/pic">
                  {formData.profilePicture ? (
                    <img src={formData.profilePicture.startsWith('http') ? formData.profilePicture : `${API_URL}${formData.profilePicture}`} alt="Profile" className="h-24 w-24 rounded-full object-cover border-4 border-slate-50 dark:border-slate-800 shadow-md" />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-3xl shadow-md border-4 border-slate-50 dark:border-slate-800">
                      {(user?.name || 'U').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">Profile Picture</h3>
                  <div className="flex flex-wrap gap-3">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileChange}
                    />
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
                    >
                      {uploading ? 'Uploading...' : 'Change Picture'}
                    </button>
                    {formData.profilePicture && (
                      <button 
                        type="button" 
                        onClick={handleDeletePicture}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 dark:hover:border-rose-900/50 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Recommended: Square JPG, PNG. Max 10MB.</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid md:grid-cols-2 gap-6">
                
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 pl-1">Email Address <span className="text-slate-400 font-normal">(Fixed)</span></label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 cursor-not-allowed outline-none text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 pl-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 pl-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 pl-1">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-sm shadow-indigo-200 dark:shadow-indigo-900/20 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
