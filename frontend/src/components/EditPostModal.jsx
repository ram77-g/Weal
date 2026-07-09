import { useState, useEffect } from 'react'

/**
 * Modal for editing an existing post's title and content.
 * Renders nothing when `post` is null (closed state).
 */
export default function EditPostModal({ post, onClose, onSave }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    if (post) {
      setTitle(post.title)
      setContent(post.content)
    }
  }, [post])

  if (!post) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    onSave({ id: post.id, title, content })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        <h3 className="text-xl font-bold mb-4">Edit Post</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="w-full p-3 border rounded dark:bg-slate-700 dark:border-slate-600"
              placeholder="Title"
            />
            <p className="text-xs text-right text-slate-400 mt-0.5">{title.length}/200</p>
          </div>
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={10000}
              className="w-full p-3 border rounded h-40 dark:bg-slate-700 dark:border-slate-600"
              placeholder="Content"
            />
            <p className="text-xs text-right text-slate-400 mt-0.5">{content.length}/10000</p>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border border-slate-300 dark:border-slate-600 text-sm">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white text-sm">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  )
}
