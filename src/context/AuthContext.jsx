import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [familia, setFamilia] = useState(null)
  const [alumnos, setAlumnos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) cargarFamilia(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) cargarFamilia(session.user.id)
      else { setFamilia(null); setAlumnos([]); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function cargarFamilia(userId) {
    const { data: familiaData } = await supabase
      .from('familia')
      .select('*')
      .eq('id', userId)
      .single()
    setFamilia(familiaData)

    if (familiaData?.estado === 'aprobado') {
      const { data: alumnosData } = await supabase
        .from('alumno')
        .select('*, grado_sala(descripcion, nivel)')
        .eq('id_familia', userId)
        .eq('activo', true)
        .order('apellido')
      setAlumnos(alumnosData || [])
    }
    setLoading(false)
  }

  async function login(email, pin) {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pin })
    return { error }
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, familia, alumnos, loading, login, logout, cargarFamilia }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)