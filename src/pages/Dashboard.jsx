import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { familia, alumnos } = useAuth()
  const [albumes, setAlbumes] = useState([])
  const [noticias, setNoticias] = useState([])

  useEffect(() => {
    supabase.from('album')
      .select('*')
      .eq('estado', 'activo')
      .order('nombre')
      .then(({ data }) => setAlbumes(data || []))

    // Noticias manuales + felicitaciones publicadas
    supabase.from('noticia')
      .select('*')
      .eq('estado', 'publicada')
      .order('fecha_publicacion', { ascending: false })
      .limit(20)
      .then(({ data }) => setNoticias(data || []))
  }, [])

  const noticiasМanuales = noticias.filter(n => n.origen === 'manual')
  const felicitaciones = noticias.filter(n => n.origen === 'automatica')

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>¡Hola, familia {familia?.apellido_adulto}! 👋</h1>
        <p>{familia?.nombre_adulto} {familia?.apellido_adulto}</p>
      </div>

      {albumes.length === 0 ? (
        <div className="dashboard-empty">
          <span className="empty-icon">🎴</span>
          <h2>Todavía no hay álbumes activos</h2>
          <p>Cuando la administradora publique un álbum, aparecerá acá.</p>
        </div>
      ) : (
        <div className="alumnos-dashboard">
          {alumnos.map(alumno => (
            <div key={alumno.id} className="alumno-dashboard-card">
              <div className="alumno-dashboard-header">
                <div>
                  <h2>{alumno.nombre} {alumno.apellido}</h2>
                  <p>{alumno.grado_sala?.descripcion} · {alumno.grado_sala?.nivel}</p>
                </div>
                <span className="alumno-icon">🎒</span>
              </div>
              <div className="albumes-alumno">
                {albumes.map(album => (
                  <Link
                    key={album.id}
                    to={`/album/${album.id}/alumno/${alumno.id}`}
                    className="album-card-link"
                  >
                    <div className="album-card">
                      {album.imagen_portada
                        ? <img src={album.imagen_portada} alt={album.nombre} className="album-portada" />
                        : <div className="album-portada-placeholder">🎴</div>
                      }
                      <div className="album-card-info">
                        <h3>{album.nombre}</h3>
                        <p>{album.cantidad_total} figuritas</p>
                      </div>
                      <span className="album-card-arrow">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {felicitaciones.length > 0 && (
        <section className="noticias" style={{ marginTop: 40 }}>
          <h2>🏆 Felicitaciones</h2>
          <div className="feed-noticias">
            {felicitaciones.map(n => (
              <div key={n.id} className="feed-noticia-card felicitacion-card">
                <div className="feed-noticia-body">
                  <h3>{n.titulo}</h3>
                  {n.resumen && <p>{n.resumen}</p>}
                  {n.fecha_publicacion && (
                    <span className="feed-noticia-fecha">
                      {new Date(n.fecha_publicacion).toLocaleDateString('es-AR')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {noticiasМanuales.length > 0 && (
        <section className="noticias" style={{ marginTop: 40 }}>
          <h2>📰 Novedades</h2>
          <div className="feed-noticias">
            {noticiasМanuales.map(n => (
              <div key={n.id} className={`feed-noticia-card ${n.destacada ? 'destacada' : ''}`}>
                {n.imagen && <img src={n.imagen} alt={n.titulo} className="feed-noticia-img" />}
                <div className="feed-noticia-body">
                  {n.destacada && <span className="feed-destacada-badge">⭐ Destacada</span>}
                  <h3>{n.titulo}</h3>
                  {n.resumen && <p>{n.resumen}</p>}
                  {n.fecha_publicacion && (
                    <span className="feed-noticia-fecha">
                      {new Date(n.fecha_publicacion).toLocaleDateString('es-AR')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}