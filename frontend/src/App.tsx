import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
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
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/links"
          element={
            <ProtectedRoute>
              <MyLinks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/links/:id"
          element={
            <ProtectedRoute>
              <LinkAnalytics />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
