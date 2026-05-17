import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import ResultadoCoincidencia from './ResultadoCoincidencia'

export default function Coincidencias() {
  const { albumId, alumnoId } = useParams()
  const { familia } = useAuth()
  const navigate = useNavigate()
  const [album, setAlbum] = useState(null)
  const [alumno, setAlumno] = useState(null)
  const [resultados, setResultados] = useState([])
  const [cargando, setCargando] = useState(true)

  const cargarDatos = useCallback(async () => {
    setCargando(true)

    try {
      const [{ data: albumData }, { data: alumnoData }] = await Promise.all([
        supabase.from('album').select('*').eq('id', albumId).single(),
        supabase.from('alumno').select('*, grado_sala(descripcion)').eq('id', alumnoId).single(),
      ])
      setAlbum(albumData)
      setAlumno(alumnoData)

      // Llamar a la función SQL bidireccional
      const { data: coincidencias, error } = await supabase
        .rpc('buscar_coincidencias_v2', {
          p_alumno_id: alumnoId,
          p_album_id: albumId
        })

      console.log('✅ Coincidencias totales:', coincidencias?.length || 0, error)

      if (error || !coincidencias || coincidencias.length === 0) {
        setResultados([])
        return
      }

      // Agrupar por alumno y dirección
      const porAlumno = {}
      for (const c of coincidencias) {
        if (!porAlumno[c.id_alumno]) {
          porAlumno[c.id_alumno] = { elTieneYAMiFaltan: [], aElLeFaltanYYoTengo: [] }
        }
        if (c.direccion === 'naranja') {
          porAlumno[c.id_alumno].elTieneYAMiFaltan.push(String(c.numero_figurita))
        } else if (c.direccion === 'azul') {
          porAlumno[c.id_alumno].aElLeFaltanYYoTengo.push(String(c.numero_figurita))
        }
      }

      const idsConCoincidencias = Object.keys(porAlumno)

      // Obtener datos de alumnos
      const { data: alumnosData } = await supabase
        .from('alumno')
        .select('id, nombre, apellido, grado_sala(descripcion), id_familia')
        .in('id', idsConCoincidencias)
        .eq('activo', true)

      if (!alumnosData || alumnosData.length === 0) {
        setResultados([])
        return
      }

      // Obtener familias aprobadas
      const idsFamilias = [...new Set(alumnosData.map(a => a.id_familia))]
      const { data: familiasData } = await supabase
        .from('familia')
        .select('id, nombre_adulto, apellido_adulto, email_adulto, estado')
        .in('id', idsFamilias)
        .eq('estado', 'aprobado')

      if (!familiasData || familiasData.length === 0) {
        setResultados([])
        return
      }

      const familiasMap = {}
      for (const f of familiasData) familiasMap[f.id] = f

      // Armar resultados finales
      const resultadosFinales = []

      for (const alumnoOtro of alumnosData) {
        const familiaOtro = familiasMap[alumnoOtro.id_familia]
        if (!familiaOtro) continue

        const c = porAlumno[alumnoOtro.id]
        if (!c) continue

        resultadosFinales.push({
          alumno: { ...alumnoOtro, familia: familiaOtro },
          figuritasQueTiene: c.elTieneYAMiFaltan,
          figuritasQueTeFantanYYoTengo: c.aElLeFaltanYYoTengo,
          totalCoincidencias: c.elTieneYAMiFaltan.length + c.aElLeFaltanYYoTengo.length
        })
      }

      resultadosFinales.sort((a, b) => b.totalCoincidencias - a.totalCoincidencias)
      console.log('✅ Resultados finales:', resultadosFinales.length)
      setResultados(resultadosFinales)

    } catch (err) {
      console.error('❌ Error general:', err)
      toast.error('Error al cargar coincidencias')
    } finally {
      setCargando(false)
    }
  }, [albumId, alumnoId])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  if (cargando) return <div className="loading">Buscando coincidencias...</div>

  return (
    <div className="coincidencias-page">
      <div className="coincidencias-header">
        <button onClick={() => navigate(`/album/${albumId}/alumno/${alumnoId}`)} className="btn-volver">← Volver</button>
        <div>
          <h1>🔍 Coincidencias</h1>
          <p>{alumno?.nombre} {alumno?.apellido} · {album?.nombre}</p>
        </div>
      </div>

      {resultados.length === 0 ? (
        <div className="coincidencias-empty">
          <span className="empty-icon">🔍</span>
          <h2>Sin coincidencias por ahora</h2>
          <p>No hay otros alumnos con las figuritas que te faltan como repetidas todavía.</p>
          <p>¡Volvé a revisar cuando más familias carguen sus figuritas!</p>
        </div>
      ) : (
        <>
          <p className="coincidencias-intro">
            Se encontraron <strong>{resultados.length} alumno{resultados.length !== 1 ? 's' : ''}</strong> con figuritas para intercambiar, ordenados por mayor cantidad de coincidencias.
          </p>
          <div className="resultados-lista">
            {resultados.map((r, i) => (
              <ResultadoCoincidencia
                key={r.alumno.id}
                resultado={r}
                posicion={i + 1}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
