import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    pendientes: 0, aprobados: 0, albumes: 0, noticias: 0
  })

  useEffect(() => {
    async function cargarStats() {
      const [pendientes, aprobados, albumes] = await Promise.all([
        supabase.from('usuario').select('id', { count: 'exact' }).eq('estado', 'pendiente'),
        supabase.from('usuario').select('id', { count: 'exact' }).eq('estado', 'aprobado'),
        supabase.from('album').select('id', { count: 'exact' }).eq('estado', 'activo'),
      ])
      setStats({
        pendientes: pendientes.count || 0,
        aprobados: aprobados.count || 0,
        albumes: albumes.count || 0,
      })
    }
    cargarStats()
  }, [])

  return (
    <div className="admin-page">
      <h1 className="admin-title">Panel de administración</h1>
      <p className="admin-subtitle">Bienvenida al panel de FigurItas Santo Tomás</p>

      <div className="admin-stats">
        <div className="stat-card stat-warning">
          <div className="stat-num">{stats.pendientes}</div>
          <div className="stat-label">Solicitudes pendientes</div>
          <Link to="/admin/usuarios?filtro=pendiente" className="stat-link">Ver →</Link>
        </div>
        <div className="stat-card stat-success">
          <div className="stat-num">{stats.aprobados}</div>
          <div className="stat-label">Usuarios aprobados</div>
          <Link to="/admin/usuarios" className="stat-link">Ver →</Link>
        </div>
        <div className="stat-card stat-primary">
          <div className="stat-num">{stats.albumes}</div>
          <div className="stat-label">Álbumes activos</div>
          <Link to="/admin/albumes" className="stat-link">Ver →</Link>
        </div>
      </div>

      <div className="admin-accesos">
        <h2>Accesos rápidos</h2>
        <div className="admin-accesos-grid">
          <Link to="/admin/usuarios?filtro=pendiente" className="acceso-card">
            <span>👥</span>
            <div>
              <strong>Aprobar usuarios</strong>
              <p>Revisá las solicitudes pendientes</p>
            </div>
          </Link>
          <Link to="/admin/albumes" className="acceso-card">
            <span>📚</span>
            <div>
              <strong>Gestionar álbumes</strong>
              <p>Creá y administrá los álbumes</p>
            </div>
          </Link>
          <Link to="/admin/grados" className="acceso-card">
            <span>🏫</span>
            <div>
              <strong>Grados y salas</strong>
              <p>Administrá el catálogo de cursos</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}