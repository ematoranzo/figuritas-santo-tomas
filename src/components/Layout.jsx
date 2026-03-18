import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, familia, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="logo">
            <img src="/Logo.png" alt="FigurItas Santo Tomás" className="logo-img" />
          </Link>
          <nav className="nav">
            {!user && <>
              <Link to="/login">Ingresar</Link>
              <Link to="/registro" className="btn-primary">Registrarse</Link>
            </>}
            {user && familia?.estado === 'aprobado' && <>
              <Link to="/dashboard">Mis álbumes</Link>
              <Link to="/perfil">Mi perfil</Link>
              {familia?.rol === 'admin' && <Link to="/admin">Panel admin</Link>}
              <button onClick={handleLogout} className="btn-logout">Salir</button>
            </>}
            {user && familia?.estado === 'pendiente' && <>
              <span className="estado-pendiente">⏳ Pendiente de aprobación</span>
              <button onClick={handleLogout} className="btn-logout">Salir</button>
            </>}
          </nav>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <p>Colegio Santo Tomás · Santa Rosa, La Pampa · <Link to="/privacidad">Política de privacidad</Link></p>
      </footer>
    </div>
  )
}