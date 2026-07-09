import { useState, useRef } from 'react'
import { getImageSrc } from '../lib/api'

export default function PostCard({ post, isSelected, user, onSelect, onLike, onEdit, onTagClick }) {
  const [showHeartPop, setShowHeartPop] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const lastClickTime = useRef(0)

  const isLiked = post.likes?.some((l) => l.userId === user?.id)
  const initial = post.isAnonymous ? '🎭' : (post.author?.name || 'U').slice(0, 1).toUpperCase()

  // Select a background gradient based on the post ID (deterministic)
  const getGradientClass = (id) => {
    const code = id.charCodeAt(id.length - 1) || 0
    const index = code % 5
    const gradients = [
      'from-indigo-500/10 via-purple-500/5 to-pink-500/10 border-indigo-500/20 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-pink-950/40 dark:border-indigo-800/40',
      'from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border-emerald-500/20 dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-cyan-950/40 dark:border-emerald-800/40',
      'from-amber-500/10 via-orange-500/5 to-rose-500/10 border-amber-500/20 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-rose-950/40 dark:border-amber-800/40',
      'from-blue-500/10 via-indigo-500/5 to-purple-500/10 border-blue-500/20 dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-purple-950/40 dark:border-blue-800/40',
      'from-pink-500/10 via-rose-500/5 to-red-500/10 border-pink-500/20 dark:from-pink-950/40 dark:via-rose-950/20 dark:to-red-950/40 dark:border-pink-800/40'
    ]
    return gradients[index]
  }

  // Handle double click like interaction
  const handleContentClick = (e) => {
    const currentTime = new Date().getTime()
    const clickDelay = currentTime - lastClickTime.current
    
    if (clickDelay < 300) {
      // Double click detected!
      setShowHeartPop(true)
      setTimeout(() => setShowHeartPop(false), 800)
      
      if (!isLiked) {
        onLike(post.id)
      }
    } else {
      // Single click - select the post to open comments
      onSelect(post.id)
    }
    lastClickTime.current = currentTime
  }

  // Helper function to render text with clickable hashtags
  const renderClickableText = (text) => {
    if (!text) return ''
    const parts = text.split(/(\s+)/)
    return parts.map((part, i) => {
      if (part.startsWith('#') && part.length > 1) {
        // Strip punctuation from ending of tag
        const cleanTag = part.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
        return (
          <span
            key={i}
            onClick={(e) => {
              e.stopPropagation()
              if (onTagClick) onTagClick(cleanTag.slice(1)) // Remove # for filter
            }}
            className="text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer hover:underline"
          >
            {part}
          </span>
        )
      }
      return part
    })
  }

  // Content limit logic
  const shouldTruncate = post.content.length > 180
  const displayContent = shouldTruncate && !isExpanded 
    ? `${post.content.slice(0, 180)}...`
    : post.content

  // Mood badge lookup if author checked-in
  const hasStory = post.author?.checkedInToday || post.isAnonymousCheckin

  return (
    <article
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow transition-all duration-300 hover:shadow-md ${
        isSelected ? 'ring-2 ring-indigo-500/50' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          {/* Avatar with Gradient border indicating check-in story */}
          <div className={`p-[2.5px] rounded-full ${hasStory ? 'story-gradient' : 'bg-transparent'}`}>
            {!post.isAnonymous && post.author?.profilePicture ? (
              <img src={getImageSrc(post.author.profilePicture)} alt="Author" className="h-10 w-10 rounded-full object-cover border-2 border-white dark:border-slate-900 shadow-sm" />
            ) : (
              <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white select-none border-2 border-white dark:border-slate-900 ${
                post.isAnonymous
                  ? 'bg-gradient-to-tr from-purple-500 via-pink-500 to-red-400'
                  : 'bg-gradient-to-tr from-indigo-500 to-purple-600'
              }`}>
                {initial}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold leading-none hover:underline cursor-pointer" onClick={() => onSelect(post.id)}>
                {post.isAnonymous ? 'Anonymous' : (post.author?.name || 'User')}
              </h4>
              {post.author?.checkedInToday && (
                <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full" title={`Feeling ${post.author.checkedInToday}`}>
                  {post.author.checkedInToday === 'Happy' && '😊 Happy'}
                  {post.author.checkedInToday === 'Sad' && '😔 Sad'}
                  {post.author.checkedInToday === 'Peaceful' && '🧘 Peaceful'}
                  {post.author.checkedInToday === 'Anxious' && '⚡ Anxious'}
                  {post.author.checkedInToday === 'Vented' && '🙏 Vented'}
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block">
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Options / Edit */}
        {!post.isAnonymous && post.author?.id === user?.id && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(post)
            }}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600 font-semibold transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
            title="Edit post"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            Edit
          </button>
        )}
      </div>

      {/* Content Body */}
      <div 
        onClick={handleContentClick}
        className="cursor-pointer select-none px-5 pb-3 relative"
      >
        {/* Heart pop animation overlay */}
        {showHeartPop && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none animate-heart-pop">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-24 h-24 text-white drop-shadow-[0_4px_12px_rgba(239,68,68,0.7)] filter">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          </div>
        )}

        {/* Text Content */}
        <h3 className="font-extrabold text-lg mb-2 text-slate-900 dark:text-slate-100 leading-snug">{post.title}</h3>
        <p className="text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {renderClickableText(displayContent)}
        </p>
        {shouldTruncate && (
          <button 
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline mt-1 text-sm block"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Image if available */}
      {post.imageUrl && (
        <div 
          onClick={handleContentClick}
          className="w-full bg-slate-100 dark:bg-slate-950 overflow-hidden cursor-pointer"
        >
          <img
            src={getImageSrc(post.imageUrl)}
            alt="post media"
            className="w-full max-h-[500px] object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Actions & Meta (Bottom Row) */}
      <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Like Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onLike(post.id)
            }}
            className="flex items-center gap-2 group focus:outline-none transition-transform active:scale-95"
            title="Like post"
          >
            <div className={`p-1.5 rounded-full transition-colors ${isLiked ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-rose-50 dark:group-hover:bg-rose-900/20 group-hover:text-rose-500'}`}>
              {isLiked ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 animate-fade-in">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              )}
            </div>
            <span className={`text-sm font-bold ${isLiked ? 'text-rose-500' : 'text-slate-600 dark:text-slate-400 group-hover:text-rose-500'} transition-colors`}>
              {post._count?.likes || 0}
            </span>
          </button>

          {/* Comment Button (opens detail view) */}
          <button 
            onClick={(e) => {
              e.stopPropagation()
              onSelect(post.id)
            }}
            className="flex items-center gap-2 group focus:outline-none transition-transform active:scale-95"
            title="View comments"
          >
            <div className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785 4.5 4.5 0 002.381-.683c.5-.3.1.666.1.666A8.96 8.96 0 0012 20.25z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-indigo-500 transition-colors">
              {post._count?.comments || 0}
            </span>
          </button>
        </div>
      </div>
    </article>
  )
}
