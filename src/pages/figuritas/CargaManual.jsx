import { useState } from 'react'
import toast from 'react-hot-toast'

export default function CargaManual({ total, figuritas, modo, onAgregar, tipoNumeracion = 'numerica', catalogo = [] }) {
  const [texto, setTexto] = useState('')

  // Set de códigos válidos para álbumes alfanuméricos (se construye una sola vez)
  const codigosValidos = tipoNumeracion === 'alfanumerica'
    ? new Set(catalogo.map(f => f.codigo.toUpperCase()))
    : null

  function procesar() {
    const raw = texto.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean)

    if (raw.length === 0) {
      toast.error('Ingresá al menos un número o código')
      return
    }

    const validos = []
    const errores = []

    for (const entrada of raw) {
      if (tipoNumeracion === 'alfanumerica') {
        // Validar contra catálogo (case-insensitive)
        const codigo = entrada.toUpperCase()
        if (!codigosValidos.has(codigo)) {
          errores.push(`"${entrada}" no existe en el catálogo`)
          continue
        }
        const estadoActual = figuritas[codigo]
        const estadoOpuesto = modo === 'faltante' ? 'repetida' : 'faltante'
        if (estadoActual === estadoOpuesto) {
          errores.push(`${codigo} ya está como ${estadoOpuesto}`)
          continue
        }
        if (!validos.includes(codigo)) validos.push(codigo)

      } else {
        // Validación numérica original
        const n = parseInt(entrada)
        if (isNaN(n)) {
          errores.push(`"${entrada}" no es un número válido`)
          continue
        }
        if (n < 1 || n > total) {
          errores.push(`${n} fuera de rango (1–${total})`)
          continue
        }
        const estadoActual = figuritas[n]
        const estadoOpuesto = modo === 'faltante' ? 'repetida' : 'faltante'
        if (estadoActual === estadoOpuesto) {
          errores.push(`${n} ya está como ${estadoOpuesto}`)
          continue
        }
        if (!validos.includes(n)) validos.push(n)
      }
    }

    if (errores.length > 0) {
      toast.error(`Errores: ${errores.slice(0, 3).join(', ')}${errores.length > 3 ? ` (+${errores.length - 3} más)` : ''}`)
    }
    if (validos.length > 0) {
      onAgregar(validos)
      setTexto('')
      toast.success(`${validos.length} figuritas agregadas`)
    }
  }

  const placeholder = tipoNumeracion === 'alfanumerica'
    ? 'Ej: ARG1, ARG5, BRA3, MEX20'
    : 'Ej: 5, 18, 22, 100, 154'

  return (
    <div className="carga-manual">
      <label>
        {tipoNumeracion === 'alfanumerica'
          ? 'Ingresá códigos separados por coma'
          : 'Ingresá números separados por coma'}
      </label>
      <div className="carga-manual-row">
        <input
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && procesar()}
          placeholder={placeholder}
          className="carga-manual-input"
        />
        <button onClick={procesar} className="btn-primary">Agregar</button>
      </div>
    </div>
  )
}