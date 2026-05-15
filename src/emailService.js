# 🐛 FIX: Error "Unexpected token '<'" - JSON Error

**Error:** `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

**Significa:** La Edge Function está devolviendo HTML en lugar de JSON

---

## ⚡ FIX RÁPIDO (5 minutos)

### Paso 1: Reemplazar `emailService.js`

Copia `emailService-MEJORADO.js` a `src/emailService.js`

**Cambios principales:**
- Mejor logging (verás exactamente qué devuelve la función)
- Mejor manejo de errores
- Diagnóstico completo

### Paso 2: Abre F12 en StackBlitz

```
F12 → Console → Limpia (Clear)
```

### Paso 3: Intenta registrarte

Mira la consola y **copia TODO lo que dice**

---

## 🔍 DIAGNÓSTICO

Abre F12 y busca logs como estos:

### Si ves ESTO: ✅ (está funcionando)
```
📧 Enviando email de bienvenida a: test@example.com
   URL: https://coboosdqzqdktzmwmpwk.supabase.co/functions/v1/enviar-email
✅ Respuesta de Edge Function: {data: {ok: true}}
```

### Si ves ESTO: ❌ (hay error)
```
❌ Error en enviarEmailBienvenida: {
  message: "Unexpected token '<'...",
  stack: "...",
  error: {...}
}
```

---

## 🔧 CAUSAS Y SOLUCIONES

### Causa 1: URL INCORRECTA

**Problema:** La URL de la Edge Function está mal en `emailService.js`

**Verificación:**
```javascript
// En emailService.js línea 6, debe ser EXACTAMENTE esto:
const EDGE_FUNCTION_URL = 'https://coboosdqzqdktzmwmpwk.supabase.co/functions/v1/enviar-email'
```

**¿Cómo sé cuál es la URL correcta?**
1. Ve a https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a: Functions → enviar-email
4. Copia la URL que aparece (debería ser la que puse arriba)

---

### Causa 2: ERROR EN LA EDGE FUNCTION

**Verificación:**
1. Ve a https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a: Functions → enviar-email → Logs
4. ¿Ves errores rojos?

**Si hay errores:**
- Copia el error exacto
- Esto te dirá exactamente qué está fallando

---

### Causa 3: HEADERS INCORRECTOS

**En emailService.js, la llamada a Supabase debe ser así:**

```javascript
const response = await supabase.functions.invoke('enviar-email', {
  body: {
    tipo: 'bienvenida',
    emailDestino,
    nombreAdulto,
    alumnos,
  },
})
```

**NO así:**
```javascript
// ❌ INCORRECTO - no hagas esto
const response = await supabase.functions.invoke('enviar-email', {
  headers: { ... },  // NO para emails públicos
  body: { ... }
})
```

---

### Causa 4: BODY MALFORMADO

**Verifica que TODOS los datos requeridos estén en el body:**

Para **bienvenida**:
```javascript
{
  tipo: 'bienvenida',
  emailDestino: 'email@ejemplo.com',  // ✅ Obligatorio
  nombreAdulto: 'Juan Pérez',          // ✅ Obligatorio
  alumnos: [                           // ✅ Obligatorio
    { nombre: 'María', apellido: 'García', grado: '1° grado' }
  ]
}
```

Para **aprobación**:
```javascript
{
  tipo: 'aprobacion',
  emailDestino: 'email@ejemplo.com',  // ✅ Obligatorio
  nombreAdulto: 'Juan Pérez'           // ✅ Obligatorio
}
```

Para **coincidencia**:
```javascript
{
  tipo: 'coincidencia',
  emailDestino: '...',                    // ✅ Obligatorio
  nombreAdultoDestino: '...',             // ✅ Obligatorio
  nombreAlumnoOrigen: '...',              // ✅ Obligatorio
  gradoOrigen: '...',                     // ✅ Obligatorio
  emailAdultoOrigen: '...',               // ✅ Obligatorio
  nombreFamiliaOrigen: '...',             // ✅ Obligatorio
  nombreAlumnoDestino: '...',             // ✅ Obligatorio
  nombreAlbum: '...',                     // ✅ Obligatorio
  figuritasQueMeFaltanYVosTenes: [...],   // ✅ Obligatorio (array)
  figuritasQueTeFantanYYoTengo: [...],    // ✅ Obligatorio (array)
  idFamiliaDestino: '...',                // ✅ Obligatorio
  idAlbum: '...'                          // ✅ Obligatorio
}
```

**Si falta algo, la Edge Function devuelve error 400.**

---

## 📝 PASOS DE DEBUGGING ORDENADOS

### Paso 1: Usa emailService-MEJORADO.js
```
Reemplaza src/emailService.js con emailService-MEJORADO.js
```

### Paso 2: Abre F12 y limpia la consola
```
F12 → Console → Clear (Ctrl+L)
```

### Paso 3: Intenta una acción (registrate, aprueba, envía email)

### Paso 4: Mira la consola
```
Deberías ver logs como:
📧 Enviando email de bienvenida a: test@example.com
   URL: https://coboosdqzqdktzmwmpwk.supabase.co/functions/v1/enviar-email
```

### Paso 5: Si ves error, copia TODO el log
```
Incluye el objeto completo que muestra:
message: "..."
stack: "..."
error: {...}
```

### Paso 6: Chequea Supabase Logs
```
https://app.supabase.com
→ Tu proyecto
→ Functions → enviar-email → Logs
→ ¿Hay errores? Cópialos
```

---

## 🎯 CHECKLIST

- [ ] Instalé `emailService-MEJORADO.js` en `src/emailService.js`
- [ ] Verifiqué que la URL es correcta en emailService.js
- [ ] Abrí F12 en StackBlitz
- [ ] Intenté una acción (registro, aprobación, etc.)
- [ ] Vi logs en la consola
- [ ] Si hay error, copié el log completo
- [ ] Checkeé Supabase Logs para errores de la Edge Function
- [ ] Verifiqué que todos los datos requeridos están en el body

---

## 💬 DESPUÉS DE DEBUGGING

Cuando tengas el error completo, comparte:

1. **Log de la consola del navegador** (del F12)
2. **Log de Supabase** (Functions → enviar-email → Logs)
3. **Qué acción estabas haciendo** (registrarse, aprobar, etc.)

Con eso podré diagnosticar exactamente qué está fallando.

---

## ⚡ CASO MÁS PROBABLE

Si el error es `<!DOCTYPE`, probablemente:

**La Edge Function está **inactiva** o **tiene un error**.**

**Solución:**
1. Ve a https://app.supabase.com
2. Functions → enviar-email
3. ¿Dice "ACTIVE"? Si no, hay un problema
4. Mira los Logs para ver qué error hay

---

**Usa emailService-MEJORADO.js y verás exactamente qué está fallando. 🔍**