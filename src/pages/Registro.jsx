import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const ALUMNO_VACIO = { nombre: '', apellido: '', id_grado_sala: '' }

export default function Registro() {
  const navigate = useNavigate()
  const [grados, setGrados] = useState([])
  const [cargando, setCargando] = useState(false)
  const [form, setForm] = useState({
    nombre_adulto: '', apellido_adulto: '',
    email_adulto: '', pin: '', pin2: ''
  })
  const [alumnos, setAlumnos] = useState([{ ...ALUMNO_VACIO }])

  useEffect(() => {
    supabase.from('grado_sala')
      .select('*')
      .eq('estado', 'activo')
      .order('nivel').order('descripcion')
      .then(({ data }) => setGrados(data || []))
  }, [])

  function handleChange(e) {
    const val = e.target.name === 'pin' || e.target.name === 'pin2'
      ? e.target.value.replace(/\D/g, '').slice(0, 6)
      : e.target.value
    setForm(f => ({ ...f, [e.target.name]: val }))
  }

  function handleAlumnoChange(idx, field, value) {
    setAlumnos(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a))
  }

  function agregarAlumno() {
    setAlumnos(prev => [...prev, { ...ALUMNO_VACIO }])
  }

  function quitarAlumno(idx) {
    if (alumnos.length === 1) { toast.error('Debe haber al menos un alumno'); return }
    setAlumnos(prev => prev.filter((_, i) => i !== idx))
  }

  async function enviarEmailBienvenida(gradosMap) {
    try {
      const alumnosEmail = alumnos.map(a => ({
        nombre: a.nombre.trim(),
        apellido: a.apellido.trim(),
        grado: gradosMap[a.id_grado_sala] || ''
      }))

      await supabase.functions.invoke('enviar-email', {
        body: {
          tipo: 'bienvenida',
          emailDestino: form.email_adulto.trim(),
          nombreAdulto: `${form.nombre_adulto.trim()} ${form.apellido_adulto.trim()}`,
          alumnos: alumnosEmail
        }
      })
    } catch (err) {
      console.error('Error enviando email de bienvenida:', err)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.pin.length !== 6) { toast.error('El PIN debe tener 6 números'); return }
    if (form.pin !== form.pin2) { toast.error('Los PINs no coinciden'); return }
    for (const a of alumnos) {
      if (!a.nombre.trim() || !a.apellido.trim()) { toast.error('Completá nombre y apellido de todos los alumnos'); return }
      if (!a.id_grado_sala) { toast.error('Seleccioná el grado de todos los alumnos'); return }
    }

    setCargando(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email_adulto,
        password: form.pin,
      })
      if (authError) throw authError

      const { error: familiaError } = await supabase.from('familia').insert({
        id: authData.user.id,
        nombre_adulto: form.nombre_adulto.trim(),
        apellido_adulto: form.apellido_adulto.trim(),
        email_adulto: form.email_adulto.trim(),
        estado: 'pendiente',
        rol: 'usuario'
      })
      if (familiaError) throw familiaError

      const alumnosData = alumnos.map(a => ({
        id_familia: authData.user.id,
        nombre: a.nombre.trim(),
        apellido: a.apellido.trim(),
        id_grado_sala: a.id_grado_sala,
        activo: true
      }))
      const { error: alumnosError } = await supabase.from('alumno').insert(alumnosData)
      if (alumnosError) throw alumnosError

      // Armar mapa de grados para el email
      const gradosMap = {}
      grados.forEach(g => { gradosMap[g.id] = g.descripcion })

      // Enviar email de bienvenida (no bloqueante)
      enviarEmailBienvenida(gradosMap)

      toast.success('¡Registro enviado! Revisá tu email. La administradora revisará tu solicitud.')
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

          <h3 className="form-section">PIN de acceso familiar</h3>
          <p className="form-hint">Este PIN lo usarán todos los hijos de esta familia para ingresar.</p>
          <div className="campo-grupo">
            <div className="campo">
              <label>PIN (6 números)</label>
              <input name="pin" type="password" inputMode="numeric" maxLength={6} value={form.pin} onChange={handleChange} required placeholder="••••••" className="input-pin" />
            </div>
            <div className="campo">
              <label>Repetir PIN</label>
              <input name="pin2" type="password" inputMode="numeric" maxLength={6} value={form.pin2} onChange={handleChange} required placeholder="••••••" className="input-pin" />
            </div>
          </div>

          <h3 className="form-section">Alumnos</h3>
          <p className="form-hint">Podés agregar todos los hijos que están en el colegio.</p>

          {alumnos.map((alumno, idx) => (
            <div key={idx} className="alumno-card">
              <div className="alumno-card-header">
                <span className="alumno-num">Alumno {idx + 1}</span>
                {alumnos.length > 1 &&
                  <button type="button" onClick={() => quitarAlumno(idx)} className="btn-quitar">✕ Quitar</button>
                }
              </div>
              <div className="campo-grupo">
                <div className="campo">
                  <label>Nombre</label>
                  <input value={alumno.nombre} onChange={e => handleAlumnoChange(idx, 'nombre', e.target.value)} required placeholder="Nombre del alumno" />
                </div>
                <div className="campo">
                  <label>Apellido</label>
                  <input value={alumno.apellido} onChange={e => handleAlumnoChange(idx, 'apellido', e.target.value)} required placeholder="Apellido del alumno" />
                </div>
              </div>
              <div className="campo">
                <label>Grado / Sala</label>
                <select value={alumno.id_grado_sala} onChange={e => handleAlumnoChange(idx, 'id_grado_sala', e.target.value)} required>
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
            </div>
          ))}

          <button type="button" onClick={agregarAlumno} className="btn-agregar-alumno">
            + Agregar otro alumno
          </button>

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