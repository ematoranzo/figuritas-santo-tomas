import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Dashboard from './pages/Dashboard'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsuarios from './pages/admin/AdminUsuarios'
import AdminAlbumes from './pages/admin/AdminAlbumes'
import AdminGrados from './pages/admin/AdminGrados'

function RutaProtegida({ children }) {
  const { user, perfil, loading } = useAuth()
  if (loading) return <div className="loading">Cargando...</div>
  if (!user) return <Navigate to="/login" />
  if (perfil?.estado === 'pendiente') return (
    <div className="pendiente">
      <h2>⏳ Solicitud pendiente</h2>
      <p>Tu registro está siendo revisado por la administradora. Te avisaremos por email cuando esté aprobado.</p>
    </div>
  )
  if (perfil?.estado !== 'aprobado') return <Navigate to="/login" />
  return children
}

function RutaAdmin({ children }) {
  const { user, perfil, loading } = useAuth()
  if (loading) return <div className="loading">Cargando...</div>
  if (!user || perfil?.rol !== 'admin') return <Navigate to="/" />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="registro" element={<Registro />} />
        <Route path="dashboard" element={<RutaProtegida><Dashboard /></RutaProtegida>} />
      </Route>
      <Route path="/admin" element={<RutaAdmin><AdminLayout /></RutaAdmin>}>
        <Route index element={<AdminDashboard />} />
        <Route path="usuarios" element={<AdminUsuarios />} />
        <Route path="albumes" element={<AdminAlbumes />} />
        <Route path="grados" element={<AdminGrados />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-center" />
      </BrowserRouter>
    </AuthProvider>
  )
}