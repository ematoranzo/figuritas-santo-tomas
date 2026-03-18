import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

export default function ImportarPlanilla({ alumnoId, albumId, albumNombre, cantidadTotal, onCerrar, onImportado }) {
  const [procesando, setProcesando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const inputRef = useRef()

  async function procesarArchivo(e) {
    const file = e.target.files[0]
    if (!file) return

    setProcesando(true)
    setResultado(null)

    try {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const filas = XLSX.utils.sheet_to_json(ws)

      if (filas.length === 0) {
        toast.error('El archivo está vacío')
        return
      }

      // Verificar columnas
      const primeraFila = filas[0]
      const tieneNumero = 'Número' in primeraFila || 'Numero' in primeraFila || 'numero' in primeraFila
      const tieneEstado = 'Estado' in primeraFila || 'estado' in primeraFila

      if (!tieneNumero || !tieneEstado) {
        toast.error('El archivo debe tener columnas "Número" y "Estado"')
        return
      }

      // Cargar figuritas actuales para validar exclusión mutua
      const { data: figuritasActuales } = await supabase
        .from('figurita_alumno')
        .select('numero_figurita, estado')
        .eq('id_alumno', alumnoId)
        .eq('id_album', albumId)

      const mapaActual = {}
      figuritasActuales?.forEach(f => { mapaActual[f.numero_figurita] = f.estado })

      const correctos = []
      const errores = []

      for (const fila of filas) {
        const num = parseInt(fila['Número'] || fila['Numero'] || fila['numero'])
        const estadoRaw = (fila['Estado'] || fila['estado'] || '').toString().toLowerCase().trim()

        // Validar número
        if (isNaN(num)) {
          errores.push(`Número inválido: "${fila['Número'] || fila['Numero'] || fila['numero']}"`)
          continue
        }

        // Validar rango
        if (num < 1 || num > cantidadTotal) {
          errores.push(`Figurita ${num} fuera de rango (1-${cantidadTotal})`)
          continue
        }

        // Validar estado
        let estado = null
        if (estadoRaw === 'faltante') estado = 'faltante'
        else if (estadoRaw === 'repetida') estado = 'repetida'
        else {
          errores.push(`Figurita ${num}: estado inválido "${estadoRaw}" (debe ser Faltante o Repetida)`)
          continue
        }

        // Validar exclusión mutua
        const estadoActual = mapaActual[num]
        const estadoOpuesto = estado === 'faltante' ? 'repetida' : 'faltante'
        if (estadoActual === estadoOpuesto) {
          errores.push(`Figurita ${num}: ya está cargada como ${estadoOpuesto}`)
          continue
        }

        correctos.push({ num, estado })
      }

      // Guardar los correctos
      if (correctos.length > 0) {
        for (const { num, estado } of correctos) {
          await supabase.from('figurita_alumno').upsert({
            id_alumno: alumnoId,
            id_album: albumId,
            numero_figurita: num,
            estado,
            cantidad: 1,
            fecha_actualizacion: new Date().toISOString()
          }, { onConflict: 'id_alumno,id_album,numero_figurita' })
        }
      }

      setResultado({ correctos: correctos.length, errores })
      if (correctos.length > 0) {
        toast.success(`${correctos.length} figuritas importadas`)
        onImportado()
      }

    } catch (err) {
      toast.error('Error al procesar el archivo')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h2>📥 Importar planilla</h2>
        <p className="modal-subtitle">
          Subí un archivo <strong>.xlsx o .csv</strong> con columnas <strong>Número</strong> y <strong>Estado</strong> (Faltante o Repetida).
        </p>

        {!resultado && (
          <>
            <div className="import-ejemplo">
              <p className="import-ejemplo-titulo">Ejemplo de formato:</p>
              <table className="import-tabla-ejemplo">
                <thead>
                  <tr><th>Número</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  <tr><td>5</td><td>Faltante</td></tr>
                  <tr><td>18</td><td>Repetida</td></tr>
                  <tr><td>42</td><td>Faltante</td></tr>
                </tbody>
              </table>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.csv"
              onChange={procesarArchivo}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => inputRef.current.click()}
              disabled={procesando}
              className="btn-primary btn-block"
            >
              {procesando ? 'Procesando...' : '📂 Seleccionar archivo'}
            </button>
          </>
        )}

        {resultado && (
          <div className="import-resultado">
            <div className="import-stat ok">
              <span className="import-stat-num">{resultado.correctos}</span>
              <span className="import-stat-label">Figuritas importadas correctamente</span>
            </div>
            {resultado.errores.length > 0 && (
              <div className="import-stat error">
                <span className="import-stat-num">{resultado.errores.length}</span>
                <span className="import-stat-label">Errores encontrados</span>
                <ul className="import-errores">
                  {resultado.errores.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
            <button onClick={onCerrar} className="btn-primary btn-block">
              ✓ Cerrar
            </button>
          </div>
        )}

        {!resultado && (
          <button onClick={onCerrar} className="btn-cancelar">Cancelar</button>
        )}
      </div>
    </div>
  )
}