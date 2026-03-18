import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

export default function ExportarPlanilla({ alumnoId, alumnoNombre, albumId, albumNombre, onCerrar }) {
  const [cargando, setCargando] = useState(false)

  async function exportar(soloEsteAlbum) {
    setCargando(true)
    try {
      let query = supabase
        .from('figurita_alumno')
        .select('numero_figurita, estado, cantidad, fecha_actualizacion, id_album')
        .eq('id_alumno', alumnoId)
        .order('numero_figurita')

      if (soloEsteAlbum) {
        query = query.eq('id_album', albumId)
      }

      const { data, error } = await query
      if (error) throw error

      if (!data || data.length === 0) {
        toast.error('No hay figuritas cargadas para exportar')
        return
      }

      // Si exportamos todos los álbumes, necesitamos los nombres
      let nombresAlbumes = { [albumId]: albumNombre }
      if (!soloEsteAlbum) {
        const idsAlbumes = [...new Set(data.map(f => f.id_album))]
        const { data: albumesData } = await supabase
          .from('album')
          .select('id, nombre')
          .in('id', idsAlbumes)
        albumesData?.forEach(a => { nombresAlbumes[a.id] = a.nombre })
      }

      // Armar las filas
      const filas = data.map(f => ({
        'Álbum': nombresAlbumes[f.id_album] || f.id_album,
        'Alumno': alumnoNombre,
        'Número': f.numero_figurita,
        'Estado': f.estado === 'faltante' ? 'Faltante' : 'Repetida',
        'Cantidad': f.cantidad,
        'Última actualización': new Date(f.fecha_actualizacion).toLocaleDateString('es-AR')
      }))

      // Crear el libro Excel
      const ws = XLSX.utils.json_to_sheet(filas)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Figuritas')

      // Ajustar ancho de columnas
      ws['!cols'] = [
        { wch: 25 }, // Álbum
        { wch: 20 }, // Alumno
        { wch: 10 }, // Número
        { wch: 12 }, // Estado
        { wch: 10 }, // Cantidad
        { wch: 22 }, // Última actualización
      ]

      const nombreArchivo = soloEsteAlbum
        ? `figuritas_${albumNombre}_${alumnoNombre}.xlsx`.replace(/\s+/g, '_')
        : `figuritas_todos_${alumnoNombre}.xlsx`.replace(/\s+/g, '_')

      XLSX.writeFile(wb, nombreArchivo)
      toast.success('¡Planilla exportada!')
      onCerrar()

    } catch (err) {
      toast.error('Error al exportar')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h2>📤 Exportar planilla</h2>
        <p className="modal-subtitle">Elegí qué querés exportar para <strong>{alumnoNombre}</strong>:</p>
        <div className="modal-opciones">
          <button
            onClick={() => exportar(true)}
            disabled={cargando}
            className="btn-primary btn-block"
          >
            📚 Solo este álbum ({albumNombre})
          </button>
          <button
            onClick={() => exportar(false)}
            disabled={cargando}
            className="btn-secondary btn-block"
          >
            📦 Todos los álbumes activos
          </button>
        </div>
        <button onClick={onCerrar} className="btn-cancelar">Cancelar</button>
      </div>
    </div>
  )
}