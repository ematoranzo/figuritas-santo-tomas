import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

const EMPTY = { nombre: '', descripcion: '', cantidad_total: '', estado: 'activo', tipo_numeracion: 'numerica' }

export default function AdminAlbumes() {
  const [albumes, setAlbumes] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editando, setEditando] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [completados, setCompletados] = useState([])
  const [filtroAlbum, setFiltroAlbum] = useState('todos')

  // Estado para carga de catálogo
  const [albumCatalogo, setAlbumCatalogo] = useState(null) // álbum seleccionado para cargar catálogo
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false)
  const [previewCatalogo, setPreviewCatalogo] = useState(null) // { filas, errores }
  const inputCatalogoRef = useRef(null)

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
    if (form.tipo_numeracion === 'numerica' && (!form.cantidad_total || form.cantidad_total < 1)) {
      toast.error('Ingresá la cantidad de figuritas')
      return
    }
    setCargando(true)
    const datos = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      cantidad_total: form.tipo_numeracion === 'numerica' ? parseInt(form.cantidad_total) : 0,
      estado: form.estado,
      tipo_numeracion: form.tipo_numeracion,
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
    setForm({
      nombre: a.nombre,
      descripcion: a.descripcion || '',
      cantidad_total: a.cantidad_total,
      estado: a.estado,
      tipo_numeracion: a.tipo_numeracion || 'numerica'
    })
    setEditando(a.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Catálogo ──────────────────────────────────────────────

  function abrirCatalogo(album) {
    setAlbumCatalogo(album)
    setPreviewCatalogo(null)
  }

  function cerrarCatalogo() {
    setAlbumCatalogo(null)
    setPreviewCatalogo(null)
    if (inputCatalogoRef.current) inputCatalogoRef.current.value = ''
  }

  function leerCSV(e) {
    const archivo = e.target.files[0]
    if (!archivo) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const texto = ev.target.result
      const lineas = texto.split('\n').map(l => l.trim()).filter(Boolean)

      // Detectar si tiene header (primera fila con "codigo" o "Número")
      let inicio = 0
      const primeraLinea = lineas[0].toLowerCase()
      if (primeraLinea.includes('codigo') || primeraLinea.includes('código') || primeraLinea.includes('numero')) {
        inicio = 1
      }

      const filas = []
      const errores = []

      for (let i = inicio; i < lineas.length; i++) {
        const cols = lineas[i].split(',').map(c => c.trim())
        const codigo = cols[0]
        const descripcion = cols[1] || ''
        const equipo = cols[2] || ''
        const orden = parseInt(cols[3]) || (i - inicio + 1)

        if (!codigo) {
          errores.push(`Fila ${i + 1}: código vacío`)
          continue
        }
        filas.push({ codigo, descripcion, equipo, orden })
      }

      setPreviewCatalogo({ filas, errores })
    }
    reader.readAsText(archivo, 'UTF-8')
  }

  async function subirCatalogo() {
    if (!previewCatalogo || previewCatalogo.filas.length === 0) {
      toast.error('No hay datos válidos para subir')
      return
    }
    if (!confirm(`¿Subir ${previewCatalogo.filas.length} figuritas al catálogo? Esto reemplaza el catálogo existente del álbum.`)) return

    setCargandoCatalogo(true)
    try {
      // Borrar catálogo anterior
      await supabase.from('figurita_catalogo')
        .delete()
        .eq('id_album', albumCatalogo.id)

      // Insertar nuevo en lotes de 500
      const filas = previewCatalogo.filas.map(f => ({
        id_album: albumCatalogo.id,
        codigo: f.codigo,
        descripcion: f.descripcion || null,
        equipo: f.equipo || null,
        orden: f.orden
      }))

      for (let i = 0; i < filas.length; i += 500) {
        const lote = filas.slice(i, i + 500)
        const { error } = await supabase.from('figurita_catalogo').insert(lote)
        if (error) throw error
      }

      // Actualizar cantidad_total del álbum con la cantidad real del catálogo
      await supabase.from('album')
        .update({ cantidad_total: previewCatalogo.filas.length })
        .eq('id', albumCatalogo.id)

      toast.success(`✅ Catálogo cargado: ${previewCatalogo.filas.length} figuritas`)
      cerrarCatalogo()
      cargarAlbumes()
    } catch (err) {
      console.error(err)
      toast.error('Error al subir el catálogo')
    } finally {
      setCargandoCatalogo(false)
    }
  }

  async function verCantidadCatalogo(albumId) {
    const { count } = await supabase
      .from('figurita_catalogo')
      .select('*', { count: 'exact', head: true })
      .eq('id_album', albumId)
    return count || 0
  }

  // ── Exportar completados ──────────────────────────────────

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

    if (datos.length === 0) { toast.error('No hay datos para exportar'); return }

    const ws = XLSX.utils.json_to_sheet(datos)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Completados')
    ws['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 25 }, { wch: 25 }, { wch: 18 }]

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

      {/* ── Form nuevo/editar ── */}
      <div className="admin-card">
        <h2>{editando ? 'Editar álbum' : 'Nuevo álbum'}</h2>
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="campo-grupo">
            <div className="campo">
              <label>Nombre del álbum</label>
              <input
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Mundial 2026"
                required
              />
            </div>
            <div className="campo">
              <label>Tipo de numeración</label>
              <select
                value={form.tipo_numeracion}
                onChange={e => setForm(f => ({ ...f, tipo_numeracion: e.target.value }))}
              >
                <option value="numerica">Numérica (1, 2, 3...)</option>
                <option value="alfanumerica">Alfanumérica (ARG1, MEX20...)</option>
              </select>
            </div>
          </div>

          {form.tipo_numeracion === 'numerica' && (
            <div className="campo">
              <label>Cantidad de figuritas</label>
              <input
                type="number" min="1" max="9999"
                value={form.cantidad_total}
                onChange={e => setForm(f => ({ ...f, cantidad_total: e.target.value }))}
                placeholder="Ej: 240"
                required
              />
            </div>
          )}

          {form.tipo_numeracion === 'alfanumerica' && (
            <div className="campo">
              <p style={{ fontSize: '.88rem', color: '#888', background: '#f4f9f5', padding: '10px 14px', borderRadius: 8, margin: 0 }}>
                📋 La cantidad de figuritas se determina automáticamente al cargar el catálogo CSV. Podés hacerlo después de crear el álbum.
              </p>
            </div>
          )}

          <div className="campo">
            <label>Descripción (opcional)</label>
            <input
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              placeholder="Descripción breve del álbum"
            />
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
            {editando && (
              <button type="button" className="btn-secondary"
                onClick={() => { setForm(EMPTY); setEditando(null) }}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── Álbumes existentes ── */}
      <div className="admin-card">
        <h2>Álbumes existentes</h2>
        {albumes.length === 0 ? <p className="admin-empty">No hay álbumes todavía.</p> : (
          <div className="albumes-grid">
            {albumes.map(a => (
              <div key={a.id} className="album-admin-card">
                <div className="album-admin-header">
                  <h3>{a.nombre}</h3>
                  <span className="estado-badge"
                    style={{ background: a.estado === 'activo' ? '#27ae60' : '#95a5a6' }}>
                    {a.estado}
                  </span>
                </div>
                {a.descripcion && <p>{a.descripcion}</p>}
                <div className="album-admin-info">
                  <span>🎴 {a.cantidad_total} figuritas</span>
                  {' · '}
                  <span style={{ fontSize: '.8rem', color: a.tipo_numeracion === 'alfanumerica' ? '#2980b9' : '#888' }}>
                    {a.tipo_numeracion === 'alfanumerica' ? '🔤 Alfanumérico' : '🔢 Numérico'}
                  </span>
                  {' · '}
                  <span>🏆 {completados.filter(c => c.album?.id === a.id).length} completaron</span>
                </div>
                <div className="acciones">
                  <button onClick={() => editar(a)} className="btn-accion btn-primary-sm">✏️ Editar</button>
                  {a.tipo_numeracion === 'alfanumerica' && (
                    <button onClick={() => abrirCatalogo(a)} className="btn-accion btn-warn">
                      📋 Catálogo
                    </button>
                  )}
                  <button onClick={() => darDeBaja(a.id)} className="btn-accion btn-danger">🗑 Baja</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal catálogo ── */}
      {albumCatalogo && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 16
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 32,
            width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ color: '#1a4a2e', marginBottom: 4 }}>
              📋 Catálogo — {albumCatalogo.nombre}
            </h2>
            <p style={{ color: '#888', fontSize: '.9rem', marginBottom: 24 }}>
              Subí el CSV con las figuritas del álbum. Columnas esperadas: <code>codigo, descripcion, equipo, orden</code>
            </p>

            <div className="campo" style={{ marginBottom: 16 }}>
              <label>Archivo CSV</label>
              <input
                ref={inputCatalogoRef}
                type="file"
                accept=".csv"
                onChange={leerCSV}
                style={{ padding: '8px 0' }}
              />
            </div>

            {previewCatalogo && (
              <div style={{ marginBottom: 20 }}>
                <div style={{
                  background: previewCatalogo.filas.length > 0 ? '#e8f8f0' : '#fdeaea',
                  borderRadius: 8, padding: '12px 16px', marginBottom: 12
                }}>
                  <strong style={{ color: '#27ae60' }}>
                    ✅ {previewCatalogo.filas.length} figuritas listas para subir
                  </strong>
                  {previewCatalogo.errores.length > 0 && (
                    <p style={{ color: '#e74c3c', fontSize: '.85rem', marginTop: 6 }}>
                      ⚠️ {previewCatalogo.errores.length} errores ignorados
                    </p>
                  )}
                </div>

                {/* Preview primeras 5 filas */}
                {previewCatalogo.filas.length > 0 && (
                  <div style={{ fontSize: '.82rem', color: '#555' }}>
                    <strong>Vista previa (primeras 5):</strong>
                    <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {previewCatalogo.filas.slice(0, 5).map((f, i) => (
                        <div key={i} style={{
                          display: 'flex', gap: 12, background: '#f4f9f5',
                          padding: '4px 10px', borderRadius: 6
                        }}>
                          <span style={{ fontWeight: 700, color: '#1a4a2e', minWidth: 60 }}>{f.codigo}</span>
                          <span style={{ color: '#666' }}>{f.descripcion}</span>
                          <span style={{ color: '#888', marginLeft: 'auto' }}>{f.equipo}</span>
                        </div>
                      ))}
                      {previewCatalogo.filas.length > 5 && (
                        <div style={{ color: '#aaa', fontSize: '.8rem', paddingLeft: 10 }}>
                          ... y {previewCatalogo.filas.length - 5} más
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {previewCatalogo.errores.length > 0 && (
                  <details style={{ marginTop: 10, fontSize: '.82rem' }}>
                    <summary style={{ cursor: 'pointer', color: '#e74c3c' }}>Ver errores</summary>
                    <ul style={{ marginTop: 6, paddingLeft: 16, color: '#e74c3c' }}>
                      {previewCatalogo.errores.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </details>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={cerrarCatalogo} className="btn-secondary">
                Cancelar
              </button>
              <button
                onClick={subirCatalogo}
                className="btn-primary"
                disabled={cargandoCatalogo || !previewCatalogo || previewCatalogo.filas.length === 0}
              >
                {cargandoCatalogo ? 'Subiendo...' : `⬆️ Subir ${previewCatalogo?.filas.length || 0} figuritas`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Álbumes completados ── */}
      <div className="admin-card">
        <h2>🏆 Álbumes completados ({completados.length})</h2>

        {completados.length === 0 ? (
          <p className="admin-empty">Todavía ningún alumno completó un álbum.</p>
        ) : (
          <>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16
            }}>
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