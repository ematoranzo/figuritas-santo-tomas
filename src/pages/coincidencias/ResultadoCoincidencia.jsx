export default function ResultadoCoincidencia({ resultado, posicion, emailsAgotados }) {
  if (!resultado) return null

  const {
    alumno,
    figuritasQueTiene,
    figuritasQueTeFantanYYoTengo
  } = resultado

  const nombreCompleto = `${alumno.nombre} ${alumno.apellido}`
  const grado = alumno.grado_sala?.descripcion || 'No especificado'
  const emailFamilia = alumno.familia?.email_adulto || 'No disponible'
  const nombreFamilia = `${alumno.familia?.nombre_adulto} ${alumno.familia?.apellido_adulto}`

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '2px solid #e8f3eb'
    }}>
      {/* Encabezado */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px'
      }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '4px'
          }}>
            <div style={{
              background: '#1a4a2e',
              color: 'white',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}>
              #{posicion}
            </div>
            <div>
              <h3 style={{
                margin: '0',
                color: '#1a4a2e',
                fontSize: '1.1rem',
                fontWeight: '600'
              }}>
                {nombreCompleto}
              </h3>
              <p style={{
                margin: '4px 0 0 0',
                color: '#888',
                fontSize: '0.85rem'
              }}>
                {grado}
              </p>
            </div>
          </div>
        </div>
        <div style={{
          background: '#e8f3eb',
          color: '#1a4a2e',
          padding: '8px 16px',
          borderRadius: '20px',
          fontWeight: '600',
          fontSize: '1.1rem',
          textAlign: 'center'
        }}>
          {resultado.totalCoincidencias}
          <p style={{
            margin: '4px 0 0 0',
            fontSize: '0.75rem',
            fontWeight: '400',
            color: '#666'
          }}>
            coincidencias
          </p>
        </div>
      </div>

      {/* Te faltan y el otro tiene repetidas */}
      {figuritasQueTiene.length > 0 && (
        <div style={{
          background: '#fef3e8',
          borderLeft: '4px solid #e67e22',
          padding: '12px',
          marginBottom: '12px',
          borderRadius: '4px'
        }}>
          <p style={{
            margin: '0 0 8px 0',
            fontWeight: 'bold',
            color: '#e67e22',
            fontSize: '0.95rem'
          }}>
            📋 Te faltan y {nombreCompleto} tiene repetidas:
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px'
          }}>
            {figuritasQueTiene.map((num, idx) => (
              <span
                key={idx}
                style={{
                  background: '#e67e22',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: '600'
                }}
              >
                {num}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* A el le faltan y vos tenes repetidas */}
      {figuritasQueTeFantanYYoTengo.length > 0 && (
        <div style={{
          background: '#eaf3fb',
          borderLeft: '4px solid #2980b9',
          padding: '12px',
          marginBottom: '16px',
          borderRadius: '4px'
        }}>
          <p style={{
            margin: '0 0 8px 0',
            fontWeight: 'bold',
            color: '#2980b9',
            fontSize: '0.95rem'
          }}>
            🔁 A {nombreCompleto} le faltan y vos tenés repetidas:
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px'
          }}>
            {figuritasQueTeFantanYYoTengo.map((num, idx) => (
              <span
                key={idx}
                style={{
                  background: '#2980b9',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: '600'
                }}
              >
                {num}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Mensaje final para contactar */}
      <div style={{
        background: '#f0f5f1',
        padding: '12px',
        borderRadius: '8px',
        textAlign: 'center',
        borderTop: '1px solid #ddd',
        paddingTop: '14px',
        marginTop: '14px'
      }}>
        <p style={{
          margin: '0',
          color: '#333',
          fontSize: '0.95rem'
        }}>
          📧 Contactá a la familia de <strong>{nombreCompleto}</strong>:
        </p>
        <p style={{
          margin: '6px 0 0 0',
          color: '#1a4a2e',
          fontSize: '0.95rem',
          fontWeight: '600'
        }}>
          {nombreFamilia} — <a href={`mailto:${emailFamilia}`} style={{
            color: '#1a4a2e',
            textDecoration: 'underline'
          }}>
            {emailFamilia}
          </a>
        </p>
      </div>
    </div>
  )
}