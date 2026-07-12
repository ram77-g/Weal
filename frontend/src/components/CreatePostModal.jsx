import { useState, useRef } from 'react'
import EmojiPicker from './EmojiPicker'

export default function CreatePostModal({ isOpen, onClose, onSave, loading, setStatus }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [customTag, setCustomTag] = useState('')
  const [showEmojis, setShowEmojis] = useState(false)
  const fileInputRef = useRef(null)

  const handleEmojiSelect = (emoji) => setContent(prev => prev + emoji)

  if (!isOpen) return null

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      validateAndSetImage(file)
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetImage(e.target.files[0])
    }
  }

  const validateAndSetImage = (file) => {
    if (!file.type.startsWith('image/')) {
      setStatus({ message: 'Only image files are allowed', type: 'error' })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatus({ message: 'Image must be under 10MB', type: 'error' })
      return
    }
    setImageFile(file)
  }

  const handleQuickTag = (tag) => {
    if (!content.includes(tag)) {
      setContent(prev => prev.trim() + (prev ? ' ' : '') + tag)
    }
  }

  const handleAddCustomTag = (e) => {
    e?.preventDefault?.()
    if (customTag.trim()) {
      let tag = customTag.trim()
      if (!tag.startsWith('#')) tag = '#' + tag
      if (!content.includes(tag)) {
        setContent(prev => prev.trim() + (prev ? ' ' : '') + tag)
      }
      setCustomTag('')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      setStatus({ message: 'Title and content are required', type: 'error' })
      return
    }
    if (title.trim().length < 3 || title.trim().length > 200) {
      setStatus({ message: 'Title must be between 3 and 200 characters', type: 'error' })
      return
    }
    if (content.trim().length < 10 || content.trim().length > 10000) {
      setStatus({ message: 'Content must be between 10 and 10000 characters', type: 'error' })
      return
    }

    onSave({ title, content, isAnonymous, imageFile })
    // Reset state
    setTitle('')
    setContent('')
    setImageFile(null)
    setIsAnonymous(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-150 dark:border-slate-800 flex flex-col md:flex-row h-[90vh] md:h-[650px] animate-slide-up">
        
        {/* Left Side: Image Dropzone/Preview */}
        <div 
          className={`flex-1 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 relative ${dragActive ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          {imageFile ? (
            <div className="relative w-full h-full p-4 flex flex-col items-center justify-center">
              <img 
                src={URL.createObjectURL(imageFile)} 
                alt="Upload preview" 
                className="max-w-full max-h-[80%] rounded-2xl object-contain shadow-md"
              />
              <button 
                type="button" 
                onClick={() => setImageFile(null)} 
                className="absolute top-6 right-6 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-md transition-all active:scale-95"
              >
                ✕
              </button>
              <p className="text-xs text-slate-400 mt-3 truncate max-w-xs">{imageFile.name}</p>
            </div>
          ) : (
            <div className="p-6 text-center flex flex-col items-center justify-center h-full w-full">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 text-slate-400 mb-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-1">Drag photos here</p>
              <p className="text-xs text-slate-400 mb-4">Supports PNG, JPG (Max 10MB)</p>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow active:scale-95"
              >
                Select from computer
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          )}
        </div>

        {/* Right Side: Form Inputs */}
        <form onSubmit={handleSubmit} className="w-full md:w-[420px] flex flex-col justify-between p-6 bg-white dark:bg-slate-900">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Cancel
            </button>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Create New Post</h3>
            <button 
              type="submit" 
              disabled={loading}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 disabled:opacity-55"
            >
              {loading ? 'Sharing...' : 'Share'}
            </button>
          </div>

          {/* Form Inputs Container */}
          <div className="flex-1 py-4 space-y-4 overflow-y-auto scrollbar-none">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">Title</label>
              <input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Give your story a title..." 
                maxLength={200}
                required
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs transition-all"
              />
              <p className="text-[10px] text-right text-slate-400 mt-1">{title.length}/200</p>
            </div>

            {/* Description Content */}
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2">Share your story</label>
              <EmojiPicker 
                expanded={showEmojis} 
                onToggle={() => setShowEmojis(!showEmojis)} 
                onSelect={handleEmojiSelect} 
                id="create-post-"
              />
              <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder="Write whatever is on your mind..." 
                maxLength={10000}
                required
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 h-36 text-xs transition-all resize-none"
              />
              <p className="text-[10px] text-right text-slate-400 mt-1">{content.length}/10000</p>
            </div>

            {/* Quick Hashtags */}
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">Add Wellness Tags</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {['#gratitude', '#vent', '#milestone', '#advice', '#mindfulness'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleQuickTag(tag)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-95"
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag(e)}
                  placeholder="Or type custom tag..."
                  className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="px-3 py-1.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 rounded-lg text-xs font-bold transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={isAnonymous} 
                onChange={(e) => setIsAnonymous(e.target.checked)} 
                className="rounded text-indigo-600 focus:ring-indigo-500" 
              />
              Share Anonymously
            </label>
            
            <p className="text-[10px] text-slate-400">
              Safe Space Community Guideline Guidelines
            </p>
          </div>

        </form>
      </div>
    </div>
  )
}
