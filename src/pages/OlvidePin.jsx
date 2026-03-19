import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function OlvidePin() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setCargando(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/resetear-pin`
      })
      if (error) throw error
      setEnviado(true)
    } catch (err) {
      toast.error('No se encontró una cuenta con ese email')
    } finally {
      setCargando(false)
    }
  }

  if (enviado) return (
    <div className="form-container">
      <div className="form-card">
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '3rem' }}>📧</span>
          <h2 style={{ color: '#1a4a2e', margin: '16px 0 8px' }}>¡Email enviado!</h2>
          <p style={{ color: '#666', marginBottom: 24 }}>
            Revisá el email de <strong>{email}</strong> y hacé clic en el link para resetear tu PIN.
          </p>
          <Link to="/login" className="btn-primary btn-block">Volver al inicio</Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="form-container">
      <div className="form-card">
        <h2>🔑 Olvidé mi PIN</h2>
        <p className="form-subtitle">Ingresá el email del adulto responsable y te enviamos un link para crear un PIN nuevo. Se enviará un email desde "Supabase Auth" con el asunto "Reset Your Password".</p>
        <form onSubmit={handleSubmit}>
          <div className="campo">
            <label>Email del adulto responsable</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              required
            />
          </div>
          <button type="submit" className="btn-primary btn-block" disabled={cargando}>
            {cargando ? 'Enviando...' : '📧 Enviar link de recuperación desde Supabase Auth'}
          </button>
        </form>
        <p className="form-footer">
          <Link to="/login">← Volver al login</Link>
        </p>
      </div>
    </div>
  )
}