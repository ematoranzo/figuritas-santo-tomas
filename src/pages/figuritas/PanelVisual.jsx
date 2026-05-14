import { useState, useMemo } from 'react'

export default function PanelVisual({ total, figuritas, modo, onToggle, tipoNumeracion = 'numerica', catalogo = [] }) {

  // ── Modo numérico: rangos de 50 ──────────────────────────
  const rangos = useMemo(() => {
    if (tipoNumeracion !== 'numerica') return []
    const r = []
    for (let i = 1; i <= total; i += 50) {
      r.push({ desde: i, hasta: Math.min(i + 49, total) })
    }
    return r
  }, [total, tipoNumeracion])

  // ── Modo alfanumérico: agrupar catálogo por equipo ────────
  const grupos = useMemo(() => {
    if (tipoNumeracion !== 'alfanumerica' || catalogo.length === 0) return []
    const mapa = {}
    catalogo.forEach(f => {
      const equipo = f.equipo || 'Otras'
      if (!mapa[equipo]) mapa[equipo] = []
      mapa[equipo].push(f)
    })
    // Ordenar figuritas dentro de cada equipo por orden
    Object.values(mapa).forEach(arr => arr.sort((a, b) => (a.orden || 0) - (b.orden || 0)))
    // Convertir a array ordenado: primero Introducción y FIFA Museum al final
    const especiales = ['Introducción', 'FIFA Museum', 'Coca-Cola Exclusivas']
    const equipos = Object.keys(mapa)
    const normales = equipos.filter(e => !especiales.includes(e)).sort()
    const extra = especiales.filter(e => equipos.includes(e))
    return [...normales, ...extra].map(nombre => ({ nombre, figuritas: mapa[nombre] }))
  }, [catalogo, tipoNumeracion])

  const [tabActiva, setTabActiva] = useState(0)

  // ── Helpers ───────────────────────────────────────────────
  function getEstado(codigo) {
    return figuritas[codigo] || null
  }

  // Cuántas faltantes/repetidas tiene un grupo (para badge)
  function contarGrupo(grupo) {
    const falt = grupo.figuritas.filter(f => figuritas[f.codigo] === 'faltante').length
    const rep = grupo.figuritas.filter(f => figuritas[f.codigo] === 'repetida').length
    return { falt, rep, total: grupo.figuritas.length }
  }

  // ── Render numérico ───────────────────────────────────────
  if (tipoNumeracion === 'numerica') {
    const rangoActivo = Math.min(tabActiva, rangos.length - 1)
    const { desde, hasta } = rangos[rangoActivo] || { desde: 1, hasta: total }
    const numeros = []
    for (let n = desde; n <= hasta; n++) numeros.push(n)

    return (
      <div className="panel-visual">
        <div className="rangos-tabs">
          {rangos.map((r, i) => (
            <button key={i} onClick={() => setTabActiva(i)}
              className={`rango-tab ${tabActiva === i ? 'active' : ''}`}>
              {r.desde}–{r.hasta}
            </button>
          ))}
        </div>
        <div className="grilla-figuritas">
          {numeros.map(n => {
            const estado = getEstado(n)
            return (
              <button key={n} onClick={() => onToggle(n)}
                className={`figura-btn ${estado === 'faltante' ? 'faltante' : ''} ${estado === 'repetida' ? 'repetida' : ''}`}>
                {n}
              </button>
            )
          })}
        </div>
        <Leyenda />
      </div>
    )
  }

  // ── Render alfanumérico ───────────────────────────────────
  if (catalogo.length === 0) {
    return (
      <div className="panel-visual">
        <p style={{ color: '#888', textAlign: 'center', padding: '24px 0' }}>
          ⏳ Cargando catálogo...
        </p>
      </div>
    )
  }

  const grupoActivo = grupos[Math.min(tabActiva, grupos.length - 1)]

  return (
    <div className="panel-visual">
      {/* Tabs de equipos — scroll horizontal en mobile */}
      <div className="rangos-tabs" style={{ overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: 4 }}>
        {grupos.map((g, i) => {
          const { falt, rep } = contarGrupo(g)
          const tieneActividad = falt > 0 || rep > 0
          return (
            <button key={i} onClick={() => setTabActiva(i)}
              className={`rango-tab ${tabActiva === i ? 'active' : ''}`}
              style={{ whiteSpace: 'nowrap', position: 'relative' }}
            >
              {g.nombre}
              {tieneActividad && (
                <span style={{
                  marginLeft: 6, fontSize: '.7rem', fontWeight: 700,
                  background: tabActiva === i ? 'rgba(255,255,255,.3)' : '#e8f3eb',
                  color: tabActiva === i ? 'white' : '#1a4a2e',
                  padding: '1px 6px', borderRadius: 10
                }}>
                  {falt > 0 ? `${falt}F` : ''}{falt > 0 && rep > 0 ? ' ' : ''}{rep > 0 ? `${rep}R` : ''}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Título del grupo activo */}
      {grupoActivo && (
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontWeight: 700, color: '#1a4a2e', fontSize: '1rem' }}>
            {grupoActivo.nombre}
          </span>
          <span style={{ fontSize: '.82rem', color: '#888' }}>
            {grupoActivo.figuritas.length} figuritas
            {' · '}
            <span style={{ color: '#e67e22' }}>
              {grupoActivo.figuritas.filter(f => figuritas[f.codigo] === 'faltante').length} faltantes
            </span>
            {' · '}
            <span style={{ color: '#2980b9' }}>
              {grupoActivo.figuritas.filter(f => figuritas[f.codigo] === 'repetida').length} repetidas
            </span>
          </span>
        </div>
      )}

      {/* Grilla alfanumérica */}
      <div className="grilla-figuritas" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))' }}>
        {grupoActivo?.figuritas.map(f => {
          const estado = getEstado(f.codigo)
          return (
            <button
              key={f.codigo}
              onClick={() => onToggle(f.codigo)}
              className={`figura-btn ${estado === 'faltante' ? 'faltante' : ''} ${estado === 'repetida' ? 'repetida' : ''}`}
              style={{ fontSize: '.72rem', padding: '4px 2px', height: 40 }}
              title={f.descripcion || f.codigo}
            >
              {f.codigo}
            </button>
          )
        })}
      </div>

      <Leyenda />
    </div>
  )
}

function Leyenda() {
  return (
    <div className="panel-leyenda">
      <span className="leyenda-item faltante-leyenda">● Faltante</span>
      <span className="leyenda-item repetida-leyenda">● Repetida</span>
      <span className="leyenda-item neutral-leyenda">● Sin marcar</span>
    </div>
  )
}