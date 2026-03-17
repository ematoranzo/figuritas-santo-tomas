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

    // Figuritas faltantes del alumno actual
    const { data: misFaltantes } = await supabase
      .from('figurita_alumno')
      .select('numero_figurita')
      .eq('id_alumno', alumnoId)
      .eq('id_album', albumId)
      .eq('estado', 'faltante')

    if (!misFaltantes || misFaltantes.length === 0) {
      setCargando(false)
      setResultados([])
      return
    }

    const numerosFaltantes = misFaltantes.map(f => f.numero_figurita)

    // Buscar otros alumnos que tengan esas figuritas como repetidas
    const { data: coincidencias } = await supabase
      .from('figurita_alumno')
      .select(`
        numero_figurita,
        id_alumno,
        alumno!inner(
          id, nombre, apellido,
          grado_sala(descripcion),
          familia!inner(id, nombre_adulto, apellido_adulto, email_adulto, estado)
        )
      `)
      .eq('id_album', albumId)
      .eq('estado', 'repetida')
      .in('numero_figurita', numerosFaltantes)
      .neq('id_alumno', alumnoId)

    if (!coincidencias || coincidencias.length === 0) {
      setCargando(false)
      setResultados([])
      return
    }

    // Agrupar por alumno
    const porAlumno = {}
    for (const c of coincidencias) {
      const a = c.alumno
      if (!a || a.familia?.estado !== 'aprobado') continue
      const id = a.id
      if (!porAlumno[id]) {
        porAlumno[id] = {
          alumno: a,
          figuritasQueTiene: [],
        }
      }
      porAlumno[id].figuritasQueTiene.push(c.numero_figurita)
    }

    // Para cada resultado, buscar también las figuritas que YO tengo repetidas y AL OTRO le faltan
    const resultadosFinales = []
    for (const [idAlumnoOtro, datos] of Object.entries(porAlumno)) {
      // Figuritas faltantes del otro alumno
      const { data: susFaltantes } = await supabase
        .from('figurita_alumno')
        .select('numero_figurita')
        .eq('id_alumno', idAlumnoOtro)
        .eq('id_album', albumId)
        .eq('estado', 'faltante')

      // Figuritas que YO tengo repetidas
      const { data: misRepetidas } = await supabase
        .from('figurita_alumno')
        .select('numero_figurita')
        .eq('id_alumno', alumnoId)
        .eq('id_album', albumId)
        .eq('estado', 'repetida')

      const susFaltantesNums = (susFaltantes || []).map(f => f.numero_figurita)
      const misRepetidasNums = (misRepetidas || []).map(f => f.numero_figurita)
      const figuritasQueTeFantanYYoTengo = susFaltantesNums.filter(n => misRepetidasNums.includes(n))

      resultadosFinales.push({
        ...datos,
        figuritasQueTeFantanYYoTengo,
        totalCoincidencias: datos.figuritasQueTiene.length + figuritasQueTeFantanYYoTengo.length
      })
    }

    // Ordenar por mayor cantidad de coincidencias
    resultadosFinales.sort((a, b) => b.totalCoincidencias - a.totalCoincidencias)
    setResultados(resultadosFinales)

    // Contar emails enviados hoy
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