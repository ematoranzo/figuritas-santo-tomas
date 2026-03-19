import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const ESTADOS = ['todos', 'borrador', 'publicada', 'despublicada']
const COLORES = {
  borrador: '#c9a227',
  publicada: '#27ae60',
  despublicada: '#95a5a6'
}

const EMPTY = {
  titulo: '',
  resumen: '',
  contenido: '',
  destacada: false,
  estado: 'borrador'
}

export default function AdminNoticias() {
  const [noticias, setNoticias] = useState([])
  const [filtro, setFiltro] = useState('todos')
  const [form, setForm] = useState(EMPTY)
  const [editando, setEditando] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)

  useEffect(() => { cargarNoticias() }, [filtro])

  async function cargarNoticias() {
    let q = supabase.from('noticia')
      .select('*, alumno:id_alumno_ref(nombre, apellido), album:id_album_ref(nombre)')
      .order('created_at', { ascending: false })
    if (filtro !== 'todos') q = q.eq('estado', filtro)
    const { data } = await q
    setNoticias(data || [])
  }

  function handleChange(e) {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [e.target.name]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.titulo.trim()) { toast.error('Ingresá un título'); return }
    setCargando(true)
    try {
      const datos = {
        titulo: form.titulo.trim(),
        resumen: form.resumen.trim(),
        contenido: form.contenido.trim(),
        destacada: form.destacada,
        estado: form.estado,
        fecha_publicacion: form.estado === 'publicada' ? new Date().toISOString() : null
      }
      if (editando) {
        await supabase.from('noticia').update(datos).eq('id', editando)
        toast.success('Noticia actualizada')
      } else {
        await supabase.from('noticia').insert({ ...datos, origen: 'manual' })
        toast.success('Noticia creada')
      }
      setForm(EMPTY)
      setEditando(null)
      setMostrarForm(false)
      cargarNoticias()
    } catch (err) {
      toast.error('Error al guardar')
    } finally {
      setCargando(false)
    }
  }

  async function cambiarEstado(id, nuevoEstado) {
    const datos = { estado: nuevoEstado }
    if (nuevoEstado === 'publicada') datos.fecha_publicacion = new Date().toISOString()
    await supabase.from('noticia').update(datos).eq('id', id)
    toast.success(`Noticia ${nuevoEstado}`)
    cargarNoticias()
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminás esta noticia?')) return
    await supabase.from('noticia').delete().eq('id', id)
    toast.success('Noticia eliminada')
    cargarNoticias()
  }

  function editar(n) {
    setForm({
      titulo: n.titulo,
      resumen: n.resumen || '',
      contenido: n.contenido || '',
      destacada: n.destacada || false,
      estado: n.estado
    })
    setEditando(n.id)
    setMostrarForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="admin-page">
      <h1 className="admin-title">Noticias</h1>

      <div className="admin-toolbar">
        <div className="filtros-estado">
          {ESTADOS.map(e => (
            <button key={e} onClick={() => setFiltro(e)}
              className={`filtro-btn ${filtro === e ? 'active' : ''}`}>
              {e.charAt(0).toUpperCase() + e.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setForm(EMPTY); setEditando(null); setMostrarForm(!mostrarForm) }}
          className="btn-primary"
        >
          {mostrarForm ? 'Cancelar' : '+ Nueva noticia'}
        </button>
      </div>

      {mostrarForm && (
        <div className="admin-card">
          <h2>{editando ? 'Editar noticia' : 'Nueva noticia'}</h2>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="campo">
              <label>Título</label>
              <input name="titulo" value={form.titulo} onChange={handleChange} required placeholder="Título de la noticia" />
            </div>
            <div className="campo">
              <label>Resumen</label>
              <input name="resumen" value={form.resumen} onChange={handleChange} placeholder="Resumen breve" />
            </div>
            <div className="campo">
              <label>Contenido</label>
              <textarea
                name="contenido"
                value={form.contenido}
                onChange={handleChange}
                placeholder="Contenido completo de la noticia"
                rows={4}
                style={{ padding: '10px 14px', border: '2px solid #dde', borderRadius: 8, fontSize: '1rem', resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="campo" style={{ marginBottom: 0 }}>
                <label>Estado</label>
                <select name="estado" value={form.estado} onChange={handleChange}>
                  <option value="borrador">Borrador</option>
                  <option value="publicada">Publicada</option>
                  <option value="despublicada">Despublicada</option>
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" name="destacada" checked={form.destacada} onChange={handleChange} />
                <span>Destacar en la home</span>
              </label>
            </div>
            <div className="admin-form-actions">
              <button type="submit" className="btn-primary" disabled={cargando}>
                {cargando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear noticia'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => { setMostrarForm(false); setEditando(null); setForm(EMPTY) }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {noticias.length === 0 ? (
        <div className="admin-empty">No hay noticias en este estado.</div>
      ) : (
        <div className="noticias-admin-lista">
          {noticias.map(n => (
            <div key={n.id} className="noticia-admin-card">
              <div className="noticia-admin-header">
                <div className="noticia-admin-info">
                  <h3>{n.titulo}</h3>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
                    <span className="estado-badge" style={{ background: COLORES[n.estado] }}>{n.estado}</span>
                    {n.destacada && <span className="estado-badge" style={{ background: '#c9a227' }}>⭐ Destacada</span>}
                    {n.origen === 'automatica' && <span className="estado-badge" style={{ background: '#2980b9' }}>🤖 Automática</span>}
                    {n.alumno && <span style={{ fontSize: '.82rem', color: '#888' }}>👤 {n.alumno.nombre} {n.alumno.apellido}</span>}
                    {n.album && <span style={{ fontSize: '.82rem', color: '#888' }}>📚 {n.album.nombre}</span>}
                  </div>
                  {n.resumen && <p style={{ color: '#666', fontSize: '.9rem', marginTop: 6 }}>{n.resumen}</p>}
                </div>
              </div>
              <div className="acciones">
                {n.estado === 'borrador' && (
                  <button onClick={() => cambiarEstado(n.id, 'publicada')} className="btn-accion btn-ok">✓ Publicar</button>
                )}
                {n.estado === 'publicada' && (
                  <button onClick={() => cambiarEstado(n.id, 'despublicada')} className="btn-accion btn-warn">⏸ Despublicar</button>
                )}
                {n.estado === 'despublicada' && (
                  <button onClick={() => cambiarEstado(n.id, 'publicada')} className="btn-accion btn-ok">▶ Republicar</button>
                )}
                <button onClick={() => editar(n)} className="btn-accion btn-primary-sm">✏️ Editar</button>
                <button onClick={() => eliminar(n.id)} className="btn-accion btn-danger">🗑 Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}