import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [albumesStats, setAlbumesStats] = useState([])
  const [gradosStats, setGradosStats] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargarTodo() }, [])

  async function cargarTodo() {
    setCargando(true)

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const hoyISO = hoy.toISOString()

    const [
      pendientes, aprobados, rechazados, inactivos,
      alumnos, albumesActivos,
      completados, emailsTotal, emailsHoy,
      noticiasPublicadas, figuritasTotal
    ] = await Promise.all([
      supabase.from('familia').select('id', { count: 'exact' }).eq('estado', 'pendiente'),
      supabase.from('familia').select('id', { count: 'exact' }).eq('estado', 'aprobado'),
      supabase.from('familia').select('id', { count: 'exact' }).eq('estado', 'rechazado'),
      supabase.from('familia').select('id', { count: 'exact' }).eq('estado', 'inactivo'),
      supabase.from('alumno').select('id', { count: 'exact' }).eq('activo', true),
      supabase.from('album').select('id', { count: 'exact' }).eq('estado', 'activo'),
      supabase.from('album_alumno').select('id', { count: 'exact' }).eq('estado', 'completado'),
      supabase.from('envio_mail').select('id', { count: 'exact' }),
      supabase.from('envio_mail').select('id', { count: 'exact' }).gte('fecha_envio', hoyISO),
      supabase.from('noticia').select('id', { count: 'exact' }).eq('estado', 'publicada'),
      supabase.from('figurita_alumno').select('id', { count: 'exact' }),
    ])

    setStats({
      pendientes: pendientes.count || 0,
      aprobados: aprobados.count || 0,
      rechazados: rechazados.count || 0,
      inactivos: inactivos.count || 0,
      alumnos: alumnos.count || 0,
      albumesActivos: albumesActivos.count || 0,
      completados: completados.count || 0,
      emailsTotal: emailsTotal.count || 0,
      emailsHoy: emailsHoy.count || 0,
      noticiasPublicadas: noticiasPublicadas.count || 0,
      figuritasTotal: figuritasTotal.count || 0,
    })

    // Estadísticas por álbum
    const { data: albumes } = await supabase
      .from('album')
      .select('id, nombre, cantidad_total, estado')
      .neq('estado', 'baja')
      .order('nombre')

    if (albumes && albumes.length > 0) {
      const { data: albumAlumnoData } = await supabase
        .from('album_alumno')
        .select('id_album, estado')

      const albumStats = albumes.map(album => {
        const registros = (albumAlumnoData || []).filter(aa => aa.id_album === album.id)
        const enProgreso = registros.filter(aa => aa.estado === 'en_progreso').length
        const completados = registros.filter(aa => aa.estado === 'completado').length
        return {
          ...album,
          participantes: registros.length,
          enProgreso,
          completados,
        }
      })
      setAlbumesStats(albumStats)
    }

    // Estadísticas por grado/sala
    const { data: alumnosConGrado } = await supabase
      .from('alumno')
      .select('id, id_grado_sala, grado_sala(descripcion, nivel)')
      .eq('activo', true)

    const { data: completadosData } = await supabase
      .from('album_alumno')
      .select('id_alumno')
      .eq('estado', 'completado')

    const alumnosCompletaron = new Set((completadosData || []).map(c => c.id_alumno))

    if (alumnosConGrado) {
      const gradoMap = {}
      alumnosConGrado.forEach(a => {
        const gradoId = a.id_grado_sala || 'sin_grado'
        const desc = a.grado_sala?.descripcion || 'Sin grado'
        const nivel = a.grado_sala?.nivel || ''
        if (!gradoMap[gradoId]) {
          gradoMap[gradoId] = { descripcion: desc, nivel, total: 0, completaron: 0 }
        }
        gradoMap[gradoId].total++
        if (alumnosCompletaron.has(a.id)) gradoMap[gradoId].completaron++
      })

      const gradosArray = Object.values(gradoMap).sort((a, b) => {
        if (a.nivel !== b.nivel) return a.nivel.localeCompare(b.nivel)
        return a.descripcion.localeCompare(b.descripcion)
      })
      setGradosStats(gradosArray)
    }

    setCargando(false)
  }

  if (cargando || !stats) return <div className="admin-loading">Cargando estadísticas...</div>

  const totalFamilias = stats.aprobados + stats.pendientes + stats.rechazados + stats.inactivos

  return (
    <div className="admin-page">
      <h1 className="admin-title">Panel de administración</h1>
      <p className="admin-subtitle">Resumen general de FigurItas Santo Tomás</p>

      {/* ── Familias y alumnos ── */}
      <div className="admin-stats">
        <div className="stat-card stat-warning">
          <div className="stat-num">{stats.pendientes}</div>
          <div className="stat-label">Familias pendientes</div>
          <Link to="/admin/usuarios?filtro=pendiente" className="stat-link">Ver →</Link>
        </div>
        <div className="stat-card stat-success">
          <div className="stat-num">{stats.aprobados}</div>
          <div className="stat-label">Familias aprobadas</div>
          <Link to="/admin/usuarios" className="stat-link">Ver →</Link>
        </div>
        <div className="stat-card stat-primary">
          <div className="stat-num">{stats.alumnos}</div>
          <div className="stat-label">Alumnos registrados</div>
          <Link to="/admin/usuarios" className="stat-link">Ver →</Link>
        </div>
        <div className="stat-card" style={{ borderTopColor: '#8e44ad' }}>
          <div className="stat-num">{totalFamilias}</div>
          <div className="stat-label">Familias totales</div>
          <Link to="/admin/usuarios" className="stat-link">Ver →</Link>
        </div>
      </div>

      {/* ── Actividad ── */}
      <div className="admin-stats">
        <div className="stat-card" style={{ borderTopColor: '#c9a227' }}>
          <div className="stat-num">{stats.albumesActivos}</div>
          <div className="stat-label">Álbumes activos</div>
          <Link to="/admin/albumes" className="stat-link">Ver →</Link>
        </div>
        <div className="stat-card" style={{ borderTopColor: '#c9a227' }}>
          <div className="stat-num">{stats.completados}</div>
          <div className="stat-label">Álbumes completados</div>
          <Link to="/admin/albumes" className="stat-link">Ver →</Link>
        </div>
        <div className="stat-card" style={{ borderTopColor: '#2980b9' }}>
          <div className="stat-num">{stats.emailsHoy}</div>
          <div className="stat-label">Emails hoy</div>
        </div>
        <div className="stat-card" style={{ borderTopColor: '#2980b9' }}>
          <div className="stat-num">{stats.emailsTotal}</div>
          <div className="stat-label">Emails totales</div>
        </div>
      </div>

      <div className="admin-stats">
        <div className="stat-card" style={{ borderTopColor: '#e67e22' }}>
          <div className="stat-num">{stats.figuritasTotal.toLocaleString('es-AR')}</div>
          <div className="stat-label">Figuritas cargadas</div>
        </div>
        <div className="stat-card" style={{ borderTopColor: '#27ae60' }}>
          <div className="stat-num">{stats.noticiasPublicadas}</div>
          <div className="stat-label">Noticias publicadas</div>
          <Link to="/admin/noticias" className="stat-link">Ver →</Link>
        </div>
      </div>

      {/* ── Ranking por álbum ── */}
      {albumesStats.length > 0 && (
        <div className="admin-card">
          <h2>📚 Actividad por álbum</h2>
          <div className="tabla-wrapper">
            <table className="admin-tabla">
              <thead>
                <tr>
                  <th>Álbum</th>
                  <th>Estado</th>
                  <th>Figuritas</th>
                  <th>Participantes</th>
                  <th>En progreso</th>
                  <th>Completaron</th>
                </tr>
              </thead>
              <tbody>
                {albumesStats.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600, color: '#1a4a2e' }}>{a.nombre}</td>
                    <td>
                      <span className="estado-badge" style={{ background: a.estado === 'activo' ? '#27ae60' : '#95a5a6' }}>
                        {a.estado}
                      </span>
                    </td>
                    <td>{a.cantidad_total}</td>
                    <td>{a.participantes}</td>
                    <td>{a.enProgreso}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: a.completados > 0 ? '#c9a227' : '#aaa' }}>
                        {a.completados > 0 ? `🏆 ${a.completados}` : '0'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Alumnos por grado/sala ── */}
      {gradosStats.length > 0 && (
        <div className="admin-card">
          <h2>🏫 Alumnos por grado/sala</h2>
          <div className="tabla-wrapper">
            <table className="admin-tabla">
              <thead>
                <tr>
                  <th>Grado/Sala</th>
                  <th>Nivel</th>
                  <th>Alumnos</th>
                  <th>Completaron algún álbum</th>
                </tr>
              </thead>
              <tbody>
                {gradosStats.map((g, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: '#1a4a2e' }}>{g.descripcion}</td>
                    <td>{g.nivel || '—'}</td>
                    <td>{g.total}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: g.completaron > 0 ? '#c9a227' : '#aaa' }}>
                        {g.completaron > 0 ? `🏆 ${g.completaron}` : '0'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Accesos rápidos ── */}
      <div className="admin-accesos">
        <h2>Accesos rápidos</h2>
        <div className="admin-accesos-grid">
          <Link to="/admin/usuarios?filtro=pendiente" className="acceso-card">
            <span>👨‍👩‍👧‍👦</span>
            <div>
              <strong>Aprobar familias</strong>
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
          <Link to="/admin/noticias" className="acceso-card">
            <span>📰</span>
            <div>
              <strong>Noticias</strong>
              <p>Publicá novedades y felicitaciones</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}