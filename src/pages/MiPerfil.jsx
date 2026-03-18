import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function MiPerfil() {
  const { familia, cargarFamilia, user } = useAuth()
  const navigate = useNavigate()
  const [cargando, setCargando] = useState(false)
  const [cambiandoPin, setCambiandoPin] = useState(false)
  const [form, setForm] = useState({
    nombre_adulto: familia?.nombre_adulto || '',
    apellido_adulto: familia?.apellido_adulto || '',
    email_adulto: familia?.email_adulto || '',
  })
  const [pinForm, setPinForm] = useState({
    pin_actual: '',
    pin_nuevo: '',
    pin_nuevo2: ''
  })

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handlePinChange(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6)
    setPinForm(f => ({ ...f, [e.target.name]: val }))
  }

  async function guardarDatos(e) {
    e.preventDefault()
    if (!form.nombre_adulto.trim() || !form.apellido_adulto.trim()) {
      toast.error('Completá nombre y apellido')
      return
    }
    setCargando(true)
    try {
      const { error } = await supabase
        .from('familia')
        .update({
          nombre_adulto: form.nombre_adulto.trim(),
          apellido_adulto: form.apellido_adulto.trim(),
          email_adulto: form.email_adulto.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', familia.id)

      if (error) throw error
      await cargarFamilia(user.id)
      toast.success('¡Datos actualizados!')
    } catch (err) {
      toast.error('Error al guardar')
    } finally {
      setCargando(false)
    }
  }

  async function cambiarPin(e) {
    e.preventDefault()
    if (pinForm.pin_nuevo.length !== 6) {
      toast.error('El PIN nuevo debe tener 6 números')
      return
    }
    if (pinForm.pin_nuevo !== pinForm.pin_nuevo2) {
      toast.error('Los PINs nuevos no coinciden')
      return
    }
    setCargando(true)
    try {
      // Verificar PIN actual
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: familia.email_adulto,
        password: pinForm.pin_actual
      })
      if (loginError) {
        toast.error('PIN actual incorrecto')
        return
      }

      // Cambiar PIN
      const { error } = await supabase.auth.updateUser({
        password: pinForm.pin_nuevo
      })
      if (error) throw error

      toast.success('¡PIN actualizado!')
      setPinForm({ pin_actual: '', pin_nuevo: '', pin_nuevo2: '' })
      setCambiandoPin(false)
    } catch (err) {
      toast.error('Error al cambiar PIN')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="form-container">
      <div className="form-card form-card-wide">
        <div className="perfil-header">
          <button onClick={() => navigate('/dashboard')} className="btn-volver">← Volver</button>
          <h2>👤 Mi perfil</h2>
        </div>
        <p className="form-subtitle">Actualizá los datos del adulto responsable de la familia.</p>

        <form onSubmit={guardarDatos}>
          <h3 className="form-section">Datos del adulto responsable</h3>
          <div className="campo-grupo">
            <div className="campo">
              <label>Nombre</label>
              <input
                name="nombre_adulto"
                value={form.nombre_adulto}
                onChange={handleChange}
                required
                placeholder="Nombre"
              />
            </div>
            <div className="campo">
              <label>Apellido</label>
              <input
                name="apellido_adulto"
                value={form.apellido_adulto}
                onChange={handleChange}
                required
                placeholder="Apellido"
              />
            </div>
          </div>
          <div className="campo">
            <label>Email</label>
            <input
              name="email_adulto"
              type="email"
              value={form.email_adulto}
              onChange={handleChange}
              required
              placeholder="email@ejemplo.com"
            />
          </div>
          <button type="submit" className="btn-primary btn-block" disabled={cargando}>
            {cargando ? 'Guardando...' : '💾 Guardar datos'}
          </button>
        </form>

        <h3 className="form-section" style={{ marginTop: 32 }}>Seguridad</h3>
        {!cambiandoPin ? (
          <button
            onClick={() => setCambiandoPin(true)}
            className="btn-secondary btn-block"
          >
            🔑 Cambiar PIN
          </button>
        ) : (
          <form onSubmit={cambiarPin}>
            <div className="campo">
              <label>PIN actual</label>
              <input
                name="pin_actual"
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pinForm.pin_actual}
                onChange={handlePinChange}
                required
                placeholder="••••••"
                className="input-pin"
              />
            </div>
            <div className="campo-grupo">
              <div className="campo">
                <label>PIN nuevo</label>
                <input
                  name="pin_nuevo"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinForm.pin_nuevo}
                  onChange={handlePinChange}
                  required
                  placeholder="••••••"
                  className="input-pin"
                />
              </div>
              <div className="campo">
                <label>Repetir PIN nuevo</label>
                <input
                  name="pin_nuevo2"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinForm.pin_nuevo2}
                  onChange={handlePinChange}
                  required
                  placeholder="••••••"
                  className="input-pin"
                />
              </div>
            </div>
            <div className="admin-form-actions">
              <button type="submit" className="btn-primary" disabled={cargando}>
                {cargando ? 'Guardando...' : '✓ Confirmar cambio'}
              </button>
              <button type="button" onClick={() => setCambiandoPin(false)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}