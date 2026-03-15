import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { perfil } = useAuth()

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>¡Hola, {perfil?.nombre_alumno}! 👋</h1>
        <p>{perfil?.grado_sala?.descripcion} · {perfil?.grado_sala?.nivel}</p>
      </div>
      <div className="dashboard-empty">
        <span className="empty-icon">🎴</span>
        <h2>Todavía no hay álbumes activos</h2>
        <p>Cuando la administradora publique un álbum, aparecerá acá.</p>
      </div>
    </div>
  )
}