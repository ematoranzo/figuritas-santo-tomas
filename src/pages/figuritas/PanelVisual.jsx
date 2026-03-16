export default function PanelVisual({ total, figuritas, modo, onToggle }) {
  const rangos = []
  for (let i = 1; i <= total; i += 50) {
    rangos.push({ desde: i, hasta: Math.min(i + 49, total) })
  }
  const [rangoActivo, setRangoActivo] = useState(0)

  const { desde, hasta } = rangos[rangoActivo]
  const numeros = []
  for (let n = desde; n <= hasta; n++) numeros.push(n)

  function getEstado(n) {
    return figuritas[n] || null
  }

  return (
    <div className="panel-visual">
      <div className="rangos-tabs">
        {rangos.map((r, i) => (
          <button key={i} onClick={() => setRangoActivo(i)}
            className={`rango-tab ${rangoActivo === i ? 'active' : ''}`}>
            {r.desde}–{r.hasta}
          </button>
        ))}
      </div>
      <div className="grilla-figuritas">
        {numeros.map(n => {
          const estado = getEstado(n)
          return (
            <button key={n} onClick={() => onToggle(n)}
              className={`figura-btn ${estado === 'faltante' ? 'faltante' : ''} ${estado === 'repetida' ? 'repetida' : ''} ${modo === estado ? 'modo-activo' : ''}`}>
              {n}
            </button>
          )
        })}
      </div>
      <div className="panel-leyenda">
        <span className="leyenda-item faltante-leyenda">● Faltante</span>
        <span className="leyenda-item repetida-leyenda">● Repetida</span>
        <span className="leyenda-item neutral-leyenda">● Sin marcar</span>
      </div>
    </div>
  )
}

import { useState } from 'react'