export default function ResultadoCoincidencia({ resultado, posicion, onEnviarEmail, emailsAgotados }) {
  const { alumno, figuritasQueTiene, figuritasQueTeFantanYYoTengo, totalCoincidencias } = resultado

  return (
    <div className="resultado-card">
      <div className="resultado-header">
        <div className="resultado-posicion">#{posicion}</div>
        <div className="resultado-info">
          <h3>{alumno.nombre} {alumno.apellido}</h3>
          <p>{alumno.grado_sala?.descripcion}</p>
        </div>
        <div className="resultado-total">
          <span className="total-num">{totalCoincidencias}</span>
          <span className="total-label">coincidencias</span>
        </div>
      </div>

      <div className="resultado-detalle">
        {figuritasQueTiene.length > 0 && (
          <div className="resultado-bloque faltante-bloque">
            <p className="resultado-bloque-titulo">
              📋 Te faltan y {alumno.nombre} tiene repetidas ({figuritasQueTiene.length}):
            </p>
            <div className="figuritas-chips">
              {figuritasQueTiene.sort((a, b) => a - b).map(n => (
                <span key={n} className="chip-faltante">{n}</span>
              ))}
            </div>
          </div>
        )}

        {figuritasQueTeFantanYYoTengo.length > 0 && (
          <div className="resultado-bloque repetida-bloque">
            <p className="resultado-bloque-titulo">
              🔁 A {alumno.nombre} le faltan y vos tenés repetidas ({figuritasQueTeFantanYYoTengo.length}):
            </p>
            <div className="figuritas-chips">
              {figuritasQueTeFantanYYoTengo.sort((a, b) => a - b).map(n => (
                <span key={n} className="chip-repetida">{n}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="resultado-acciones">
        <button
          onClick={onEnviarEmail}
          disabled={emailsAgotados}
          className={`btn-enviar-email ${emailsAgotados ? 'btn-disabled' : ''}`}
        >
          {emailsAgotados ? '📧 Límite diario alcanzado' : '📧 Enviar email a la familia'}
        </button>
      </div>
    </div>
  )
}