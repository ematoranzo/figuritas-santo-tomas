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
  const [emailsEnviados, setEmailsEnviados] = useState(0)

  useEffect(() => { cargarDatos() }, [albumId, alumnoId])

  async function cargarDatos() {
    setCargando(true)

    const [{ data: albumData }, { data: alumnoData }] = await Promise.all([
      supabase.from('album').select('*').eq('id', albumId).single(),
      supabase.from('alumno').select('*, grado_sala(descripcion)').eq('id', alumnoId).single(),
    ])
    setAlbum(albumData)
    setAlumno(alumnoData)

    const { data: misFaltantes } = await supabase
      .from('figurita_alumno')
      .select('numero_figurita')
      .eq('id_alumno', alumnoId)
      .eq('id_album', albumId)
      .eq('estado', 'faltante')

    console.log('Mis faltantes:', misFaltantes)

    if (!misFaltantes || misFaltantes.length === 0) {
      setCargando(false)
      setResultados([])
      return
    }

    const { data: repetidas, error } = await supabase
      .rpc('buscar_coincidencias', {
        p_alumno_id: alumnoId,
        p_album_id: albumId
      })

    console.log('alumnoId:', alumnoId)
    console.log('albumId:', albumId)
    console.log('RPC repetidas:', repetidas)
    console.log('RPC error:', error)

    if (error || !repetidas || repetidas.length === 0) {
      setCargando(false)
      setResultados([])
      return
    }

    const idsAlumnos = [...new Set(repetidas.map(r => r.id_alumno))]

    const { data: alumnosData } = await supabase
      .from('alumno')
      .select('id, nombre, apellido, grado_sala(descripcion), id_familia')
      .in('id', idsAlumnos)

    console.log('Alumnos data:', alumnosData)

    if (!alumnosData) {
      setCargando(false)
      setResultados([])
      return
    }

    const idsFamilias = [...new Set(alumnosData.map(a => a.id_familia))]
    console.log('IDs familias buscadas:', idsFamilias)

    const { data: familiasData } = await supabase
      .from('familia')
      .select('id, nombre_adulto, apellido_adulto, email_adulto, estado')
      .in('id', idsFamilias)
      .eq('estado', 'aprobado')

    console.log('Familias data:', familiasData)

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

    const { data: misRepetidas } = await supabase
      .from('figurita_alumno')
      .select('numero_figurita')
      .eq('id_alumno', alumnoId)
      .eq('id_album', albumId)
      .eq('estado', 'repetida')

    const misRepetidasNums = (misRepetidas || []).map(f => f.numero_figurita)

    const resultadosFinales = []

    for (const alumnoOtro of alumnosAprobados) {
      const figuritasQueTiene = repetidas
        .filter(r => r.id_alumno === alumnoOtro.id)
        .map(r => r.numero_figurita)

      const { data: susFaltantes } = await supabase
        .rpc('buscar_faltantes_alumno', {
          p_alumno_id: alumnoOtro.id,
          p_album_id: albumId
        })

      const susFaltantesNums = (susFaltantes || []).map(f => f.numero_figurita)
      const figuritasQueTeFantanYYoTengo = susFaltantesNums.filter(n => misRepetidasNums.includes(n))

      resultadosFinales.push({
        alumno: alumnoOtro,
        figuritasQueTiene,
        figuritasQueTeFantanYYoTengo,
        totalCoincidencias: figuritasQueTiene.length + figuritasQueTeFantanYYoTengo.length
      })
    }

    resultadosFinales.sort((a, b) => b.totalCoincidencias - a.totalCoincidencias)
    setResultados(resultadosFinales)

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const { count } = await supabase
      .from('envio_mail')
      .select('id', { count: 'exact' })
      .eq('id_familia_origen', familia.id)
      .gte('created_at', hoy.toISOString())
    setEmailsEnviados(count || 0)

    setCargando(false)
  }

  async function enviarEmail(resultado) {
    if (emailsEnviados >= 5) {
      toast.error('Alcanzaste el límite de 5 emails por día')
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enviar-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            emailDestino: resultado.alumno.familia.email_adulto,
            nombreAdultoDestino: `${resultado.alumno.familia.nombre_adulto} ${resultado.alumno.familia.apellido_adulto}`,
            nombreAlumnoOrigen: `${alumno.nombre} ${alumno.apellido}`,
            gradoOrigen: alumno.grado_sala?.descripcion,
            emailAdultoOrigen: familia.email_adulto,
            nombreFamiliaOrigen: `${familia.nombre_adulto} ${familia.apellido_adulto}`,
            nombreAlumnoDestino: `${resultado.alumno.nombre} ${resultado.alumno.apellido}`,
            nombreAlbum: album.nombre,
            figuritasQueMeFaltanYVosTenes: resultado.figuritasQueTiene.sort((a, b) => a - b),
            figuritasQueTeFantanYYoTengo: resultado.figuritasQueTeFantanYYoTengo.sort((a, b) => a - b),
            idFamiliaDestino: resultado.alumno.familia.id,
            idAlbum: albumId
          })
        }
      )

      const data = await response.json()
      if (data.error) throw new Error(data.error)

      toast.success('¡Email enviado!')
      setEmailsEnviados(prev => prev + 1)
    } catch (err) {
      toast.error(err.message || 'Error al enviar email')
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
        <div className="emails-contador">
          <span className={emailsEnviados >= 5 ? 'limite-alcanzado' : ''}>
            📧 {emailsEnviados}/5 emails hoy
          </span>
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
            Se encontraron <strong>{resultados.length} alumnos</strong> con figuritas para intercambiar, ordenados por mayor cantidad de coincidencias.
          </p>
          <div className="resultados-lista">
            {resultados.map((r, i) => (
              <ResultadoCoincidencia
                key={r.alumno.id}
                resultado={r}
                posicion={i + 1}
                onEnviarEmail={() => enviarEmail(r)}
                emailsAgotados={emailsEnviados >= 5}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}