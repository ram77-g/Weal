const ALL_EMOJIS = [
  '😊','😂','😍','🥺','😢','😭','😤','😡','🤗','😌',
  '👍','👎','❤️','🔥','🤝','💬','🙏','💪','✨','🌟',
  '💙','💜','💚','🧡','💛','🤍','🖤','💔','💞','💯',
  '🌈','🌸','🌻','🍀','🦋','🕊️','🌙','⭐','🎉','🎗️',
  '😔','😞','😓','🥲','😪','😴','🤔','🤯','😶','🫂',
]

/**
 * Reusable emoji picker with expandable grid.
 * Shows 6 emojis by default, expands to show all 50 on toggle.
 */
export default function EmojiPicker({ onSelect, expanded, onToggle, id = '' }) {
  const visibleEmojis = expanded ? ALL_EMOJIS : ALL_EMOJIS.slice(0, 6)

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {visibleEmojis.map((emoji) => (
        <button
          key={id + emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className="px-2 py-1 border rounded text-lg hover:bg-indigo-100 dark:hover:bg-slate-700"
        >
          {emoji}
        </button>
      ))}
      <button
        type="button"
        onClick={onToggle}
        className="px-3 py-1 border rounded text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700"
      >
        {expanded ? 'Less' : 'More'}
      </button>
    </div>
  )
}

export { ALL_EMOJIS }
