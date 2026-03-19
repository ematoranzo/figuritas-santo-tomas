import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function ResetearPin() {
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [pin2, setPin2] = useState('')
  const [cargando, setCargando] = useState(false)
  const [listo, setListo] = useState(false)

  useEffect(() => {
    // Verificar que hay una sesión activa (viene del link de email)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error('Link inválido o expirado')
        navigate('/login')
      }
    })
  }, [])

  function handlePin(e, setter) {
    setter(e.target.value.replace(/\D/g, '').slice(0, 6))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (pin.length !== 6) { toast.error('El PIN debe tener 6 números'); return }
    if (pin !== pin2) { toast.error('Los PINs no coinciden'); return }

    setCargando(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pin })
      if (error) throw error
      setListo(true)
      toast.success('¡PIN actualizado!')
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err) {
      toast.error('Error al actualizar el PIN')
    } finally {
      setCargando(false)
    }
  }

  if (listo) return (
    <div className="form-container">
      <div className="form-card" style={{ textAlign: 'center' }}>
        <span style={{ fontSize: '3rem' }}>✅</span>
        <h2 style={{ color: '#1a4a2e', margin: '16px 0 8px' }}>¡PIN actualizado!</h2>
        <p style={{ color: '#666' }}>Redirigiendo...</p>
      </div>
    </div>
  )

  return (
    <div className="form-container">
      <div className="form-card">
        <h2>🔑 Crear nuevo PIN</h2>
        <p className="form-subtitle">Elegí un PIN de 6 números que puedas recordar fácilmente.</p>
        <form onSubmit={handleSubmit}>
          <div className="campo">
            <label>PIN nuevo (6 números)</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={e => handlePin(e, setPin)}
              placeholder="••••••"
              className="input-pin"
              required
            />
          </div>
          <div className="campo">
            <label>Repetir PIN nuevo</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin2}
              onChange={e => handlePin(e, setPin2)}
              placeholder="••••••"
              className="input-pin"
              required
            />
          </div>
          <button type="submit" className="btn-primary btn-block" disabled={cargando}>
            {cargando ? 'Guardando...' : '✓ Guardar nuevo PIN'}
          </button>
        </form>
      </div>
    </div>
  )
}