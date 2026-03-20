import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const ESTADOS = ['todos', 'pendiente', 'aprobado', 'rechazado', 'inactivo', 'baja']
const COLORES = {
  pendiente: '#c9a227', aprobado: '#27ae60',
  rechazado: '#e74c3c', inactivo: '#95a5a6', baja: '#7f8c8d'
}

export default function AdminUsuarios() {
  const [familias, setFamilias] = useState([])
  const [filtro, setFiltro] = useState('pendiente')
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(false)

  useEffect(() => { cargarFamilias() }, [filtro])

  async function cargarFamilias() {
    setCargando(true)
    let q = supabase.from('familia')
      .select('*, alumnos:alumno(nombre, apellido, grado_sala(descripcion))')
      .order('created_at', { ascending: false })
    if (filtro !== 'todos') q = q.eq('estado', filtro)
    const { data } = await q
    setFamilias(data || [])
    setCargando(false)
  }

  async function enviarEmailAprobacion(familia) {
    try {
      await supabase.functions.invoke('enviar-email', {
        body: {
          tipo: 'aprobacion',
          emailDestino: familia.email_adulto,
          nombreAdulto: `${familia.nombre_adulto} ${familia.apellido_adulto}`
        }
      })
    } catch (err) {
      console.error('Error enviando email de aprobación:', err)
    }
  }

  async function cambiarEstado(id, nuevoEstado) {
    const familia = familias.find(f => f.id === id)
    const estadoAnterior = familia?.estado

    const { error } = await supabase.from('familia')
      .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      toast.error('Error al actualizar')
    } else {
      toast.success(`Familia ${nuevoEstado}`)

      // Enviar email si se aprueba (desde pendiente, rechazado o reactivación)
      if (nuevoEstado === 'aprobado' && familia) {
        enviarEmailAprobacion(familia)
      }

      cargarFamilias()
    }
  }

  const filtradas = familias.filter(f => {
    const texto = busqueda.toLowerCase()
    return !texto ||
      f.nombre_adulto?.toLowerCase().includes(texto) ||
      f.apellido_adulto?.toLowerCase().includes(texto) ||
      f.email_adulto?.toLowerCase().includes(texto) ||
      f.alumnos?.some(a =>
        a.nombre?.toLowerCase().includes(texto) ||
        a.apellido?.toLowerCase().includes(texto)
      )
  })

  return (
    <div className="admin-page">
      <h1 className="admin-title">Familias</h1>

      <div className="admin-toolbar">
        <div className="filtros-estado">
          {ESTADOS.map(e => (
            <button key={e} onClick={() => setFiltro(e)}
              className={`filtro-btn ${filtro === e ? 'active' : ''}`}>
              {e.charAt(0).toUpperCase() + e.slice(1)}
            </button>
          ))}
        </div>
        <input
          className="admin-search"
          placeholder="🔍 Buscar por nombre, email o alumno..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      {cargando ? (
        <div className="admin-loading">Cargando...</div>
      ) : filtradas.length === 0 ? (
        <div className="admin-empty">No hay familias en este estado.</div>
      ) : (
        <div className="familias-lista">
          {filtradas.map(f => (
            <div key={f.id} className="familia-admin-card">
              <div className="familia-admin-header">
                <div>
                  <h3>{f.apellido_adulto}, {f.nombre_adulto}</h3>
                  <p>{f.email_adulto}</p>
                </div>
                <span className="estado-badge" style={{ background: COLORES[f.estado] }}>
                  {f.estado}
                </span>
              </div>

              <div className="familia-alumnos">
                {f.alumnos?.map((a, i) => (
                  <span key={i} className="alumno-chip">
                    🎒 {a.nombre} {a.apellido}
                    {a.grado_sala && ` · ${a.grado_sala.descripcion}`}
                  </span>
                ))}
              </div>

              <div className="acciones">
                {f.estado === 'pendiente' && <>
                  <button onClick={() => cambiarEstado(f.id, 'aprobado')} className="btn-accion btn-ok">✓ Aprobar</button>
                  <button onClick={() => cambiarEstado(f.id, 'rechazado')} className="btn-accion btn-danger">✗ Rechazar</button>
                </>}
                {f.estado === 'aprobado' && f.rol !== 'admin' &&
                  <button onClick={() => cambiarEstado(f.id, 'inactivo')} className="btn-accion btn-warn">⏸ Inactivar</button>
                }
                {f.estado === 'inactivo' &&
                  <button onClick={() => cambiarEstado(f.id, 'aprobado')} className="btn-accion btn-ok">▶ Reactivar</button>
                }
                {f.estado === 'rechazado' &&
                  <button onClick={() => cambiarEstado(f.id, 'aprobado')} className="btn-accion btn-ok">✓ Aprobar</button>
                }
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}