import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      toast.error('El PIN debe ser exactamente 6 números')
      return
    }
    setCargando(true)
    const { error } = await login(email, pin)
    if (error) {
      toast.error('Email o PIN incorrecto')
      setCargando(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('familia')
      .select('rol')
      .eq('id', user.id)
      .single()
    setCargando(false)
    if (data?.rol === 'admin') {
      navigate('/admin')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="form-container">
      <div className="form-card">
        <h2>🎴 Ingresar</h2>
        <form onSubmit={handleSubmit}>
          <div className="campo">
            <label>Email del adulto responsable</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ejemplo@email.com"
              required
            />
          </div>
          <div className="campo">
            <label>PIN (6 números)</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••"
              className="input-pin"
              required
            />
          </div>
          <button type="submit" className="btn-primary btn-block" disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <p className="form-footer">
          ¿No tenés cuenta? <Link to="/registro">Registrate acá</Link>
        </p>
        <p className="form-footer">
          <Link to="/olvide-pin">¿Olvidaste tu PIN?</Link>
        </p>
      </div>
    </div>
  )
}