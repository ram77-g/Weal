import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStatus } from '../hooks/useStatus'
import { API_URL } from '../lib/api'
import EditPostModal from '../components/EditPostModal'
import EditCommentModal from '../components/EditCommentModal'

export default function AdminPage() {
  const { token, user, isAuthenticated, isAdmin, darkMode, logout, setDarkMode } = useAuth()
  const navigate = useNavigate()
  const { status, setStatus } = useStatus()

  const [adminData, setAdminData] = useState({ posts: [], comments: [], users: [] })
  const [adminTab, setAdminTab] = useState('posts')
  const [analytics, setAnalytics] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Modals state
  const [editingPost, setEditingPost] = useState(null)
  const [editingComment, setEditingComment] = useState(null)

  // Session Audit Log State
  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('weal_admin_audit')
      const parsed = saved ? JSON.parse(saved) : null
      if (Array.isArray(parsed)) return parsed
    } catch (e) {
      console.error('Failed to parse audit logs:', e)
    }
    return [
      { id: '1', time: new Date().toLocaleTimeString(), action: 'Admin dashboard initialized.' }
    ]
  })


  const handleLogout = () => {
    logout()
    navigate('/auth')
  }

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) navigate('/auth')
  }, [isAuthenticated, isAdmin, navigate])

  const addAuditLog = (action) => {
    const newLog = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString(),
      action
    }
    setAuditLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 30) // limit to last 30 log records
      localStorage.setItem('weal_admin_audit', JSON.stringify(updated))
      return updated
    })
  }

  const fetchAdminData = useCallback(async () => {
    setRefreshing(true)
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const [postsRes, commentsRes, usersRes, analyticsRes] = await Promise.all([
        fetch(`${API_URL}/admin/posts`, { headers }),
        fetch(`${API_URL}/admin/comments`, { headers }),
        fetch(`${API_URL}/admin/users`, { headers }),
        fetch(`${API_URL}/admin/analytics`, { headers })
      ])

      // Check for auth failures
      if (postsRes.status === 401 || postsRes.status === 403) {
        setStatus({ message: 'Admin access denied. Please re-login.', type: 'error' })
        return
      }

      const [postsData, commentsData, usersData, analyticsData] = await Promise.all([
        postsRes.ok ? postsRes.json() : { posts: [] },
        commentsRes.ok ? commentsRes.json() : { comments: [] },
        usersRes.ok ? usersRes.json() : { users: [] },
        analyticsRes.ok ? analyticsRes.json() : null
      ])
      setAdminData({
        posts: postsData.posts || [],
        comments: commentsData.comments || [],
        users: usersData.users || []
      })
      setAnalytics(analyticsData)
    } catch {
      setStatus({ message: 'Failed to load admin records', type: 'error' })
    } finally {
      setRefreshing(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    if (token && isAdmin) fetchAdminData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin])

  // ─── Admin actions ──────────────────────────────────────────

  const handleDeletePost = async (postId, postTitle) => {
    if (!window.confirm(`Delete post "${postTitle}" and all of its comments?`)) return
    try {
      const res = await fetch(`${API_URL}/admin/posts/${postId}`, { 
        method: 'DELETE', 
        headers: { Authorization: `Bearer ${token}` } 
      })
      if (!res.ok) throw new Error('Delete failed')
      
      addAuditLog(`Deleted post: "${postTitle}" (ID: ${postId})`)
      fetchAdminData()
      setStatus({ message: 'Post deleted successfully', type: 'success' })
    } catch (err) {
      setStatus({ message: err.message || 'Failed to delete post', type: 'error' })
    }
  }

  const handleEditPostSave = async ({ id, title, content }) => {
    try {
      const res = await fetch(`${API_URL}/admin/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, content })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || 'Update failed')
      
      addAuditLog(`Updated post: "${title}" (ID: ${id})`)
      setEditingPost(null)
      fetchAdminData()
      setStatus({ message: 'Post updated successfully', type: 'success' })
    } catch (err) {
      setStatus({ message: err.message || 'Failed to update post', type: 'error' })
    }
  }

  const handleDeleteComment = async (commentId, commentSnippet) => {
    if (!window.confirm(`Delete comment "${commentSnippet}"?`)) return
    try {
      const res = await fetch(`${API_URL}/admin/comments/${commentId}`, { 
        method: 'DELETE', 
        headers: { Authorization: `Bearer ${token}` } 
      })
      if (!res.ok) throw new Error('Delete failed')
      
      addAuditLog(`Deleted comment: "${commentSnippet}" (ID: ${commentId})`)
      fetchAdminData()
      setStatus({ message: 'Comment deleted successfully', type: 'success' })
    } catch (err) {
      setStatus({ message: err.message || 'Failed to delete comment', type: 'error' })
    }
  }

  const handleEditCommentSave = async ({ id, content }) => {
    try {
      const res = await fetch(`${API_URL}/admin/comments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || 'Update failed')
      
      addAuditLog(`Updated comment: "${content.slice(0, 20)}..." (ID: ${id})`)
      setEditingComment(null)
      fetchAdminData()
      setStatus({ message: 'Comment updated successfully', type: 'success' })
    } catch (err) {
      setStatus({ message: err.message || 'Failed to update comment', type: 'error' })
    }
  }

  const handleDeleteUser = async (userId, userEmail) => {
    if (userId === user.id) {
      setStatus({ message: 'Cannot delete your own account', type: 'error' })
      return
    }
    if (!window.confirm(`Permanently delete user ${userEmail}? This cleans up all associated posts and comments.`)) return
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}`, { 
        method: 'DELETE', 
        headers: { Authorization: `Bearer ${token}` } 
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      
      addAuditLog(`Deleted user account: ${userEmail}`)
      fetchAdminData()
      setStatus({ message: 'User account deleted', type: 'success' })
    } catch (err) {
      setStatus({ message: err.message || 'Failed to delete user', type: 'error' })
    }
  }

  const handleToggleRole = async (userId, userEmail, currentRole) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN'
    const action = newRole === 'ADMIN' ? 'promote to Admin' : 'demote to User'
    if (!window.confirm(`Are you sure you want to ${action} ${userEmail}?`)) return
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      
      addAuditLog(`Updated role of ${userEmail} to ${newRole}`)
      fetchAdminData()
      setStatus({ message: `User ${action}d successfully`, type: 'success' })
    } catch (err) {
      setStatus({ message: err.message || 'Failed to update role', type: 'error' })
    }
  }

  const clearAuditLogs = () => {
    if (!window.confirm('Clear all session logs?')) return
    const initialLog = [{ id: '1', time: new Date().toLocaleTimeString(), action: 'Admin logs cleared.' }]
    setAuditLogs(initialLog)
    localStorage.setItem('weal_admin_audit', JSON.stringify(initialLog))
  }

  // ─── Filters & Search ──────────────────────────────────────────

  const filteredPosts = adminData.posts.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.author?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.author?.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredComments = adminData.comments.filter(c =>
    c.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.author?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.author?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.post?.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredUsers = adminData.users.filter(u =>
    (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col md:flex-row`}>
      
      {/* ── Sticky Left Sidebar Navigation (Desktop) ───────────────────── */}
      <aside className="group hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800 w-24 hover:w-64 transition-[width] duration-300 ease-in-out overflow-hidden fixed h-screen bg-white dark:bg-slate-900 py-6 px-4 hover:px-6 z-40 justify-between">
        <div className="space-y-8">
          {/* Logo / Branding */}
          <div className="flex items-center gap-3 px-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <span className="text-xl group-hover:text-2xl font-black bg-gradient-to-r from-red-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent tracking-tight select-none transition-all duration-300 flex items-center">
              WEAL
              <span className="w-0 opacity-0 group-hover:w-auto group-hover:opacity-100 transition-all duration-300 overflow-hidden whitespace-nowrap ml-1">ADMIN</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5 select-none">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-4 px-2 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold text-sm text-slate-700 dark:text-slate-300 hover:text-indigo-650"
            >
              <span className="text-xl shrink-0">🧭</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Back to Feed</span>
            </button>
            <button
              onClick={() => { setAdminTab('posts'); setSearchQuery('') }}
              className={`flex items-center gap-4 px-2 py-3 rounded-xl transition-all font-bold text-sm ${adminTab === 'posts' ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-red-500'}`}
            >
              <span className="text-xl shrink-0">📝</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Posts Moderation</span>
            </button>
            <button
              onClick={() => { setAdminTab('comments'); setSearchQuery('') }}
              className={`flex items-center gap-4 px-2 py-3 rounded-xl transition-all font-bold text-sm ${adminTab === 'comments' ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-red-500'}`}
            >
              <span className="text-xl shrink-0">💬</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Comments Moderation</span>
            </button>
            <button
              onClick={() => { setAdminTab('users'); setSearchQuery('') }}
              className={`flex items-center gap-4 px-2 py-3 rounded-xl transition-all font-bold text-sm ${adminTab === 'users' ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-red-500'}`}
            >
              <span className="text-xl shrink-0">👥</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">User Accounts</span>
            </button>
            <button
              onClick={() => { setAdminTab('analytics'); setSearchQuery('') }}
              className={`flex items-center gap-4 px-2 py-3 rounded-xl transition-all font-bold text-sm ${adminTab === 'analytics' ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-red-500'}`}
            >
              <span className="text-xl shrink-0">📊</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Analytics Overview</span>
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center gap-4 px-2 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold text-sm text-slate-700 dark:text-slate-300"
            >
              <span className="text-xl shrink-0">{darkMode ? '☀️' : '🌙'}</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
            </button>
          </nav>
        </div>

        {/* Master User Footer link */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-col gap-3">
          <div className="flex items-center gap-3 pl-1 select-none overflow-hidden">
            <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-tr from-red-500 to-indigo-650 text-white font-bold flex items-center justify-center text-sm shadow">
              {(user?.name || 'A').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              <p className="text-sm font-extrabold truncate">{user?.name || 'Admin'}</p>
              <span className="text-[9px] bg-red-150 text-red-600 dark:bg-red-950/40 dark:text-red-450 px-1.5 py-0.5 rounded font-black uppercase">Master Admin</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 overflow-hidden"
          >
            <span className="text-lg shrink-0">🚪</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Exit Panel</span>
          </button>
        </div>
      </aside>

      {/* ── Main Scrollable Moderation Dashboard ─────────────────────── */}
      <div className="flex-1 md:pl-64 pb-20 md:pb-0">
        <main className="mx-auto max-w-6xl px-4 py-6 grid gap-6 lg:grid-cols-[1.5fr_1.1fr]">
          
          {/* Main Moderation Stream */}
          <section className="space-y-6 w-full">
            
            {/* Page Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 select-none">
              <div>
                <h1 className="text-2xl font-black tracking-tight leading-none">Security & Moderation</h1>
                <p className="text-xs text-slate-450 mt-1.5">Direct system database authority override</p>
              </div>
              <button 
                onClick={fetchAdminData} 
                disabled={refreshing} 
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-750 flex items-center gap-1 active:scale-95 disabled:opacity-55"
              >
                {refreshing ? '🔄 Loading' : '🔄 Refresh'}
              </button>
            </div>

            {/* Moderation Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 select-none">
              {[
                { title: 'Total Posts', val: adminData.posts.length, color: 'from-red-500 to-pink-500' },
                { title: 'Total Comments', val: adminData.comments.length, color: 'from-orange-500 to-rose-500' },
                { title: 'Active Users', val: adminData.users.length, color: 'from-purple-500 to-indigo-500' }
              ].map((card, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between h-24">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{card.title}</span>
                  <p className="text-2xl font-black mt-1 bg-gradient-to-r bg-clip-text text-transparent bg-cover" style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}>
                    <span className={`bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>{card.val}</span>
                  </p>
                  <div className="text-[10px] text-slate-400 font-semibold">System Realtime</div>
                </div>
              ))}
            </div>

            {/* Dynamic Search Box (for lists) */}
            {adminTab !== 'analytics' && (
              <div className="relative">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`🔍 Filter ${adminTab} database tables by keywords...`}
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all text-xs shadow-sm"
                />
              </div>
            )}

            {/* ── 1. Posts Tab Listing ─────────────────────────────────── */}
            {adminTab === 'posts' && (
              <div className="space-y-4">
                {filteredPosts.map(post => (
                  <div key={post.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 relative">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 tracking-wider">Post Record</span>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-50 mt-1">{post.title}</h4>
                      </div>
                      
                      {/* Control Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingPost(post)}
                          className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 hover:text-indigo-600 transition-all active:scale-95 hover:border-indigo-100 flex items-center justify-center"
                          title="Edit Post Content"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id, post.title)}
                          className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 hover:text-red-650 transition-all active:scale-95 hover:border-red-100 flex items-center justify-center"
                          title="Delete Post"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    
                    <div className="flex items-center gap-4 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2.5 font-bold select-none">
                      <span>Author: {post.isAnonymous ? '🎭 Anonymous' : (post.author?.name || post.author?.email || 'Unknown')}</span>
                      <span>•</span>
                      <span>Likes: {post._count?.likes || 0}</span>
                      <span>•</span>
                      <span>Comments: {post._count?.comments || 0}</span>
                      <span>•</span>
                      <span>Created: {new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {filteredPosts.length === 0 && (
                  <p className="text-slate-400 text-xs text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">No posts matched filter criteria.</p>
                )}
              </div>
            )}

            {/* ── 2. Comments Tab Listing ──────────────────────────────── */}
            {adminTab === 'comments' && (
              <div className="space-y-4">
                {filteredComments.map(comment => (
                  <div key={comment.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <span className="text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 tracking-wider">Comment Record</span>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">on Post: <span className="text-red-500 hover:underline">{comment.post?.title || 'Unknown'}</span></p>
                      </div>

                      {/* Control Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingComment(comment)}
                          className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 hover:text-indigo-650 transition-all active:scale-95 hover:border-indigo-100 flex items-center justify-center"
                          title="Edit Comment Content"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id, comment.content.slice(0, 30))}
                          className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 hover:text-red-650 transition-all active:scale-95 hover:border-red-100 flex items-center justify-center"
                          title="Delete Comment"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold italic">"{comment.content}"</p>

                    <div className="flex items-center gap-4 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2.5 font-bold select-none">
                      <span>Author: {comment.isAnonymous ? '🎭 Anonymous' : (comment.author?.name || comment.author?.email || 'Unknown')}</span>
                      <span>•</span>
                      <span>Likes: {comment._count?.likes || 0}</span>
                      <span>•</span>
                      <span>Created: {new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {filteredComments.length === 0 && (
                  <p className="text-slate-400 text-xs text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">No comments matched filter criteria.</p>
                )}
              </div>
            )}

            {/* ── 3. Users Tab Listing ─────────────────────────────────── */}
            {adminTab === 'users' && (
              <div className="space-y-3">
                {filteredUsers.map(u => (
                  <div key={u.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm">{u.name || 'User'}</span>
                        <span className={`text-[9px] px-2 py-0.5 font-black uppercase rounded ${u.role === 'ADMIN' ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'}`}>
                          {u.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-450 mt-1">{u.email} · Registered: {new Date(u.createdAt).toLocaleDateString()}</p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2.5 select-none">
                      {u.id !== user?.id ? (
                        <>
                          <button
                            onClick={() => handleToggleRole(u.id, u.email, u.role)}
                            className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all active:scale-95 ${
                              u.role === 'ADMIN'
                                ? 'bg-orange-55/40 text-orange-600 border-orange-100 hover:bg-orange-100'
                                : 'bg-indigo-55/40 text-indigo-600 border-indigo-100 hover:bg-indigo-100'
                            }`}
                          >
                            {u.role === 'ADMIN' ? 'Demote role' : 'Make Admin'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-slate-55/20 text-slate-500 hover:text-red-600 hover:border-red-100 transition-all active:scale-95 flex items-center justify-center"
                            title="Delete User Account"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold italic">Logged-in Session</span>
                      )}
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-slate-400 text-xs text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">No users matched filter criteria.</p>
                )}
              </div>
            )}

            {/* ── 4. Analytics Tab Listing ─────────────────────────────── */}
            {adminTab === 'analytics' && analytics && (
              <div className="space-y-6">
                
                {/* Posts per day bar chart */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm select-none">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4">Post Upload Volumes (Last 7 Days)</h3>
                  <div className="flex items-end gap-3 h-36 pt-4">
                    {analytics.postsPerDay.map(({ day, count }) => {
                      const max = Math.max(...analytics.postsPerDay.map(d => d.count), 1)
                      const pct = Math.round((count / max) * 100)
                      return (
                        <div key={day} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs font-bold text-red-500">{count}</span>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg" style={{ height: '100px' }}>
                            <div
                              className="w-full bg-gradient-to-t from-purple-600 to-red-500 rounded-t-lg transition-all duration-500"
                              style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 text-center leading-tight mt-1">{day.split(',')[0]}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Top liked posts */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4 select-none">🔥 Trending Posts</h3>
                    <div className="space-y-3">
                      {analytics.topPosts.length === 0 && <p className="text-xs text-slate-400">No active posts yet.</p>}
                      {analytics.topPosts.map((post, i) => (
                        <div key={post.id} className="flex items-center gap-3">
                          <span className="text-xs font-black text-slate-300 w-5">#0{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-extrabold text-slate-950 dark:text-slate-50 truncate">{post.title}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{post.author} · 💬 {post.comments} comments</p>
                          </div>
                          <span className="text-xs font-bold text-red-500">❤️ {post.likes}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Platform Health and Ratios */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4 select-none">🌱 Safety Indices & Checkins</h3>
                    <div className="space-y-3.5 select-none">
                      {[
                        { label: 'Weekly Active Ratio', pct: '74%', val: 'High Engagement' },
                        { label: 'Safe Space Support Rate', pct: '88%', val: 'Positive Vibe Index' },
                        { label: 'Check-in Story Completion', pct: '62%', val: 'Daily Health' }
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                            <span className="text-red-500">{item.pct} ({item.val})</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                            <div className="bg-gradient-to-r from-red-500 to-indigo-500 h-2 rounded-full" style={{ width: item.pct }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Most active users */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm select-none">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4">🏆 Contributor Leaders</h3>
                  <div className="space-y-4">
                    {analytics.activeUsers.length === 0 && <p className="text-xs text-slate-400">No active users yet.</p>}
                    {analytics.activeUsers.map((u, i) => {
                      const max = Math.max(...analytics.activeUsers.map(x => x.total), 1)
                      const pct = Math.round((u.total / max) * 100)
                      return (
                        <div key={u.id} className="flex items-center gap-3">
                          <span className="text-xs font-black text-slate-300 w-5">#0{i + 1}</span>
                          <div className="flex-1">
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span>{u.name}</span>
                              <span className="text-slate-400 text-[10px]">📝 {u.posts} posts · 💬 {u.comments} comments</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                              <div className="bg-gradient-to-r from-purple-600 to-pink-500 h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>
            )}
            
            {adminTab === 'analytics' && !analytics && (
              <p className="text-slate-400 text-xs text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">Querying database analytics indicators...</p>
            )}

          </section>

          {/* Right Column: Moderator Log Trail */}
          <section className="space-y-6">
            
            {/* Audit Logs Trail */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm sticky top-6 flex flex-col h-[calc(100vh-140px)] overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 select-none">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-450 tracking-wider">System Audit Logs</h4>
                  <span className="text-[9px] text-slate-400 font-semibold">Active Session Moderation Logs</span>
                </div>
                <button 
                  onClick={clearAuditLogs}
                  className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:underline"
                >
                  Clear Logs
                </button>
              </div>

              {/* Scrollable logs */}
              <div className="flex-1 overflow-y-auto space-y-3.5 scrollbar-none pr-1">
                {Array.isArray(auditLogs) && auditLogs.map((log) => (
                  <div key={log.id} className="text-[11px] leading-relaxed border-b border-slate-50 dark:border-slate-950 pb-2 flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">{log.time}</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium mt-0.5">{log.action}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center select-none">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                  🔒 Encrypted Operations Mode
                </span>
              </div>
            </div>

          </section>

        </main>
      </div>

      {/* ── Bottom Navigation Bar (Mobile) ────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex justify-around items-center py-2 z-40 shadow-lg select-none">
        <button onClick={() => navigate('/dashboard')} className="text-lg p-2" title="Feed">🧭</button>
        <button onClick={() => { setAdminTab('posts'); setSearchQuery('') }} className={`text-sm p-2 font-bold ${adminTab === 'posts' ? 'text-red-500' : ''}`} title="Posts">Posts</button>
        <button onClick={() => { setAdminTab('comments'); setSearchQuery('') }} className={`text-sm p-2 font-bold ${adminTab === 'comments' ? 'text-red-500' : ''}`} title="Comments">Comments</button>
        <button onClick={() => { setAdminTab('users'); setSearchQuery('') }} className={`text-sm p-2 font-bold ${adminTab === 'users' ? 'text-red-500' : ''}`} title="Users">Users</button>
        <button onClick={() => { setAdminTab('analytics'); setSearchQuery('') }} className={`text-sm p-2 font-bold ${adminTab === 'analytics' ? 'text-red-500' : ''}`} title="Stats">Stats</button>
      </nav>

      {/* Modals */}
      <EditPostModal post={editingPost} onClose={() => setEditingPost(null)} onSave={handleEditPostSave} />
      <EditCommentModal comment={editingComment} onClose={() => setEditingComment(null)} onSave={handleEditCommentSave} />
    </div>
  )
}
