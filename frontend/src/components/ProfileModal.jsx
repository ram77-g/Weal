import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

/**
 * Modal for editing user profile (display name and password).
 * Uses AuthContext.updateProfile for the actual API call.
 */
export default function ProfileModal({ isOpen, onClose, setStatus }) {
  const { user, updateProfile } = useAuth()
  const [profileName, setProfileName] = useState(user?.name || '')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {}
      if (profileName.trim() && profileName.trim() !== user?.name) body.name = profileName.trim()
      if (newPw) {
        body.newPassword = newPw
        body.currentPassword = currentPw
      }
      if (Object.keys(body).length === 0) {
        setStatus({ message: 'Nothing changed', type: 'info' })
        return
      }
      await updateProfile(body)
      setCurrentPw('')
      setNewPw('')
      onClose()
      setStatus({ message: 'Profile updated!', type: 'success' })
    } catch (err) {
      setStatus({ message: err.message || 'Failed to update profile', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-xl font-bold mb-1">Your Profile</h3>
        <p className="text-xs text-slate-400 mb-4">{user?.email}</p>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 block mb-1">Display Name</label>
            <input
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full p-3 border rounded dark:bg-slate-700 dark:border-slate-600"
              placeholder="Your name"
            />
          </div>
          <div className="border-t dark:border-slate-700 pt-4">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Change Password</p>
            <div className="space-y-2">
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="w-full p-3 border rounded dark:bg-slate-700 dark:border-slate-600"
                placeholder="Current password"
              />
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="w-full p-3 border rounded dark:bg-slate-700 dark:border-slate-600"
                placeholder="New password (min 6 chars)"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border border-slate-300 dark:border-slate-600 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-indigo-600 text-white text-sm disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
