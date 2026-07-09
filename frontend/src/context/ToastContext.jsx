import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])

    setTimeout(() => {
      removeToast(id)
    }, duration)
  }, [removeToast])

  const success = useCallback((msg, dur) => addToast(msg, 'success', dur), [addToast])
  const error = useCallback((msg, dur) => addToast(msg, 'error', dur), [addToast])
  const info = useCallback((msg, dur) => addToast(msg, 'info', dur), [addToast])
  const warning = useCallback((msg, dur) => addToast(msg, 'warning', dur), [addToast])

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, info, warning, toasts }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => onRemove(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }) {
  const typeStyles = {
    success: {
      bg: 'bg-emerald-50/90 dark:bg-emerald-950/80',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-800 dark:text-emerald-200',
      icon: '✅'
    },
    error: {
      bg: 'bg-rose-50/90 dark:bg-rose-950/80',
      border: 'border-rose-200 dark:border-rose-800',
      text: 'text-rose-800 dark:text-rose-200',
      icon: '❌'
    },
    warning: {
      bg: 'bg-amber-50/90 dark:bg-amber-950/80',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-800 dark:text-amber-200',
      icon: '⚠️'
    },
    info: {
      bg: 'bg-indigo-50/90 dark:bg-indigo-950/80',
      border: 'border-indigo-200 dark:border-indigo-800',
      text: 'text-indigo-800 dark:text-indigo-200',
      icon: 'ℹ️'
    }
  }

  const styles = typeStyles[toast.type] || typeStyles.info

  return (
    <div
      className={`rounded-xl p-4 border shadow-lg flex items-start gap-3 pointer-events-auto backdrop-blur-md transition-all duration-300 transform translate-x-0 animate-slide-in ${styles.bg} ${styles.border} ${styles.text}`}
      role="alert"
    >
      <span className="text-lg leading-none select-none">{styles.icon}</span>
      <div className="flex-1 text-sm font-semibold leading-snug">{toast.message}</div>
      <button
        onClick={onRemove}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors font-bold text-xs select-none shrink-0"
        title="Close"
      >
        ✕
      </button>
    </div>
  )
}
