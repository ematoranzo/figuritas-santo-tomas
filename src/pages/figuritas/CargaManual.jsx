import { useState, useMemo } from 'react'
import toast from 'react-hot-toast'

export default function CargaManual({ total, figuritas, modo, onAgregar, onQuitar, tipoNumeracion = 'numerica', catalogo = [] }) {
  const [texto, setTexto] = useState('')

  const codigosValidos = useMemo(() => {
    if (tipoNumeracion === 'alfanumerica') {
      return new Set(catalogo.map(f => f.codigo.toUpperCase()))
    }
    return null
  }, [catalogo, tipoNumeracion])

  function procesar() {
    const raw = texto.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean)

    if (raw.length === 0) {
      toast.error('Ingresá al menos un número o código')
      return
    }

    if (tipoNumeracion === 'alfanumerica' && (!codigosValidos || codigosValidos.size === 0)) {
      toast.error('El catálogo aún está cargando, esperá un momento')
      return
    }

    const paraMarcar = []   // códigos a marcar en el modo actual
    const paraQuitar = []   // códigos a desmarcar
    const errores = []

    for (const entrada of raw) {
      if (tipoNumeracion === 'alfanumerica') {
        const codigo = entrada.toUpperCase()

        if (!codigosValidos.has(codigo)) {
          errores.push(`"${entrada}" no existe en el catálogo`)
          continue
        }

        const estadoActual = figuritas[codigo]
        const estadoOpuesto = modo === 'faltante' ? 'repetida' : 'faltante'

        if (estadoActual === estadoOpuesto) {
          // Está en el estado contrario → error
          errores.push(`${codigo} ya está como ${estadoOpuesto}`)
          continue
        }

        if (estadoActual === modo) {
          // Ya está en este modo → desmarcar
          if (!paraQuitar.includes(codigo)) paraQuitar.push(codigo)
        } else {
          // Sin marcar → marcar
          if (!paraMarcar.includes(codigo)) paraMarcar.push(codigo)
        }

      } else {
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

        if (estadoActual === modo) {
          if (!paraQuitar.includes(n)) paraQuitar.push(n)
        } else {
          if (!paraMarcar.includes(n)) paraMarcar.push(n)
        }
      }
    }

    if (errores.length > 0) {
      toast.error(`${errores.slice(0, 3).join(', ')}${errores.length > 3 ? ` (+${errores.length - 3} más)` : ''}`)
    }
    if (paraMarcar.length > 0) {
      onAgregar(paraMarcar)
      toast.success(`${paraMarcar.length} figurita${paraMarcar.length !== 1 ? 's' : ''} marcada${paraMarcar.length !== 1 ? 's' : ''} como ${modo}`)
    }
    if (paraQuitar.length > 0) {
      onQuitar(paraQuitar)
      toast.success(`${paraQuitar.length} figurita${paraQuitar.length !== 1 ? 's' : ''} desmarcada${paraQuitar.length !== 1 ? 's' : ''}`)
    }

    setTexto('')
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