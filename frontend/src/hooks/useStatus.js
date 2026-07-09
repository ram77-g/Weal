import { useToast } from '../context/ToastContext'

/**
 * Compatibility wrapper around the new global useToast hook.
 * Allows existing code calling setStatus({ message, type }) to trigger toasts automatically.
 */
export function useStatus() {
  const { addToast } = useToast()

  const setStatus = ({ message, type }) => {
    if (message) {
      addToast(message, type)
    }
  }

  return { status: { message: '' }, setStatus }
}
