import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { familia, alumnos } = useAuth()
  const [albumes, setAlbumes] = useState([])

  useEffect(() => {
    supabase.from('album')
      .select('*')
      .eq('estado', 'activo')
      .order('nombre')
      .then(({ data }) => setAlbumes(data || []))
  }, [])

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
    </div>
  )
}