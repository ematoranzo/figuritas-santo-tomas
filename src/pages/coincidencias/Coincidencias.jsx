import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { enviarEmailCoincidencia } from '../../emailService'
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

    try {
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

      console.log('✅ Mis faltantes cargados:', misFaltantes?.length || 0)

      if (!misFaltantes || misFaltantes.length === 0) {
        console.log('⚠️ No hay faltantes para este alumno')
        setCargando(false)
        setResultados([])
        return
      }

      // ✅ Buscar coincidencias
      console.log('🔍 Buscando coincidencias...')
      const { data: repetidas, error: errorRepetidas } = await supabase
        .rpc('buscar_coincidencias', {
          p_alumno_id: alumnoId,
          p_album_id: albumId
        })

      if (errorRepetidas) {
        console.error('❌ Error en buscar_coincidencias:', errorRepetidas)
        toast.error('Error al buscar coincidencias')
        setCargando(false)
        setResultados([])
        return
      }

      console.log('✅ Coincidencias encontradas:', repetidas?.length || 0)

      if (!repetidas || repetidas.length === 0) {
        setCargando(false)
        setResultados([])
        return
      }

      const idsAlumnos = [...new Set(repetidas.map(r => r.id_alumno))]

      const { data: alumnosData } = await supabase
        .from('alumno')
        .select('id, nombre, apellido, grado_sala(descripcion), id_familia')
        .in('id', idsAlumnos)

      console.log('✅ Alumnos con coincidencias:', alumnosData?.length || 0)

      if (!alumnosData) {
        setCargando(false)
        setResultados([])
        return
      }

      const idsFamilias = [...new Set(alumnosData.map(a => a.id_familia))]

      const { data: familiasData } = await supabase
        .from('familia')
        .select('id, nombre_adulto, apellido_adulto, email_adulto, estado')
        .in('id', idsFamilias)
        .eq('estado', 'aprobado')

      console.log('✅ Familias aprobadas encontradas:', familiasData?.length || 0)

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

      // Importante: mantener como STRING para comparar
      const misRepetidasNums = (misRepetidas || []).map(f => String(f.numero_figurita))

      const resultadosFinales = []

      // ✅ MEJOR MANEJO DEL LOOP CON TRY-CATCH
      for (const alumnoOtro of alumnosAprobados) {
        try {
          // Verificar que los IDs son válidos
          if (!alumnoOtro.id || !albumId) {
            console.warn('⚠️ Saltando alumno - IDs inválidos:', { 
              'alumnoOtro.id': alumnoOtro.id, 
              'albumId': albumId 
            })
            continue
          }

          const figuritasQueTiene = repetidas
            .filter(r => r.id_alumno === alumnoOtro.id)
            .map(r => String(r.numero_figurita))

          console.log(`🔍 Llamando buscar_faltantes_alumno para ${alumnoOtro.nombre} ${alumnoOtro.apellido}`, {
            p_alumno_id: alumnoOtro.id,
            p_album_id: albumId
          })

          const { data: susFaltantes, error: errorFaltantes } = await supabase
            .rpc('buscar_faltantes_alumno', {
              p_alumno_id: alumnoOtro.id,
              p_album_id: albumId
            })

          // ✅ Verificar error en RPC
          if (errorFaltantes) {
            console.error('❌ Error en buscar_faltantes_alumno:', {
              alumno: `${alumnoOtro.nombre} ${alumnoOtro.apellido}`,
              error: errorFaltantes
            })
            continue // Saltar este alumno y continuar con el siguiente
          }

          // ✅ Verificar que datos no sean null
          if (!susFaltantes) {
            console.warn('⚠️ susFaltantes es null para:', alumnoOtro.nombre)
            continue
          }

          const susFaltantesNums = (susFaltantes || []).map(f => String(f.numero_figurita))
          const figuritasQueTeFantanYYoTengo = susFaltantesNums.filter(n => misRepetidasNums.includes(n))

          console.log(`✅ Coincidencias encontradas con ${alumnoOtro.nombre}:`, {
            'Figuritas que tiene y me faltan': figuritasQueTiene.length,
            'Figuritas que le faltan y yo tengo': figuritasQueTeFantanYYoTengo.length
          })

          resultadosFinales.push({
            alumno: alumnoOtro,
            figuritasQueTiene,
            figuritasQueTeFantanYYoTengo,
            totalCoincidencias: figuritasQueTiene.length + figuritasQueTeFantanYYoTengo.length
          })
        } catch (err) {
          console.error('❌ Error inesperado en loop de coincidencias:', {
            alumno: alumnoOtro?.nombre,
            error: err.message
          })
          // Continuar con el siguiente alumno
          continue
        }
      }

      resultadosFinales.sort((a, b) => b.totalCoincidencias - a.totalCoincidencias)
      setResultados(resultadosFinales)

      console.log('✅ Resultados finales:', resultadosFinales.length)

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
    } catch (err) {
      console.error('❌ Error general en cargarDatos:', err)
      toast.error('Error al cargar las coincidencias')
      setCargando(false)
    }
  }

  async function enviarEmail(resultado) {
    if (emailsEnviados >= 5) {
      toast.error('Alcanzaste el límite de 5 emails por día')
      return
    }

    try {
      console.log('📧 Enviando email de coincidencia a:', resultado.alumno.familia.email_adulto)
      
      await enviarEmailCoincidencia({
        emailDestino: resultado.alumno.familia.email_adulto,
        nombreAdultoDestino: `${resultado.alumno.familia.nombre_adulto} ${resultado.alumno.familia.apellido_adulto}`,
        nombreAlumnoOrigen: `${alumno.nombre} ${alumno.apellido}`,
        gradoOrigen: alumno.grado_sala?.descripcion,
        emailAdultoOrigen: familia.email_adulto,
        nombreFamiliaOrigen: `${familia.nombre_adulto} ${familia.apellido_adulto}`,
        nombreAlumnoDestino: `${resultado.alumno.nombre} ${resultado.alumno.apellido}`,
        nombreAlbum: album.nombre,
        figuritasQueMeFaltanYVosTenes: resultado.figuritasQueTiene.sort((a, b) => {
          const aNum = !isNaN(a)
          const bNum = !isNaN(b)
          if (aNum && bNum) return parseInt(a) - parseInt(b)
          if (aNum) return -1
          if (bNum) return 1
          return a.localeCompare(b)
        }),
        figuritasQueTeFantanYYoTengo: resultado.figuritasQueTeFantanYYoTengo.sort((a, b) => {
          const aNum = !isNaN(a)
          const bNum = !isNaN(b)
          if (aNum && bNum) return parseInt(a) - parseInt(b)
          if (aNum) return -1
          if (bNum) return 1
          return a.localeCompare(b)
        }),
        idFamiliaDestino: resultado.alumno.familia.id,
        idAlbum: albumId,
      })

      toast.success('¡Email enviado!')
      setEmailsEnviados(prev => prev + 1)
      console.log('✅ Email enviado exitosamente')
    } catch (err) {
      console.error('❌ Error al enviar email:', err.message)
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