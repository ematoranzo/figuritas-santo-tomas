import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { familia, alumnos } = useAuth();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>¡Hola, familia {familia?.apellido_adulto}! 👋</h1>
        <p>
          {familia?.nombre_adulto} {familia?.apellido_adulto}
        </p>
      </div>

      {alumnos.length === 0 ? (
        <div className="dashboard-empty">
          <span className="empty-icon">🎴</span>
          <h2>Todavía no hay álbumes activos</h2>
          <p>Cuando la administradora publique un álbum, aparecerá acá.</p>
        </div>
      ) : (
        <div className="alumnos-dashboard">
          {alumnos.map((alumno) => (
            <div key={alumno.id} className="alumno-dashboard-card">
              <div className="alumno-dashboard-header">
                <div>
                  <h2>
                    {alumno.nombre} {alumno.apellido}
                  </h2>
                  <p>
                    {alumno.grado_sala?.descripcion} ·{' '}
                    {alumno.grado_sala?.nivel}
                  </p>
                </div>
                <span className="alumno-icon">🎒</span>
              </div>
              <div className="dashboard-empty-small">
                <p>🎴 No hay álbumes activos todavía</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
