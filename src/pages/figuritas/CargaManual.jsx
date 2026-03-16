import { useState } from 'react'
import toast from 'react-hot-toast'

export default function CargaManual({ total, figuritas, modo, onAgregar }) {
  const [texto, setTexto] = useState('')

  function procesar() {
    const nums = texto
      .split(/[\s,;]+/)
      .map(n => parseInt(n.trim()))
      .filter(n => !isNaN(n))

    const validos = []
    const errores = []

    for (const n of nums) {
      if (n < 1 || n > total) {
        errores.push(`${n} fuera de rango`)
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

    if (errores.length > 0) {
      toast.error(`Errores: ${errores.join(', ')}`)
    }
    if (validos.length > 0) {
      onAgregar(validos)
      setTexto('')
      toast.success(`${validos.length} figuritas agregadas`)
    }
  }

  return (
    <div className="carga-manual">
      <label>Ingresá números separados por coma</label>
      <div className="carga-manual-row">
        <input
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder="Ej: 5, 18, 22, 100, 154"
          className="carga-manual-input"
        />
        <button onClick={procesar} className="btn-primary">Agregar</button>
      </div>
    </div>
  )
}