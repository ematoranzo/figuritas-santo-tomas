import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

const EMPTY = { nombre: '', descripcion: '', cantidad_total: '', estado: 'activo' }

export default function AdminAlbumes() {
  const [albumes, setAlbumes] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editando, setEditando] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [completados, setCompletados] = useState([])
  const [filtroAlbum, setFiltroAlbum] = useState('todos')

  useEffect(() => { cargarAlbumes(); cargarCompletados() }, [])

  async function cargarAlbumes() {
    const { data } = await supabase.from('album')
      .select('*').neq('estado', 'baja').order('created_at', { ascending: false })
    setAlbumes(data || [])
  }

  async function cargarCompletados() {
    const { data } = await supabase
      .from('album_alumno')
      .select(`
        id,
        estado,
        fecha_completado,
        alumno:id_alumno (
          nombre,
          apellido,
          familia:id_familia ( nombre_adulto, apellido_adulto ),
          grado_sala:id_grado_sala ( descripcion )
        ),
        album:id_album ( id, nombre )
      `)
      .eq('estado', 'completado')
      .order('fecha_completado', { ascending: false })

    setCompletados(data || [])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre.trim()) { toast.error('Ingresá un nombre'); return }
    if (!form.cantidad_total || form.cantidad_total < 1) { toast.error('Ingresá la cantidad de figuritas'); return }
    setCargando(true)
    const datos = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      cantidad_total: parseInt(form.cantidad_total),
      estado: form.estado,
      updated_at: new Date().toISOString()
    }
    let error
    if (editando) {
      ({ error } = await supabase.from('album').update(datos).eq('id', editando))
    } else {
      ({ error } = await supabase.from('album').insert(datos))
    }
    setCargando(false)
    if (error) { toast.error('Error al guardar'); return }
    toast.success(editando ? 'Álbum actualizado' : 'Álbum creado')
    setForm(EMPTY)
    setEditando(null)
    cargarAlbumes()
  }

  async function darDeBaja(id) {
    if (!confirm('¿Dar de baja este álbum?')) return
    await supabase.from('album').update({ estado: 'baja' }).eq('id', id)
    toast.success('Álbum dado de baja')
    cargarAlbumes()
  }

  function editar(a) {
    setForm({ nombre: a.nombre, descripcion: a.descripcion || '', cantidad_total: a.cantidad_total, estado: a.estado })
    setEditando(a.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function exportarCompletados() {
    const datos = completadosFiltrados.map(c => ({
      'Alumno': `${c.alumno?.nombre || ''} ${c.alumno?.apellido || ''}`.trim(),
      'Grado/Sala': c.alumno?.grado_sala?.descripcion || '—',
      'Familia': `${c.alumno?.familia?.nombre_adulto || ''} ${c.alumno?.familia?.apellido_adulto || ''}`.trim(),
      'Álbum': c.album?.nombre || '—',
      'Fecha completado': c.fecha_completado
        ? new Date(c.fecha_completado).toLocaleDateString('es-AR')
        : '—'
    }))

    if (datos.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }

    const ws = XLSX.utils.json_to_sheet(datos)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Completados')

    ws['!cols'] = [
      { wch: 25 },
      { wch: 20 },
      { wch: 25 },
      { wch: 25 },
      { wch: 18 },
    ]

    const sufijo = filtroAlbum === 'todos'
      ? 'todos'
      : (completados.find(c => c.album?.id === filtroAlbum)?.album?.nombre || 'album').replace(/\s+/g, '_')

    XLSX.writeFile(wb, `albumes_completados_${sufijo}.xlsx`)
    toast.success('¡Planilla exportada!')
  }

  const completadosFiltrados = filtroAlbum === 'todos'
    ? completados
    : completados.filter(c => c.album?.id === filtroAlbum)

  const albumesConCompletados = [...new Set(completados.map(c => c.album?.id).filter(Boolean))]

  return (
    <div className="admin-page">
      <h1 className="admin-title">Álbumes</h1>

      <div className="admin-card">
        <h2>{editando ? 'Editar álbum' : 'Nuevo álbum'}</h2>
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="campo-grupo">
            <div className="campo">
              <label>Nombre del álbum</label>
              <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Mundial 2026" required />
            </div>
            <div className="campo">
              <label>Cantidad de figuritas</label>
              <input type="number" min="1" max="999" value={form.cantidad_total} onChange={e => setForm(f => ({ ...f, cantidad_total: e.target.value }))} placeholder="Ej: 240" required />
            </div>
          </div>
          <div className="campo">
            <label>Descripción (opcional)</label>
            <input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Descripción breve del álbum" />
          </div>
          <div className="campo">
            <label>Estado</label>
            <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
          <div className="admin-form-actions">
            <button type="submit" className="btn-primary" disabled={cargando}>
              {cargando ? 'Guardando...' : editando ? 'Guardar cambios' : '+ Crear álbum'}
            </button>
            {editando && <button type="button" className="btn-secondary" onClick={() => { setForm(EMPTY); setEditando(null) }}>Cancelar</button>}
          </div>
        </form>
      </div>

      <div className="admin-card">
        <h2>Álbumes existentes</h2>
        {albumes.length === 0 ? <p className="admin-empty">No hay álbumes todavía.</p> : (
          <div className="albumes-grid">
            {albumes.map(a => (
              <div key={a.id} className="album-admin-card">
                <div className="album-admin-header">
                  <h3>{a.nombre}</h3>
                  <span className="estado-badge" style={{ background: a.estado === 'activo' ? '#27ae60' : '#95a5a6' }}>
                    {a.estado}
                  </span>
                </div>
                {a.descripcion && <p>{a.descripcion}</p>}
                <div className="album-admin-info">
                  <span>🎴 {a.cantidad_total} figuritas</span>
                  {' · '}
                  <span>🏆 {completados.filter(c => c.album?.id === a.id).length} completaron</span>
                </div>
                <div className="acciones">
                  <button onClick={() => editar(a)} className="btn-accion btn-primary-sm">✏️ Editar</button>
                  <button onClick={() => darDeBaja(a.id)} className="btn-accion btn-danger">🗑 Dar de baja</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="admin-card">
        <h2>🏆 Álbumes completados ({completados.length})</h2>

        {completados.length === 0 ? (
          <p className="admin-empty">Todavía ningún alumno completó un álbum.</p>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div className="filtros-estado">
                <button
                  className={`filtro-btn ${filtroAlbum === 'todos' ? 'active' : ''}`}
                  onClick={() => setFiltroAlbum('todos')}
                >
                  Todos ({completados.length})
                </button>
                {albumesConCompletados.map(albumId => {
                  const album = completados.find(c => c.album?.id === albumId)?.album
                  const cant = completados.filter(c => c.album?.id === albumId).length
                  return (
                    <button
                      key={albumId}
                      className={`filtro-btn ${filtroAlbum === albumId ? 'active' : ''}`}
                      onClick={() => setFiltroAlbum(albumId)}
                    >
                      {album?.nombre} ({cant})
                    </button>
                  )
                })}
              </div>
              <button onClick={exportarCompletados} className="btn-accion btn-primary-sm">
                📤 Exportar Excel
              </button>
            </div>

            <div className="tabla-wrapper">
              <table className="admin-tabla">
                <thead>
                  <tr>
                    <th>Alumno</th>
                    <th>Grado/Sala</th>
                    <th>Familia</th>
                    <th>Álbum</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {completadosFiltrados.map(c => (
                    <tr key={c.id}>
                      <td>{c.alumno?.nombre} {c.alumno?.apellido}</td>
                      <td>{c.alumno?.grado_sala?.descripcion || '—'}</td>
                      <td>{c.alumno?.familia?.nombre_adulto} {c.alumno?.familia?.apellido_adulto}</td>
                      <td>{c.album?.nombre}</td>
                      <td>{c.fecha_completado
                        ? new Date(c.fecha_completado).toLocaleDateString('es-AR')
                        : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}