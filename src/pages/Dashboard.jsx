import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { familia, alumnos } = useAuth()
  const [albumes, setAlbumes] = useState([])
  const [noticias, setNoticias] = useState([])
  const [progreso, setProgreso] = useState({})

  useEffect(() => {
    cargarDatos()
  }, [alumnos])

  async function cargarDatos() {
    const { data: albumesData } = await supabase
      .from('album')
      .select('*')
      .eq('estado', 'activo')
      .order('nombre')
    setAlbumes(albumesData || [])

    const { data: noticiasData } = await supabase
      .from('noticia')
      .select('*')
      .eq('estado', 'publicada')
      .order('fecha_publicacion', { ascending: false })
      .limit(20)
    setNoticias(noticiasData || [])

    if (alumnos.length > 0 && albumesData?.length > 0) {
      const alumnoIds = alumnos.map(a => a.id)

      const [{ data: figuritasData }, { data: albumAlumnoData }] = await Promise.all([
        supabase
          .from('figurita_alumno')
          .select('id_alumno, id_album, estado')
          .in('id_alumno', alumnoIds),
        supabase
          .from('album_alumno')
          .select('id_alumno, id_album, estado')
          .in('id_alumno', alumnoIds)
      ])

      const mapaProgreso = {}
      const mapaEstadoAlbum = {}

      albumAlumnoData?.forEach(aa => {
        mapaEstadoAlbum[`${aa.id_alumno}-${aa.id_album}`] = aa.estado
      })

      const conteoFaltantes = {}
      figuritasData?.forEach(f => {
        const key = `${f.id_alumno}-${f.id_album}`
        if (!conteoFaltantes[key]) conteoFaltantes[key] = 0
        if (f.estado === 'faltante') conteoFaltantes[key]++
      })

      albumesData.forEach(album => {
        alumnos.forEach(alumno => {
          const key = `${alumno.id}-${album.id}`
          const faltantes = conteoFaltantes[key] || 0
          const estadoAlbum = mapaEstadoAlbum[key] || null
          mapaProgreso[key] = {
            faltantes,
            total: album.cantidad_total,
            completado: estadoAlbum === 'completado',
            iniciado: estadoAlbum !== null
          }
        })
      })

      setProgreso(mapaProgreso)
    }
  }

  function getProgresoInfo(alumnoId, albumId) {
    const key = `${alumnoId}-${albumId}`
    const data = progreso[key]
    if (!data || !data.iniciado) return null

    const conseguidas = data.total - data.faltantes
    const porcentaje = data.total > 0 ? Math.round((conseguidas / data.total) * 100) : 0

    return {
      conseguidas,
      faltantes: data.faltantes,
      total: data.total,
      porcentaje,
      completado: data.completado
    }
  }

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
                {albumes.map(album => {
                  const info = getProgresoInfo(alumno.id, album.id)

                  return (
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
                          {info ? (
                            <>
                              <div className="progreso-bar-container">
                                <div
                                  className={`progreso-bar-fill ${info.completado ? 'completado' : ''}`}
                                  style={{ width: `${info.porcentaje}%` }}
                                />
                              </div>
                              <p className={`progreso-texto ${info.completado ? 'completado-texto' : ''}`}>
                                {info.completado
                                  ? '🏆 ¡Completado!'
                                  : `${info.conseguidas}/${info.total} · ${info.porcentaje}%`
                                }
                              </p>
                            </>
                          ) : (
                            <p>{album.cantidad_total} figuritas</p>
                          )}
                        </div>
                        <span className="album-card-arrow">→</span>
                      </div>
                    </Link>
                  )
                })}
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