import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const ESTADOS = ['todos', 'pendiente', 'aprobado', 'rechazado', 'inactivo', 'baja']
const COLORES = {
  pendiente: '#f39c12', aprobado: '#27ae60',
  rechazado: '#e74c3c', inactivo: '#95a5a6', baja: '#7f8c8d'
}

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [filtro, setFiltro] = useState('pendiente')
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(false)

  useEffect(() => { cargarUsuarios() }, [filtro])

  async function cargarUsuarios() {
    setCargando(true)
    let q = supabase.from('usuario')
      .select('*, grado_sala(descripcion, nivel)')
      .order('created_at', { ascending: false })
    if (filtro !== 'todos') q = q.eq('estado', filtro)
    const { data } = await q
    setUsuarios(data || [])
    setCargando(false)
  }

  async function cambiarEstado(id, nuevoEstado) {
    const { error } = await supabase.from('usuario')
      .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      toast.error('Error al actualizar')
    } else {
      toast.success(`Usuario ${nuevoEstado}`)
      cargarUsuarios()
    }
  }

  const filtrados = usuarios.filter(u => {
    const texto = busqueda.toLowerCase()
    return !texto ||
      u.nombre_alumno?.toLowerCase().includes(texto) ||
      u.apellido_alumno?.toLowerCase().includes(texto) ||
      u.email_adulto?.toLowerCase().includes(texto) ||
      u.grado_sala?.descripcion?.toLowerCase().includes(texto)
  })

  return (
    <div className="admin-page">
      <h1 className="admin-title">Usuarios</h1>

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
          placeholder="🔍 Buscar por nombre, email o grado..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      {cargando ? (
        <div className="admin-loading">Cargando...</div>
      ) : filtrados.length === 0 ? (
        <div className="admin-empty">No hay usuarios en este estado.</div>
      ) : (
        <div className="tabla-wrapper">
          <table className="admin-tabla">
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Adulto responsable</th>
                <th>Email</th>
                <th>Grado / Sala</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.apellido_alumno}, {u.nombre_alumno}</strong></td>
                  <td>{u.nombre_adulto} {u.apellido_adulto}</td>
                  <td>{u.email_adulto}</td>
                  <td>{u.grado_sala?.descripcion}</td>
                  <td>
                    <span className="estado-badge" style={{ background: COLORES[u.estado] }}>
                      {u.estado}
                    </span>
                  </td>
                  <td className="acciones">
                    {u.estado === 'pendiente' && <>
                      <button onClick={() => cambiarEstado(u.id, 'aprobado')} className="btn-accion btn-ok">✓ Aprobar</button>
                      <button onClick={() => cambiarEstado(u.id, 'rechazado')} className="btn-accion btn-danger">✗ Rechazar</button>
                    </>}
                    {u.estado === 'aprobado' && u.rol !== 'admin' &&
                      <button onClick={() => cambiarEstado(u.id, 'inactivo')} className="btn-accion btn-warn">⏸ Inactivar</button>
                    }
                    {u.estado === 'inactivo' &&
                      <button onClick={() => cambiarEstado(u.id, 'aprobado')} className="btn-accion btn-ok">▶ Reactivar</button>
                    }
                    {u.estado === 'rechazado' &&
                      <button onClick={() => cambiarEstado(u.id, 'aprobado')} className="btn-accion btn-ok">✓ Aprobar</button>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}