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
  const [modo, setModo] = useState('faltante')
  const [guardando, setGuardando] = useState(false)
  const [cambiosPendientes, setCambiosPendientes] = useState({})
  const [mostrarExportar, setMostrarExportar] = useState(false)
  const [mostrarImportar, setMostrarImportar] = useState(false)

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
  }

  function toggleFigurita(n) {
    const estadoActual = figuritas[n]
    const estadoOpuesto = modo === 'faltante' ? 'repetida' : 'faltante'
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

  if (!album || !alumno) return <div className="loading">Cargando...</div>

  const faltantes = Object.values(figuritas).filter(e => e === 'faltante').length
  const repetidas = Object.values(figuritas).filter(e => e === 'repetida').length
  const tieneCambios = Object.keys(cambiosPendientes).length > 0

  return (
    <div className="album-detalle">
      <div className="album-detalle-header">
        <button onClick={() => navigate('/dashboard')} className="btn-volver">← Volver</button>
        <div>
          <h1>{album.nombre}</h1>
          <p>{alumno.nombre} {alumno.apellido} · {alumno.grado_sala?.descripcion}</p>
        </div>
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

      <div className="modo-selector">
        <span>Estoy marcando:</span>
        <button onClick={() => setModo('faltante')}
          className={`modo-btn ${modo === 'faltante' ? 'active-faltante' : ''}`}>
          📋 Faltantes
        </button>
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
        <button
          onClick={() => setMostrarImportar(true)}
          className="btn-secondary btn-grande"
        >
          📥 Importar planilla
        </button>
        <button
          onClick={() => setMostrarExportar(true)}
          className="btn-secondary btn-grande"
        >
          📤 Exportar planilla
        </button>
        <button
          onClick={() => navigate(`/coincidencias/${albumId}/alumno/${alumnoId}`)}
          className="btn-secondary btn-grande"
        >
          🔍 Buscar coincidencias
        </button>
        <button onClick={guardar} className="btn-primary btn-grande" disabled={guardando || !tieneCambios}>
          {guardando ? 'Guardando...' : tieneCambios ? `💾 Guardar cambios (${Object.keys(cambiosPendientes).length})` : '✓ Todo guardado'}
        </button>
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