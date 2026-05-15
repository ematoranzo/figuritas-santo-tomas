import { supabase } from './lib/supabase'

async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('No hay sesión autenticada para esta acción')
  }
  return session.access_token
}

export async function enviarEmailBienvenida(emailDestino, nombreAdulto, alumnos) {
  try {
    console.log('📧 Enviando email de bienvenida a:', emailDestino)
    
    const response = await supabase.functions.invoke('enviar-email', {
      body: {
        tipo: 'bienvenida',
        emailDestino,
        nombreAdulto,
        alumnos,
      },
    })

    console.log('✅ Respuesta de Edge Function:', response)

    if (response.error) {
      console.error('❌ Error de Edge Function:', response.error)
      throw new Error(response.error.message || 'Error desconocido al enviar email de bienvenida')
    }

    return response.data
  } catch (error) {
    console.error('❌ Error en enviarEmailBienvenida:', {
      message: error.message,
      stack: error.stack,
      error: error
    })
    throw error
  }
}

export async function enviarEmailAprobacion(emailDestino, nombreAdulto) {
  try {
    console.log('📧 Enviando email de aprobación a:', emailDestino)
    
    const token = await getAuthToken()

    const response = await supabase.functions.invoke('enviar-email', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        tipo: 'aprobacion',
        emailDestino,
        nombreAdulto,
      },
    })

    console.log('✅ Respuesta de Edge Function:', response)

    if (response.error) {
      console.error('❌ Error de Edge Function:', response.error)
      throw new Error(response.error.message || 'Error desconocido al enviar email de aprobación')
    }

    return response.data
  } catch (error) {
    console.error('❌ Error en enviarEmailAprobacion:', {
      message: error.message,
      stack: error.stack,
      error: error
    })
    throw error
  }
}

export async function enviarEmailCoincidencia({
  emailDestino,
  nombreAdultoDestino,
  nombreAlumnoOrigen,
  gradoOrigen,
  emailAdultoOrigen,
  nombreFamiliaOrigen,
  nombreAlumnoDestino,
  nombreAlbum,
  figuritasQueMeFaltanYVosTenes,
  figuritasQueTeFantanYYoTengo,
  idFamiliaDestino,
  idAlbum,
}) {
  try {
    console.log('📧 Enviando email de coincidencia a:', emailDestino)
    
    const token = await getAuthToken()

    const response = await supabase.functions.invoke('enviar-email', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        tipo: 'coincidencia',
        emailDestino,
        nombreAdultoDestino,
        nombreAlumnoOrigen,
        gradoOrigen,
        emailAdultoOrigen,
        nombreFamiliaOrigen,
        nombreAlumnoDestino,
        nombreAlbum,
        figuritasQueMeFaltanYVosTenes,
        figuritasQueTeFantanYYoTengo,
        idFamiliaDestino,
        idAlbum,
      },
    })

    console.log('✅ Respuesta de Edge Function:', response)

    if (response.error) {
      const errorMsg = response.error.message || 'Error desconocido'
      console.error('❌ Error de Edge Function:', response.error)
      
      if (errorMsg.includes('límite') || errorMsg.includes('429')) {
        throw new Error('Has alcanzado el límite de 5 emails por día')
      }
      
      throw new Error(errorMsg)
    }

    return response.data
  } catch (error) {
    console.error('❌ Error en enviarEmailCoincidencia:', {
      message: error.message,
      stack: error.stack,
      error: error
    })
    throw error
  }
}

export async function enviarEmail(tipo, payload, requiresAuth = true) {
  try {
    console.log(`📧 Enviando email de tipo: ${tipo}`)
    
    const options = {
      body: {
        tipo,
        ...payload,
      },
    }

    if (requiresAuth) {
      const token = await getAuthToken()
      options.headers = {
        Authorization: `Bearer ${token}`,
      }
    }

    const response = await supabase.functions.invoke('enviar-email', options)

    console.log('✅ Respuesta de Edge Function:', response)

    if (response.error) {
      console.error('❌ Error de Edge Function:', response.error)
      throw new Error(response.error.message || `Error desconocido al enviar email de tipo ${tipo}`)
    }

    return response.data
  } catch (error) {
    console.error(`❌ Error en enviarEmail (${tipo}):`, {
      message: error.message,
      stack: error.stack,
      error: error
    })
    throw error
  }
}

export async function validarDisponibilidadEmail() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return {
        canSend: false,
        reason: 'No hay sesión autenticada',
      }
    }

    return {
      canSend: true,
      reason: 'Sesión válida',
      userEmail: session.user.email,
    }
  } catch (error) {
    return {
      canSend: false,
      reason: `Error: ${error.message}`,
    }
  }
}