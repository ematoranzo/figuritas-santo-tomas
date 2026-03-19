import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminLayout() {
  const { perfil, familia, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const links = [
    { to: '/admin', label: '🏠 Inicio', exact: true },
    { to: '/admin/usuarios', label: '👨‍👩‍👧‍👦 Familias' },
    { to: '/admin/albumes', label: '📚 Álbumes' },
    { to: '/admin/grados', label: '🏫 Grados y salas' },
    { to: '/admin/noticias', label: '📰 Noticias' },
  ]

  return (
    <div className="admin-wrapper">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span>🎴</span>
          <div>
            <div className="admin-brand-title">FigurItas</div>
            <div className="admin-brand-sub">Panel Admin</div>
          </div>
        </div>
        <nav className="admin-nav">
          {links.map(l => {
            const active = l.exact
              ? location.pathname === l.to
              : location.pathname.startsWith(l.to)
            return (
              <Link key={l.to} to={l.to} className={`admin-nav-link ${active ? 'active' : ''}`}>
                {l.label}
              </Link>
            )
          })}
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-user">
            <div className="admin-user-name">{familia?.nombre_adulto}</div>
            <div className="admin-user-role">Administradora</div>
          </div>
          <button onClick={handleLogout} className="admin-logout">Salir</button>
        </div>
      </aside>
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  )
}