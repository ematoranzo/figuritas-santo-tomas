import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Registro() {
  const navigate = useNavigate()
  const [grados, setGrados] = useState([])
  const [cargando, setCargando] = useState(false)
  const [form, setForm] = useState({
    nombre_alumno: '', apellido_alumno: '',
    nombre_adulto: '', apellido_adulto: '',
    email_adulto: '', id_grado_sala: '', pin: '', pin2: ''
  })

  useEffect(() => {
    supabase.from('grado_sala')
      .select('*')
      .eq('estado', 'activo')
      .order('nivel').order('descripcion')
      .then(({ data }) => setGrados(data || []))
  }, [])

  function handleChange(e) {
    const val = e.target.name === 'pin' || e.target.name === 'pin2'
      ? e.target.value.replace(/\D/g, '').slice(0, 4)
      : e.target.value
    setForm(f => ({ ...f, [e.target.name]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.pin.length !== 4) { toast.error('El PIN debe tener 4 números'); return }
    if (form.pin !== form.pin2) { toast.error('Los PINs no coinciden'); return }
    if (!form.id_grado_sala) { toast.error('Seleccioná un grado o sala'); return }
    setCargando(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email_adulto,
        password: form.pin,
      })
      if (authError) throw authError
      const { error: perfilError } = await supabase.from('usuario').insert({
        id: authData.user.id,
        nombre_alumno: form.nombre_alumno.trim(),
        apellido_alumno: form.apellido_alumno.trim(),
        nombre_adulto: form.nombre_adulto.trim(),
        apellido_adulto: form.apellido_adulto.trim(),
        email_adulto: form.email_adulto.trim(),
        id_grado_sala: form.id_grado_sala,
        estado: 'pendiente',
        rol: 'usuario'
      })
      if (perfilError) throw perfilError
      toast.success('¡Registro enviado! La administradora revisará tu solicitud.')
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Error al registrarse. Intentá de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  const inicialesGrado = grados.filter(g => g.nivel === 'Inicial')
  const primariaGrado = grados.filter(g => g.nivel === 'Primaria')

  return (
    <div className="form-container">
      <div className="form-card form-card-wide">
        <h2>📝 Registrarse</h2>
        <p className="form-subtitle">Completá los datos para unirte a la comunidad de intercambio.</p>
        <form onSubmit={handleSubmit}>
          <h3 className="form-section">Datos del alumno</h3>
          <div className="campo-grupo">
            <div className="campo">
              <label>Nombre</label>
              <input name="nombre_alumno" value={form.nombre_alumno} onChange={handleChange} required placeholder="Nombre del alumno" />
            </div>
            <div className="campo">
              <label>Apellido</label>
              <input name="apellido_alumno" value={form.apellido_alumno} onChange={handleChange} required placeholder="Apellido del alumno" />
            </div>
          </div>
          <div className="campo">
            <label>Grado / Sala</label>
            <select name="id_grado_sala" value={form.id_grado_sala} onChange={handleChange} required>
              <option value="">Seleccioná...</option>
              {inicialesGrado.length > 0 && (
                <optgroup label="Nivel Inicial">
                  {inicialesGrado.map(g => <option key={g.id} value={g.id}>{g.descripcion}</option>)}
                </optgroup>
              )}
              {primariaGrado.length > 0 && (
                <optgroup label="Nivel Primaria">
                  {primariaGrado.map(g => <option key={g.id} value={g.id}>{g.descripcion}</option>)}
                </optgroup>
              )}
            </select>
          </div>
          <h3 className="form-section">Datos del adulto responsable</h3>
          <div className="campo-grupo">
            <div className="campo">
              <label>Nombre</label>
              <input name="nombre_adulto" value={form.nombre_adulto} onChange={handleChange} required placeholder="Nombre del adulto" />
            </div>
            <div className="campo">
              <label>Apellido</label>
              <input name="apellido_adulto" value={form.apellido_adulto} onChange={handleChange} required placeholder="Apellido del adulto" />
            </div>
          </div>
          <div className="campo">
            <label>Email</label>
            <input name="email_adulto" type="email" value={form.email_adulto} onChange={handleChange} required placeholder="email@ejemplo.com" />
          </div>
          <h3 className="form-section">PIN de acceso</h3>
          <p className="form-hint">Elegí 4 números que el alumno pueda recordar fácilmente.</p>
          <div className="campo-grupo">
            <div className="campo">
              <label>PIN (4 números)</label>
              <input name="pin" type="password" inputMode="numeric" maxLength={4} value={form.pin} onChange={handleChange} required placeholder="••••" className="input-pin" />
            </div>
            <div className="campo">
              <label>Repetir PIN</label>
              <input name="pin2" type="password" inputMode="numeric" maxLength={4} value={form.pin2} onChange={handleChange} required placeholder="••••" className="input-pin" />
            </div>
          </div>
          <button type="submit" className="btn-primary btn-block" disabled={cargando}>
            {cargando ? 'Enviando...' : 'Enviar solicitud de registro'}
          </button>
        </form>
        <p className="form-footer">
          ¿Ya tenés cuenta? <Link to="/login">Ingresá acá</Link>
        </p>
      </div>
    </div>
  )
}