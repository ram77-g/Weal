import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import AdminPage from './pages/AdminPage'
import ProfilePage from './pages/ProfilePage'
import EventsPage from './pages/EventsPage'
import SetPasswordPage from './pages/SetPasswordPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'

/**
 * Protected route wrapper — redirects to /auth if not authenticated.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/auth" replace />
  if (user && user.hasPassword === false) return <Navigate to="/set-password" replace />
  return children
}

/**
 * Admin route wrapper — redirects to /auth if not admin.
 */
function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/auth" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  if (user && user.hasPassword === false) return <Navigate to="/set-password" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/set-password" element={<SetPasswordPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      {/* Public/Protected Hybrid (logic inside pages) */}
      <Route path="/events" element={<EventsPage />} />

      {/* Catch-all — redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
