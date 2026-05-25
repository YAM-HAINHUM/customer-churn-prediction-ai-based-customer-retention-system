import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import AppLayout     from './components/layout/AppLayout'
import Landing       from './pages/Landing'
import Login         from './pages/Login'
import Register      from './pages/Register'
import Dashboard     from './pages/Dashboard'
import Predict       from './pages/Predict'
import History       from './pages/History'
import Insights      from './pages/Insights'
import Settings      from './pages/Settings'
import Profile       from './pages/Profile'
import Upload        from './pages/Upload'
import Admin         from './pages/Admin'
import Simulator     from './pages/Simulator'
import ChatAssistant from './pages/ChatAssistant'
import Segmentation  from './pages/Segmentation'
import Forecast      from './pages/Forecast'

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/app/dashboard" replace /> : children
}

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/"         element={<Landing />} />
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      <Route path="/app" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route index           element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard"    element={<Dashboard />} />
        <Route path="predict"      element={<Predict />} />
        <Route path="simulator"    element={<Simulator />} />
        <Route path="history"      element={<History />} />
        <Route path="analytics"    element={<Insights />} />
        <Route path="segmentation" element={<Segmentation />} />
        <Route path="forecast"     element={<Forecast />} />
        <Route path="upload"       element={<Upload />} />
        <Route path="chat"         element={<ChatAssistant />} />
        <Route path="settings"     element={<Settings />} />
        <Route path="profile"      element={<Profile />} />
        <Route path="admin"        element={<Admin />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
