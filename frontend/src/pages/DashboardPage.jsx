import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStatus } from '../hooks/useStatus'
import { API_URL, getImageSrc } from '../lib/api'
import PostCard from '../components/PostCard'
import CommentThread from '../components/CommentThread'
import EmojiPicker from '../components/EmojiPicker'
import EditPostModal from '../components/EditPostModal'
import CreatePostModal from '../components/CreatePostModal'

const POSTS_PER_PAGE = 5



export default function DashboardPage() {
  const { token, user, isAuthenticated, darkMode, logout, setDarkMode } = useAuth()
  const navigate = useNavigate()
  const { status, setStatus } = useStatus()

  // Posts state
  const [posts, setPosts] = useState([])
  const [selectedPostId, setSelectedPostId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [postPage, setPostPage] = useState(1)

  // Comments state
  const [commentsByPost, setCommentsByPost] = useState({})
  const [commentDrafts, setCommentDrafts] = useState({})
  const [replyDrafts, setReplyDrafts] = useState({})
  const [anonymousComment, setAnonymousComment] = useState(false)
  const [anonymousReply, setAnonymousReply] = useState({})
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showReplyEmojiPicker, setShowReplyEmojiPicker] = useState({})



  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingPost, setEditingPost] = useState(null)

  const searchInputRef = useRef(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) navigate('/auth')
  }, [isAuthenticated, navigate])

  // ─── Data fetching ───────────────────────────────────────────

  const fetchPosts = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true)
      const res = await fetch(`${API_URL}/posts`)
      const data = await res.json()
      setPosts(data.posts || [])
    } catch (err) {
      console.error('Failed to load posts:', err)
    } finally {
      if (!isBackground) setLoading(false)
    }
  }, [])

  const fetchCommentsForPost = useCallback(async (postId) => {
    if (!postId) return
    try {
      const res = await fetch(`${API_URL}/comments/post/${postId}`)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to load comments')
      }
      const data = await res.json()
      setCommentsByPost(prev => ({ ...prev, [postId]: data.comments || [] }))
    } catch (err) {
      console.error('Failed to load comments:', err)
    }
  }, [])

  // Initial fetch
  useEffect(() => { fetchPosts() }, [fetchPosts])

  // Auto-select first post and pre-fetch comments
  useEffect(() => {
    if (posts.length === 0) return
    if (!selectedPostId) setSelectedPostId(posts[0]?.id)
    posts.forEach((post) => {
      if (!commentsByPost[post.id]) fetchCommentsForPost(post.id)
    })
  }, [posts]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch comments when selecting a post
  useEffect(() => {
    if (selectedPostId && !commentsByPost[selectedPostId]) {
      fetchCommentsForPost(selectedPostId)
    }
  }, [selectedPostId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Polling every 8 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchPosts(true)
      if (selectedPostId) fetchCommentsForPost(selectedPostId)
    }, 8000)
    return () => clearInterval(intervalId)
  }, [selectedPostId, fetchPosts, fetchCommentsForPost])

  const selectedPost = posts.find((post) => post.id === selectedPostId)

  // ─── Actions ─────────────────────────────────────────────────

  const addEmojiToDraft = (emoji, parentCommentId = null) => {
    if (parentCommentId) {
      setReplyDrafts(prev => ({ ...prev, [parentCommentId]: (prev[parentCommentId] || '') + emoji }))
    } else if (selectedPost) {
      setCommentDrafts(prev => ({ ...prev, [selectedPost.id]: (prev[selectedPost.id] || '') + emoji }))
    }
  }

  const handleCreatePost = async ({ title, content, isAnonymous, imageFile }) => {
    try {
      setLoading(true)
      let imageUrl = undefined

      // Upload image file if present
      if (imageFile) {
        const formData = new FormData()
        formData.append('image', imageFile)
        const uploadRes = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        })
        if (!uploadRes.ok) throw new Error('Failed to upload image')
        const uploadData = await uploadRes.json()
        imageUrl = uploadData.url
      }

      const res = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, content, isAnonymous, imageUrl })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || 'Create post failed')
      
      setIsCreateOpen(false)
      setStatus({ message: 'Post created!', type: 'success' })
      fetchPosts()
    } catch (err) {
      setStatus({ message: err.message || 'Post creation failed', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleLikePost = async (postId) => {
    if (!isAuthenticated) {
      setStatus({ message: 'Login required to like posts', type: 'error' })
      navigate('/auth')
      return
    }
    try {
      const res = await fetch(`${API_URL}/likes/post/${postId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Like failed')
      fetchPosts()
    } catch (err) {
      setStatus({ message: err.message || 'Failed to like', type: 'error' })
    }
  }

  const handleCreateComment = async (parentCommentId = null, isAnonymousOverride = null) => {
    const postId = selectedPost?.id
    if (!postId) return

    const isReply = Boolean(parentCommentId)
    const content = (isReply ? (replyDrafts[parentCommentId] || '') : (commentDrafts[postId] || '')).trim()
    const isAnonymous = isAnonymousOverride !== null
      ? isAnonymousOverride
      : (isReply ? (anonymousReply[parentCommentId] || false) : anonymousComment)

    if (!content) {
      setStatus({ message: 'Please enter a comment', type: 'error' })
      return
    }
    if (content.length > 2000) {
      setStatus({ message: 'Comment must be 1-2000 characters', type: 'error' })
      return
    }
    if (!isAuthenticated) {
      setStatus({ message: 'Please log in to comment', type: 'error' })
      navigate('/auth')
      return
    }

    try {
      const res = await fetch(`${API_URL}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ postId, content, parentCommentId, isAnonymous })
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setStatus({ message: 'Login expired, please login again', type: 'error' })
          return
        }
        throw new Error(data.error || data.message || 'Failed to add comment')
      }
      if (isReply) {
        setReplyDrafts(prev => ({ ...prev, [parentCommentId]: '' }))
      } else {
        setCommentDrafts(prev => ({ ...prev, [postId]: '' }))
      }
      await fetchCommentsForPost(postId)
      await fetchPosts()
      setStatus({ message: 'Comment posted', type: 'success' })
    } catch (err) {
      setStatus({ message: err.message || 'Cannot post comment', type: 'error' })
    }
  }

  const handleLikeComment = async (commentId) => {
    if (!isAuthenticated) {
      setStatus({ message: 'Login required to like comment', type: 'error' })
      navigate('/auth')
      return
    }
    try {
      const res = await fetch(`${API_URL}/likes/comment/${commentId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to like comment')
      await fetchCommentsForPost(selectedPost?.id)
    } catch (err) {
      setStatus({ message: err.message || 'Failed to like comment', type: 'error' })
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return
    try {
      const res = await fetch(`${API_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to delete comment')
      await fetchCommentsForPost(selectedPost?.id)
      await fetchPosts()
      setStatus({ message: 'Comment deleted', type: 'success' })
    } catch (err) {
      setStatus({ message: err.message || 'Failed to delete comment', type: 'error' })
    }
  }

  const handleEditPost = async ({ id, title, content }) => {
    if (!title.trim() || !content.trim()) return
    if (title.trim().length < 3 || title.trim().length > 200) {
      setStatus({ message: 'Title must be 3-200 characters', type: 'error' })
      return
    }
    if (content.trim().length < 10 || content.trim().length > 10000) {
      setStatus({ message: 'Content must be 10-10000 characters', type: 'error' })
      return
    }
    try {
      const res = await fetch(`${API_URL}/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, content })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to update post')
      setEditingPost(null)
      fetchPosts()
      setStatus({ message: 'Post updated!', type: 'success' })
    } catch (err) {
      setStatus({ message: err.message || 'Failed to update post', type: 'error' })
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const focusSearchInput = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
      searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  // Helper function to render text with clickable hashtags (for the split panel view)
  const renderClickableText = (text) => {
    if (!text) return ''
    const parts = text.split(/(\s+)/)
    return parts.map((part, i) => {
      if (part.startsWith('#') && part.length > 1) {
        const cleanTag = part.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
        return (
          <span
            key={i}
            onClick={() => setSelectedTag(cleanTag.slice(1))}
            className="text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer hover:underline"
          >
            {part}
          </span>
        )
      }
      return part
    })
  }

  // ─── Derived state ──────────────────────────────────────────

  const filteredPosts = posts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTag = selectedTag 
      ? p.title.toLowerCase().includes(`#${selectedTag.toLowerCase()}`) || 
        p.content.toLowerCase().includes(`#${selectedTag.toLowerCase()}`)
      : true
    return matchesSearch && matchesTag
  })

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
  const paginatedPosts = filteredPosts.slice((postPage - 1) * POSTS_PER_PAGE, postPage * POSTS_PER_PAGE)

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} flex flex-col md:flex-row`}>
      
      {/* ── Sticky Left Sidebar Navigation (Desktop) ───────────────────── */}
      <aside className="group hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800 w-24 hover:w-64 transition-[width] duration-300 ease-in-out overflow-hidden fixed h-screen bg-white dark:bg-slate-900 py-6 px-4 hover:px-6 z-40 justify-between">
        <div className="space-y-8">
          {/* Logo / Branding */}
          <div className="flex items-center gap-3 px-2 cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-xl group-hover:text-2xl font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent tracking-tight select-none transition-all duration-300">
              WEAL
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-4 px-2 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold text-sm text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Home</span>
            </button>
            <button
              onClick={() => { setSelectedPostId(null); setPostPage(1); setSelectedTag(''); setSearchQuery('') }}
              className={`flex items-center gap-4 px-2 py-3 rounded-xl transition-all font-bold text-sm ${!selectedTag && !searchQuery ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 19.5v-.75a7.5 7.5 0 00-7.5-7.5H4.5m0-3V4.5m0 0a3 3 0 013-3h1.5m-4.5 3.5v1.5a3 3 0 003 3h1.5m1.5-3v-1.5a3 3 0 013-3H15m-3 3.5v1.5a3 3 0 003 3h1.5m-7.5 6v1.5a3 3 0 003 3H12m0-3.5v-1.5a3 3 0 013-3h1.5m-3 7.5V21m-6-1.5h1.5M12 13.5v-1.5a1.5 1.5 0 011.5-1.5h3m-9 0h3a1.5 1.5 0 011.5 1.5v3" />
              </svg>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Feed</span>
            </button>
            <button
              onClick={focusSearchInput}
              className="flex items-center gap-4 px-2 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold text-sm text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.604 10.604z" />
              </svg>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Search</span>
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-4 px-2 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold text-sm text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Create</span>
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-4 px-2 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold text-sm text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Profile</span>
            </button>
            <button
              onClick={() => navigate('/events')}
              className="flex items-center gap-4 px-2 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold text-sm text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Events</span>
            </button>
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-4 px-2 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold text-sm text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Admin Panel</span>
              </button>
            )}
            <button
              onClick={() => {}}
              className="flex items-center gap-4 px-2 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold text-sm text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 relative"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              <span className="absolute top-3 left-6 w-2 h-2 bg-rose-500 border-2 border-white dark:border-slate-950 rounded-full"></span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Notifications</span>
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center gap-4 px-2 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold text-sm text-slate-700 dark:text-slate-300"
              title={darkMode ? 'Switch to light' : 'Switch to dark'}
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </nav>
        </div>

        {/* User profile footer link */}
        <div className="border-t border-slate-150 dark:border-slate-800 pt-4 flex flex-col gap-3">
          <div className="flex items-center gap-3 pl-1">
            {user?.profilePicture ? (
              <img src={getImageSrc(user.profilePicture)} alt="Profile" className="h-9 w-9 shrink-0 rounded-full object-cover shadow border border-slate-200 dark:border-slate-700" />
            ) : (
              <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow">
                {(user?.name || 'U').slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="text-sm font-extrabold truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            <span className="shrink-0 text-base">🚪</span>
            <span className="opacity-0 hidden group-hover:block group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Scrollable Feed Area ───────────────────────────────── */}
      <div className="flex-1 md:pl-20 pb-20 md:pb-0 transition-all duration-300 ease-in-out">
        <main className="mx-auto max-w-5xl px-4 py-6 grid gap-6 lg:grid-cols-[1.5fr_1.1fr]">
          
          {/* Feed Column */}
          <section className="space-y-5 max-w-xl mx-auto w-full">
            

            {/* Filter tags title overlay if tag active */}
            {(selectedTag || searchQuery) && (
              <div className="flex items-center justify-between p-3.5 bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl">
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                  {selectedTag ? `Showing: #${selectedTag}` : `Search results for: "${searchQuery}"`}
                </span>
                <button
                  onClick={() => { setSelectedTag(''); setSearchQuery('') }}
                  className="text-xs font-bold text-indigo-500 hover:text-indigo-700 hover:underline"
                >
                  Clear filter
                </button>
              </div>
            )}

            {/* Search Input and Explore quick filters */}
            <div className="space-y-3">
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPostPage(1); setSelectedTag('') }}
                placeholder="🔍 Search stories, tags, vlogs..."
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm shadow"
              />
              
              {/* Explore badges */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
                {['All', 'gratitude', 'vent', 'milestone', 'advice', 'mindfulness'].map((tag) => {
                  const isActive = (tag === 'All' && !selectedTag) || (selectedTag === tag)
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        setPostPage(1)
                        if (tag === 'All') {
                          setSelectedTag('')
                        } else {
                          setSelectedTag(tag)
                          setSearchQuery('')
                        }
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all active:scale-95 ${isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}
                    >
                      {tag === 'All' ? 'All Stories' : `#${tag}`}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Posts Stream */}
            <div className="space-y-5">
              {loading && posts.length === 0 ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                      <div className="skeleton h-5 w-2/3 rounded-lg" />
                      <div className="skeleton h-3 w-1/3 rounded-lg" />
                      <div className="skeleton h-36 w-full rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {paginatedPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      isSelected={selectedPostId === post.id}
                      user={user}
                      onSelect={setSelectedPostId}
                      onLike={handleLikePost}
                      onEdit={(p) => setEditingPost({ id: p.id, title: p.title, content: p.content })}
                      onTagClick={setSelectedTag}
                    />
                  ))}
                  
                  {filteredPosts.length === 0 && (
                    <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow">
                      <div className="text-5xl mb-3">🌱</div>
                      <p className="font-extrabold text-slate-650 dark:text-slate-350 text-sm">No stories found</p>
                      <p className="text-xs text-slate-400 mt-1">Be the first to share your safe wellness experience</p>
                    </div>
                  )}

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-2 select-none">
                      <button onClick={() => setPostPage(p => Math.max(1, p - 1))} disabled={postPage === 1} className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 shadow-sm transition-all active:scale-95">← Prev</button>
                      <span className="text-xs text-slate-500 font-bold">{postPage} / {totalPages}</span>
                      <button onClick={() => setPostPage(p => Math.min(totalPages, p + 1))} disabled={postPage === totalPages} className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 shadow-sm transition-all active:scale-95">Next →</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Right Column: Split Post comments drawer OR Profile details + suggestions */}
          <section className="hidden lg:block">
            {selectedPost ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow sticky top-8 flex flex-col h-[calc(100vh-140px)] overflow-hidden">
                
                {/* Header showing selected post author */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-850">
                  <div className="flex items-center gap-2.5">
                    {!selectedPost.isAnonymous && selectedPost.author?.profilePicture ? (
                      <img src={getImageSrc(selectedPost.author.profilePicture)} alt="Author" className="h-8 w-8 rounded-full object-cover border border-white shadow-sm" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs border border-white shadow-sm">
                        {selectedPost.isAnonymous ? '🎭' : (selectedPost.author?.name || 'User').slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-none hover:underline cursor-pointer">
                        {selectedPost.isAnonymous ? 'Anonymous' : (selectedPost.author?.name || 'User')}
                      </h4>
                      <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Post details</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedPostId(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold transition-transform active:scale-95">
                    ✕ Close
                  </button>
                </div>

                {/* Main scrollable body (original post text + comment threads) */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
                  {/* Original Post detail box */}
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-inner">
                    <h3 className="font-extrabold text-sm leading-snug">{selectedPost.title}</h3>
                    <p className="mt-2.5 text-xs text-slate-750 dark:text-slate-250 leading-relaxed whitespace-pre-wrap">
                      {renderClickableText(selectedPost.content)}
                    </p>
                    {selectedPost.imageUrl && (
                      <img 
                        src={getImageSrc(selectedPost.imageUrl)} 
                        alt="post media" 
                        className="mt-3.5 w-full rounded-xl object-cover max-h-48 border border-slate-100 dark:border-slate-800 shadow-sm"
                      />
                    )}
                    <div className="mt-3.5 flex items-center justify-between text-[10px] text-slate-400 pt-2.5 border-t border-slate-100 dark:border-slate-800 font-bold select-none">
                      <span>{new Date(selectedPost.createdAt).toLocaleString()}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-rose-500">❤️ {selectedPost._count?.likes || 0}</span>
                        <span>💬 {selectedPost._count?.comments || 0} comments</span>
                      </div>
                    </div>
                  </div>

                  {/* Comments label */}
                  <div className="pt-1 select-none">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comments</h4>
                  </div>

                  {/* Dynamic Comments List */}
                  <div className="space-y-3">
                    {(commentsByPost[selectedPost.id] || []).length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-xs text-slate-400 font-semibold">No comments yet. Start the conversation!</p>
                      </div>
                    ) : (
                      (commentsByPost[selectedPost.id] || []).map((comment) => (
                        <CommentThread
                          key={comment.id}
                          comment={comment}
                          user={user}
                          isAuthenticated={isAuthenticated}
                          replyDrafts={replyDrafts}
                          setReplyDrafts={setReplyDrafts}
                          anonymousReply={anonymousReply}
                          setAnonymousReply={setAnonymousReply}
                          showReplyEmojiPicker={showReplyEmojiPicker}
                          setShowReplyEmojiPicker={setShowReplyEmojiPicker}
                          onCreateComment={(parentCommentId, isAnon) => handleCreateComment(parentCommentId, isAnon)}
                          onLikeComment={handleLikeComment}
                          onDeleteComment={handleDeleteComment}
                          onAddEmoji={(emoji, parentId) => addEmojiToDraft(emoji, parentId)}
                        />
                      ))
                    )}
                  </div>
                </div>

                {/* Sticky Bottom Section: Add Comment Form */}
                <div className="p-4 border-t border-slate-150 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 shrink-0">
                  <div className="flex flex-col gap-3">
                    <EmojiPicker
                      expanded={showEmojiPicker}
                      onToggle={() => setShowEmojiPicker(!showEmojiPicker)}
                      onSelect={(emoji) => addEmojiToDraft(emoji)}
                    />
                    <textarea
                      value={commentDrafts[selectedPost.id] || ''}
                      onChange={(e) => setCommentDrafts(prev => ({ ...prev, [selectedPost.id]: e.target.value }))}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px] text-sm resize-none shadow-sm"
                      placeholder="Add a comment..."
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                        <input type="checkbox" checked={anonymousComment} onChange={(e) => setAnonymousComment(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                        Comment anonymously
                      </label>
                      <button 
                        onClick={() => handleCreateComment(null, anonymousComment)} 
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all active:scale-95 shadow-md"
                      >
                        Post comment
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="sticky top-8 self-start space-y-6">
                
                {/* User profile card summary */}
                <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow">
                  <div className="flex items-center gap-3">
                    {user?.profilePicture ? (
                      <img src={getImageSrc(user.profilePicture)} alt="Profile" className="h-12 w-12 rounded-full object-cover shadow border-2 border-slate-100 dark:border-slate-800" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-lg shadow">
                        {(user?.name || 'U').slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-slate-50 leading-none">{user?.name || 'User'}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{user?.email}</p>
                    </div>
                  </div>
                  <button onClick={() => navigate('/profile')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors">Switch</button>
                </div>

                {/* Self Care tips suggestions */}
                <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 select-none">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daily Self-Care Suggestions</h3>
                    <span className="text-[10px] text-indigo-500 font-bold">🌱 Mind</span>
                  </div>
                  <div className="space-y-3.5">
                    {[
                      { icon: '💧', title: 'Stay Hydrated', desc: 'Drink at least 2L of water today to keep your mind fresh and clean.' },
                      { icon: '🚶', title: 'Take a Breath', desc: 'A simple 10-minute walk outside helps clear negative thoughts.' },
                      { icon: '🙏', title: 'Gratitude Check', desc: 'Write down 3 things you are grateful for before going to sleep.' }
                    ].map((tip, idx) => (
                      <div key={idx} className="flex gap-3 items-start text-xs">
                        <span className="text-lg leading-none">{tip.icon}</span>
                        <div>
                          <p className="font-extrabold text-slate-800 dark:text-slate-200 leading-tight mb-0.5">{tip.title}</p>
                          <p className="text-slate-450 dark:text-slate-500 text-[11px] leading-snug">{tip.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Minimal Footer */}
                <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 select-none">
                  © 2026 WEAL Community · Safe Space for Wellness
                </p>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* ── Bottom Navigation Bar (Mobile) ────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex justify-around items-center py-2 z-40 shadow-lg select-none">
        <button onClick={() => navigate('/')} className="text-xl p-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="Home">🏠</button>
        <button onClick={() => { setSelectedPostId(null); setPostPage(1); setSelectedTag(''); setSearchQuery('') }} className="text-xl p-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="Feed">🧭</button>
        <button onClick={() => setIsCreateOpen(true)} className="text-xl p-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="Create">➕</button>
        <button onClick={() => navigate('/profile')} className="text-xl p-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="Profile">👤</button>
        <button onClick={handleLogout} className="text-xl p-2 text-rose-500 hover:text-rose-600 transition-colors" title="Logout">🚪</button>
      </nav>



      {/* Modals */}
      <CreatePostModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSave={handleCreatePost} loading={loading} setStatus={setStatus} />
      <EditPostModal post={editingPost} onClose={() => setEditingPost(null)} onSave={handleEditPost} />
    </div>
  )
}
