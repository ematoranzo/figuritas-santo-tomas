import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import PanelVisual from './PanelVisual'
import CargaManual from './CargaManual'
import ExportarPlanilla from './ExportarPlanilla'
import ImportarPlanilla from './ImportarPlanilla'

export default function AlbumDetalle() {
  const { albumId, alumnoId } = useParams()
  const { familia } = useAuth()
  const navigate = useNavigate()
  const [album, setAlbum] = useState(null)
  const [alumno, setAlumno] = useState(null)
  const [figuritas, setFiguritas] = useState({})
  const [modo, setModo] = useState('repetida')
  const [guardando, setGuardando] = useState(false)
  const [cambiosPendientes, setCambiosPendientes] = useState({})
  const [mostrarExportar, setMostrarExportar] = useState(false)
  const [mostrarImportar, setMostrarImportar] = useState(false)
  const [albumAlumno, setAlbumAlumno] = useState(null)
  const [completando, setCompletando] = useState(false)
  const [reactivando, setReactivando] = useState(false)

  useEffect(() => { cargarDatos() }, [albumId, alumnoId])

  async function cargarDatos() {
    const [{ data: albumData }, { data: alumnoData }, { data: figuritasData }] = await Promise.all([
      supabase.from('album').select('*').eq('id', albumId).single(),
      supabase.from('alumno').select('*, grado_sala(descripcion)').eq('id', alumnoId).single(),
      supabase.from('figurita_alumno').select('*').eq('id_alumno', alumnoId).eq('id_album', albumId)
    ])
    setAlbum(albumData)
    setAlumno(alumnoData)
    const mapa = {}
    figuritasData?.forEach(f => { mapa[f.numero_figurita] = f.estado })
    setFiguritas(mapa)

    const { data: aaData } = await supabase
      .from('album_alumno')
      .select('*')
      .eq('id_alumno', alumnoId)
      .eq('id_album', albumId)
      .single()

    if (!aaData) {
      const { data: nuevo } = await supabase
        .from('album_alumno')
        .insert({ id_alumno: alumnoId, id_album: albumId, estado: 'en_progreso' })
        .select()
        .single()
      setAlbumAlumno(nuevo)
    } else {
      setAlbumAlumno(aaData)
    }
  }

  function toggleFigurita(n) {
    const estadoActual = figuritas[n]
    const estadoOpuesto = modo === 'faltante' ? 'repetida' : 'faltante'

    // Si álbum completado, solo permitir repetidas
    if (yaCompletado && modo === 'faltante') {
      toast.error('El álbum está completado. Solo podés marcar repetidas.')
      return
    }

    if (estadoActual === estadoOpuesto) {
      toast.error(`La figurita ${n} ya está como ${estadoOpuesto}`)
      return
    }
    const nuevoEstado = estadoActual === modo ? null : modo
    const nuevasFiguritas = { ...figuritas }
    if (nuevoEstado === null) delete nuevasFiguritas[n]
    else nuevasFiguritas[n] = nuevoEstado
    setFiguritas(nuevasFiguritas)
    setCambiosPendientes(prev => ({ ...prev, [n]: nuevoEstado }))
  }

  function agregarLista(numeros) {
    const nuevasFiguritas = { ...figuritas }
    const nuevosCambios = { ...cambiosPendientes }
    numeros.forEach(n => {
      nuevasFiguritas[n] = modo
      nuevosCambios[n] = modo
    })
    setFiguritas(nuevasFiguritas)
    setCambiosPendientes(nuevosCambios)
  }

  async function guardar() {
    if (Object.keys(cambiosPendientes).length === 0) {
      toast('No hay cambios para guardar')
      return
    }
    setGuardando(true)
    try {
      for (const [num, estado] of Object.entries(cambiosPendientes)) {
        const n = parseInt(num)
        if (estado === null) {
          await supabase.from('figurita_alumno')
            .delete()
            .eq('id_alumno', alumnoId)
            .eq('id_album', albumId)
            .eq('numero_figurita', n)
        } else {
          await supabase.from('figurita_alumno')
            .upsert({
              id_alumno: alumnoId,
              id_album: albumId,
              numero_figurita: n,
              estado,
              cantidad: 1,
              fecha_actualizacion: new Date().toISOString()
            }, { onConflict: 'id_alumno,id_album,numero_figurita' })
        }
      }
      setCambiosPendientes({})
      toast.success('¡Cambios guardados!')
    } catch (err) {
      toast.error('Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  async function marcarCompletado() {
    if (faltantes > 0) {
      toast.error('Todavía tenés figuritas faltantes pendientes')
      return
    }
    if (!confirm('¿Confirmás que completaste el álbum? 🎉')) return

    setCompletando(true)
    try {
      const fechaCompletado = new Date().toISOString()

      await supabase.from('album_alumno')
        .update({ estado: 'completado', fecha_completado: fechaCompletado })
        .eq('id_alumno', alumnoId)
        .eq('id_album', albumId)

      await supabase.from('noticia').insert({
        titulo: `🎉 ¡${alumno.nombre} ${alumno.apellido} completó el álbum ${album.nombre}!`,
        resumen: `${alumno.nombre} ${alumno.apellido} de ${alumno.grado_sala?.descripcion} completó el álbum ${album.nombre}. ¡Felicitaciones!`,
        contenido: `¡Felicitaciones a ${alumno.nombre} ${alumno.apellido} de ${alumno.grado_sala?.descripcion} por completar el álbum ${album.nombre}! Un logro increíble. 🎴🏆`,
        estado: 'borrador',
        origen: 'automatica',
        id_alumno_ref: alumnoId,
        id_album_ref: albumId,
        fecha_publicacion: fechaCompletado
      })

      setAlbumAlumno(prev => ({ ...prev, estado: 'completado', fecha_completado: fechaCompletado }))
      setModo('repetida')
      toast.success('¡Felicitaciones! Álbum completado 🏆')
    } catch (err) {
      toast.error('Error al completar el álbum')
    } finally {
      setCompletando(false)
    }
  }

  async function reactivarAlbum() {
    if (!confirm('¿Querés reactivar el álbum? Se borrará la noticia de felicitación y podrás volver a marcar faltantes.')) return

    setReactivando(true)
    try {
      // Reactivar album_alumno
      await supabase.from('album_alumno')
        .update({ estado: 'en_progreso', fecha_completado: null })
        .eq('id_alumno', alumnoId)
        .eq('id_album', albumId)

      // Borrar noticia automática asociada
      await supabase.from('noticia')
        .delete()
        .eq('id_alumno_ref', alumnoId)
        .eq('id_album_ref', albumId)
        .eq('origen', 'automatica')
        .eq('estado', 'borrador')

      setAlbumAlumno(prev => ({ ...prev, estado: 'en_progreso', fecha_completado: null }))
      setModo('faltante')
      toast.success('Álbum reactivado — podés seguir marcando figuritas')
    } catch (err) {
      toast.error('Error al reactivar el álbum')
    } finally {
      setReactivando(false)
    }
  }

  if (!album || !alumno) return <div className="loading">Cargando...</div>

  const faltantes = Object.values(figuritas).filter(e => e === 'faltante').length
  const repetidas = Object.values(figuritas).filter(e => e === 'repetida').length
  const tieneCambios = Object.keys(cambiosPendientes).length > 0
  const yaCompletado = albumAlumno?.estado === 'completado'

  return (
    <div className="album-detalle">
      <div className="album-detalle-header">
        <button onClick={() => navigate('/dashboard')} className="btn-volver">← Volver</button>
        <div>
          <h1>{album.nombre}</h1>
          <p>{alumno.nombre} {alumno.apellido} · {alumno.grado_sala?.descripcion}</p>
        </div>
        {yaCompletado && (
          <div className="album-completado-badge">🏆 Completado</div>
        )}
      </div>

      <div className="album-resumen">
        <div className="resumen-item">
          <span className="resumen-num">{album.cantidad_total}</span>
          <span className="resumen-label">Total</span>
        </div>
        <div className="resumen-item faltante-color">
          <span className="resumen-num">{faltantes}</span>
          <span className="resumen-label">Faltantes</span>
        </div>
        <div className="resumen-item repetida-color">
          <span className="resumen-num">{repetidas}</span>
          <span className="resumen-label">Repetidas</span>
        </div>
        <div className="resumen-item">
          <span className="resumen-num">{album.cantidad_total - faltantes - repetidas}</span>
          <span className="resumen-label">Sin marcar</span>
        </div>
      </div>

      {yaCompletado && (
        <div className="album-completado-msg">
          <span>🏆</span>
          <h2>¡Álbum completado!</h2>
          <p>Completado el {albumAlumno.fecha_completado
            ? new Date(albumAlumno.fecha_completado).toLocaleDateString('es-AR')
            : 'hoy'}
          </p>
          <p style={{ fontSize: '.9rem', opacity: .8, marginTop: 8 }}>
            Podés seguir marcando figuritas repetidas abajo.
          </p>
        </div>
      )}

      <div className="modo-selector">
        <span>Estoy marcando:</span>
        {!yaCompletado && (
          <button onClick={() => setModo('faltante')}
            className={`modo-btn ${modo === 'faltante' ? 'active-faltante' : ''}`}>
            📋 Faltantes
          </button>
        )}
        <button onClick={() => setModo('repetida')}
          className={`modo-btn ${modo === 'repetida' ? 'active-repetida' : ''}`}>
          🔁 Repetidas
        </button>
      </div>

      <PanelVisual
        total={album.cantidad_total}
        figuritas={figuritas}
        modo={modo}
        onToggle={toggleFigurita}
      />

      <CargaManual
        total={album.cantidad_total}
        figuritas={figuritas}
        modo={modo}
        onAgregar={agregarLista}
      />

      <div className="album-acciones">
        <button onClick={() => setMostrarImportar(true)} className="btn-secondary btn-grande">
          📥 Importar
        </button>
        <button onClick={() => setMostrarExportar(true)} className="btn-secondary btn-grande">
          📤 Exportar
        </button>
        <button
          onClick={() => navigate(`/coincidencias/${albumId}/alumno/${alumnoId}`)}
          className="btn-secondary btn-grande"
        >
          🔍 Coincidencias
        </button>
        <button onClick={guardar} className="btn-primary btn-grande" disabled={guardando || !tieneCambios}>
          {guardando ? 'Guardando...' : tieneCambios ? `💾 Guardar (${Object.keys(cambiosPendientes).length})` : '✓ Guardado'}
        </button>

        {!yaCompletado && faltantes === 0 && Object.keys(figuritas).length > 0 && (
          <button
            onClick={marcarCompletado}
            disabled={completando}
            className="btn-completado btn-grande"
          >
            {completando ? 'Guardando...' : '🏆 Marcar como completado'}
          </button>
        )}

        {yaCompletado && (
          <button
            onClick={reactivarAlbum}
            disabled={reactivando}
            className="btn-reactivar btn-grande"
          >
            {reactivando ? 'Reactivando...' : '↩ Reactivar álbum'}
          </button>
        )}
      </div>

      {mostrarExportar && (
        <ExportarPlanilla
          alumnoId={alumnoId}
          alumnoNombre={`${alumno.nombre} ${alumno.apellido}`}
          albumId={albumId}
          albumNombre={album.nombre}
          onCerrar={() => setMostrarExportar(false)}
        />
      )}

      {mostrarImportar && (
        <ImportarPlanilla
          alumnoId={alumnoId}
          albumId={albumId}
          albumNombre={album.nombre}
          cantidadTotal={album.cantidad_total}
          onCerrar={() => setMostrarImportar(false)}
          onImportado={cargarDatos}
        />
      )}
    </div>
  )
}