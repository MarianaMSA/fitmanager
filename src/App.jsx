import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { Spinner } from './components/UI'
import Splash from './pages/Splash'
import Login from './pages/Login'
import Register from './pages/Register'
import AppShell from './pages/AppShell'
import AcceptInvite from './pages/AcceptInvite'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center' }}><Spinner /></div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center' }}><Spinner /></div>
  if (user) return <Navigate to="/app" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Splash /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/convite" element={<AcceptInvite />} />
      <Route path="/app" element={<ProtectedRoute><AppShell /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-shell">
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
