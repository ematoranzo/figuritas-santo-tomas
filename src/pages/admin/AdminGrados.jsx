import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function AdminGrados() {
  const [grados, setGrados] = useState([])
  const [form, setForm] = useState({ nivel: 'Primaria', descripcion: '' })
  const [cargando, setCargando] = useState(false)

  useEffect(() => { cargarGrados() }, [])

  async function cargarGrados() {
    const { data } = await supabase.from('grado_sala')
      .select('*').order('nivel').order('descripcion')
    setGrados(data || [])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.descripcion.trim()) { toast.error('Ingresá una descripción'); return }
    setCargando(true)
    const { error } = await supabase.from('grado_sala').insert({
      nivel: form.nivel, descripcion: form.descripcion.trim(), estado: 'activo'
    })
    setCargando(false)
    if (error) { toast.error('Error al crear'); return }
    toast.success('Grado/sala creado')
    setForm({ nivel: 'Primaria', descripcion: '' })
    cargarGrados()
  }

  async function toggleEstado(g) {
    const nuevo = g.estado === 'activo' ? 'inactivo' : 'activo'
    await supabase.from('grado_sala').update({ estado: nuevo }).eq('id', g.id)
    toast.success(`${nuevo === 'activo' ? 'Activado' : 'Inactivado'}`)
    cargarGrados()
  }

  const iniciales = grados.filter(g => g.nivel === 'Inicial')
  const primaria = grados.filter(g => g.nivel === 'Primaria')

  return (
    <div className="admin-page">
      <h1 className="admin-title">Grados y salas</h1>

      <div className="admin-card">
        <h2>Agregar grado o sala</h2>
        <form onSubmit={handleSubmit} className="admin-form-inline">
          <select value={form.nivel} onChange={e => setForm(f => ({ ...f, nivel: e.target.value }))}>
            <option value="Inicial">Nivel Inicial</option>
            <option value="Primaria">Nivel Primaria</option>
          </select>
          <input
            placeholder="Descripción (ej: 4° grado)"
            value={form.descripcion}
            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
          />
          <button type="submit" className="btn-primary" disabled={cargando}>
            {cargando ? 'Guardando...' : '+ Agregar'}
          </button>
        </form>
      </div>

      {[['Nivel Inicial', iniciales], ['Nivel Primaria', primaria]].map(([titulo, lista]) => (
        <div key={titulo} className="admin-card">
          <h2>{titulo}</h2>
          {lista.length === 0 ? <p className="admin-empty">Sin registros.</p> : (
            <table className="admin-tabla">
              <thead><tr><th>Descripción</th><th>Estado</th><th>Acción</th></tr></thead>
              <tbody>
                {lista.map(g => (
                  <tr key={g.id}>
                    <td>{g.descripcion}</td>
                    <td>
                      <span className="estado-badge" style={{ background: g.estado === 'activo' ? '#27ae60' : '#95a5a6' }}>
                        {g.estado}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => toggleEstado(g)} className={`btn-accion ${g.estado === 'activo' ? 'btn-warn' : 'btn-ok'}`}>
                        {g.estado === 'activo' ? '⏸ Inactivar' : '▶ Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  )
}