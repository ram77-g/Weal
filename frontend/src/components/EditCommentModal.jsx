import { useState, useEffect } from 'react'

/**
 * Modal for editing an existing comment's content.
 * Renders nothing when `comment` is null (closed state).
 */
export default function EditCommentModal({ comment, onClose, onSave }) {
  const [content, setContent] = useState('')

  useEffect(() => {
    if (comment) {
      setContent(comment.content)
    }
  }, [comment])

  if (!comment) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!content.trim()) return
    onSave({ id: comment.id, content })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-150 dark:border-slate-800 animate-slide-up">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Edit Comment</h3>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={2000}
              required
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 h-32 text-xs transition-all resize-none"
              placeholder="Update comment text..."
            />
            <p className="text-[10px] text-right text-slate-400 mt-1">{content.length}/2000</p>
          </div>
          
          <div className="flex gap-2 justify-end select-none">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-850 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
