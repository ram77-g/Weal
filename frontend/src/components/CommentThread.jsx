import EmojiPicker from './EmojiPicker'

/**
 * Recursive comment thread component.
 * Renders a single comment with reply/like/delete actions,
 * and recursively renders nested replies.
 */
export default function CommentThread({
  comment,
  depth = 0,
  user,
  isAuthenticated,
  replyDrafts,
  setReplyDrafts,
  anonymousReply,
  setAnonymousReply,
  showReplyEmojiPicker,
  setShowReplyEmojiPicker,
  onCreateComment,
  onLikeComment,
  onDeleteComment,
  onAddEmoji
}) {
  return (
    <div
      className={`relative rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50/60 dark:bg-slate-900/60 shadow-sm transition-all duration-300 ${
        depth > 0 ? 'border-l-4 border-l-indigo-400 dark:border-l-indigo-500' : ''
      }`}
      style={{ marginLeft: `${depth > 0 ? 0.75 : 0}rem` }}
    >
      {/* Comment header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">
            {comment.isAnonymous ? '🎭 Anonymous' : (comment.author?.name || 'User')}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {new Date(comment.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated && !comment.isAnonymous && comment.author?.id === user?.id && (
            <button
              onClick={() => onDeleteComment(comment.id)}
              className="text-slate-400 hover:text-red-500 transition-colors"
              title="Delete comment"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/>
                <path d="M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          )}
          <button
            onClick={() => onLikeComment(comment.id)}
            className={`text-xs font-semibold ${
              comment.likes?.some(l => l.userId === user?.id)
                ? 'text-pink-600'
                : 'text-slate-400 hover:text-pink-500'
            }`}
          >
            {comment.likes?.some(l => l.userId === user?.id) ? '❤️' : '🤍'} {comment.likes?.length || 0}
          </button>
        </div>
      </div>

      {/* Comment body */}
      <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{comment.content}</p>

      {/* Reply toggle */}
      <div className="mt-2 flex gap-2">
        <button
          onClick={() => setReplyDrafts(prev => ({
            ...prev,
            [comment.id]: prev[comment.id] !== undefined ? undefined : ''
          }))}
          className="text-xs text-indigo-600"
        >
          {replyDrafts[comment.id] !== undefined ? 'Cancel' : 'Reply'}
        </button>
      </div>

      {/* Reply form */}
      {replyDrafts[comment.id] !== undefined && (
        <div className="mt-2">
          <div className="text-xs text-indigo-500 mb-1">
            Replying to @{comment.author?.name || 'User'}
          </div>
          <EmojiPicker
            id={comment.id}
            expanded={showReplyEmojiPicker[comment.id] || false}
            onToggle={() => setShowReplyEmojiPicker(prev => ({
              ...prev,
              [comment.id]: !prev[comment.id]
            }))}
            onSelect={(emoji) => onAddEmoji(emoji, comment.id)}
          />
          <div className="flex gap-2">
            <input
              value={replyDrafts[comment.id]}
              onChange={(e) => setReplyDrafts(prev => ({
                ...prev,
                [comment.id]: e.target.value
              }))}
              placeholder="Write reply..."
              className="flex-1 p-2 border rounded"
            />
            <button
              onClick={() => onCreateComment(comment.id, anonymousReply[comment.id] || false)}
              className="px-3 py-2 rounded bg-indigo-600 text-white"
            >
              Send
            </button>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer mt-1 select-none">
            <input
              type="checkbox"
              checked={anonymousReply[comment.id] || false}
              onChange={(e) => setAnonymousReply(prev => ({
                ...prev,
                [comment.id]: e.target.checked
              }))}
              className="rounded"
            />
            Reply anonymously
          </label>
        </div>
      )}

      {/* Nested replies */}
      {comment.replies?.length > 0 && (
        <div className="mt-3 space-y-2">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              user={user}
              isAuthenticated={isAuthenticated}
              replyDrafts={replyDrafts}
              setReplyDrafts={setReplyDrafts}
              anonymousReply={anonymousReply}
              setAnonymousReply={setAnonymousReply}
              showReplyEmojiPicker={showReplyEmojiPicker}
              setShowReplyEmojiPicker={setShowReplyEmojiPicker}
              onCreateComment={onCreateComment}
              onLikeComment={onLikeComment}
              onDeleteComment={onDeleteComment}
              onAddEmoji={onAddEmoji}
            />
          ))}
        </div>
      )}
    </div>
  )
}
