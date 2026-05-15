import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { enviarEmailAprobacion } from '../../emailService'
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
        try {
          await enviarEmailAprobacion(
            familia.email_adulto,
            `${familia.nombre_adulto} ${familia.apellido_adulto}`
          )
          console.log('✅ Email de aprobación enviado correctamente')
        } catch (emailError) {
          console.warn('⚠️ Familia aprobada pero error al enviar email:', emailError.message)
          // No bloqueamos, la aprobación ya se procesó
        }
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
        <div className="admin-empty">No hay familias</div>
      ) : (
        <div className="familias-lista">
          {filtradas.map(familia => (
            <div key={familia.id} className="familia-admin-card">
              <div className="familia-admin-header">
                <div>
                  <h3>{familia.nombre_adulto} {familia.apellido_adulto}</h3>
                  <p>{familia.email_adulto}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{
                    background: COLORES[familia.estado],
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '.85rem',
                    fontWeight: '600',
                    whiteSpace: 'nowrap'
                  }}>
                    {familia.estado}
                  </span>
                </div>
              </div>

              {familia.alumnos && familia.alumnos.length > 0 && (
                <div className="familia-alumnos">
                  {familia.alumnos.map((a, idx) => (
                    <span key={idx} className="alumno-chip">
                      {a.nombre} {a.apellido} — {a.grado_sala?.descripcion}
                    </span>
                  ))}
                </div>
              )}

              <div className="acciones" style={{ marginTop: '12px' }}>
                {familia.estado === 'pendiente' && (
                  <>
                    <button
                      className="btn-accion btn-ok"
                      onClick={() => cambiarEstado(familia.id, 'aprobado')}
                    >
                      ✓ Aprobar
                    </button>
                    <button
                      className="btn-accion btn-danger"
                      onClick={() => cambiarEstado(familia.id, 'rechazado')}
                    >
                      ✕ Rechazar
                    </button>
                  </>
                )}
                {familia.estado === 'aprobado' && (
                  <button
                    className="btn-accion btn-warn"
                    onClick={() => cambiarEstado(familia.id, 'inactivo')}
                  >
                    ⊗ Inactivar
                  </button>
                )}
                {familia.estado === 'inactivo' && (
                  <button
                    className="btn-accion btn-primary-sm"
                    onClick={() => cambiarEstado(familia.id, 'aprobado')}
                  >
                    ↻ Reactivar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}