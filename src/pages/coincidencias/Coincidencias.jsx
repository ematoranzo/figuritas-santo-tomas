import { useEffect, useState } from 'react'
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

  useEffect(() => { cargarDatos() }, [albumId, alumnoId])

  async function cargarDatos() {
    setCargando(true)

    try {
      const [{ data: albumData }, { data: alumnoData }] = await Promise.all([
        supabase.from('album').select('*').eq('id', albumId).single(),
        supabase.from('alumno').select('*, grado_sala(descripcion)').eq('id', alumnoId).single(),
      ])
      setAlbum(albumData)
      setAlumno(alumnoData)

      // Obtener mis faltantes
      const { data: misFaltantes } = await supabase
        .from('figurita_alumno')
        .select('numero_figurita')
        .eq('id_alumno', alumnoId)
        .eq('id_album', albumId)
        .eq('estado', 'faltante')

      console.log('✅ Mis faltantes:', misFaltantes?.length || 0)

      if (!misFaltantes || misFaltantes.length === 0) {
        setCargando(false)
        setResultados([])
        return
      }

      // Buscar coincidencias (function SQL SECURITY DEFINER)
      const { data: repetidas, error } = await supabase
        .rpc('buscar_coincidencias', {
          p_alumno_id: alumnoId,
          p_album_id: albumId
        })

      console.log('✅ Repetidas encontradas:', repetidas?.length || 0)

      if (error || !repetidas || repetidas.length === 0) {
        setCargando(false)
        setResultados([])
        return
      }

      const idsAlumnos = [...new Set(repetidas.map(r => r.id_alumno))]

      // Obtener datos de alumnos
      const { data: alumnosData } = await supabase
        .from('alumno')
        .select('id, nombre, apellido, grado_sala(descripcion), id_familia')
        .in('id', idsAlumnos)

      if (!alumnosData || alumnosData.length === 0) {
        setCargando(false)
        setResultados([])
        return
      }

      // Obtener datos de familias aprobadas
      const idsFamilias = [...new Set(alumnosData.map(a => a.id_familia))]
      const { data: familiasData } = await supabase
        .from('familia')
        .select('id, nombre_adulto, apellido_adulto, email_adulto, estado')
        .in('id', idsFamilias)
        .eq('estado', 'aprobado')

      if (!familiasData || familiasData.length === 0) {
        setCargando(false)
        setResultados([])
        return
      }

      const alumnosConFamilia = alumnosData.map(a => ({
        ...a,
        familia: familiasData.find(f => f.id === a.id_familia) || null
      }))

      const alumnosAprobados = alumnosConFamilia.filter(a => a.familia !== null)

      // Obtener mis repetidas
      const { data: misRepetidas } = await supabase
        .from('figurita_alumno')
        .select('numero_figurita')
        .eq('id_alumno', alumnoId)
        .eq('id_album', albumId)
        .eq('estado', 'repetida')

      const misRepetidasNums = (misRepetidas || []).map(f => String(f.numero_figurita))

      // Obtener TODAS las faltantes de otros alumnos en una sola query
      const { data: faltantesOtros } = await supabase
        .from('figurita_alumno')
        .select('id_alumno, numero_figurita')
        .eq('id_album', albumId)
        .eq('estado', 'faltante')
        .in('id_alumno', alumnosAprobados.map(a => a.id))

      // Armar resultados finales
      const resultadosFinales = []

      for (const alumnoOtro of alumnosAprobados) {
        const figuritasQueTiene = repetidas
          .filter(r => r.id_alumno === alumnoOtro.id)
          .map(r => String(r.numero_figurita))

        const susFaltantes = (faltantesOtros || [])
          .filter(f => f.id_alumno === alumnoOtro.id)
          .map(f => String(f.numero_figurita))

        const figuritasQueTeFantanYYoTengo = susFaltantes.filter(n => misRepetidasNums.includes(n))

        if (figuritasQueTiene.length > 0 || figuritasQueTeFantanYYoTengo.length > 0) {
          resultadosFinales.push({
            alumno: alumnoOtro,
            figuritasQueTiene,
            figuritasQueTeFantanYYoTengo,
            totalCoincidencias: figuritasQueTiene.length + figuritasQueTeFantanYYoTengo.length
          })
        }
      }

      resultadosFinales.sort((a, b) => b.totalCoincidencias - a.totalCoincidencias)
      setResultados(resultadosFinales)

    } catch (err) {
      console.error('❌ Error general:', err)
      toast.error('Error al cargar coincidencias')
    } finally {
      setCargando(false)
    }
  }

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