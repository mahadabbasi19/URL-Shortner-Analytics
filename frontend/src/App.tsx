import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { PublicLayout } from './components/layout/PublicLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Dashboard } from './pages/Dashboard'
import { Landing } from './pages/Landing'
import { LinkAnalytics } from './pages/LinkAnalytics'
import { Login } from './pages/Login'
import { MyLinks } from './pages/MyLinks'
import { Register } from './pages/Register'

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/links" element={<MyLinks />} />
        <Route path="/links/:id" element={<LinkAnalytics />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
