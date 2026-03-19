import { Link } from 'react-router-dom'

export default function Privacidad() {
  return (
    <div className="form-container">
      <div className="form-card form-card-wide">
        <h2>🔒 Política de Privacidad</h2>
        <p className="form-subtitle">FigurItas Santo Tomás · Versión 1.0 · Marzo 2026</p>

        <div className="privacidad-contenido">

          <h3>1. Propósito de la plataforma</h3>
          <p>FigurItas Santo Tomás es una plataforma web desarrollada exclusivamente con fines lúdicos y educativos para facilitar el intercambio de figuritas entre alumnos de nivel inicial y primaria del Colegio Santo Tomás de Santa Rosa, La Pampa. Su uso es voluntario y gratuito.</p>

          <h3>2. Datos que se recopilan</h3>
          <p>Para el funcionamiento de la plataforma se solicitan los siguientes datos:</p>
          <ul>
            <li>Nombre y apellido del alumno</li>
            <li>Grado o sala del alumno</li>
            <li>Nombre, apellido y email del adulto responsable</li>
            <li>Información sobre figuritas faltantes y repetidas</li>
          </ul>
          <p>No se solicitan ni almacenan datos sensibles como documentos de identidad, datos bancarios, domicilios ni fotografías.</p>

          <h3>3. Uso de los datos</h3>
          <p>Los datos recopilados se utilizan únicamente para:</p>
          <ul>
            <li>Facilitar la búsqueda de coincidencias de figuritas entre familias</li>
            <li>Enviar emails de contacto entre adultos responsables para coordinar intercambios. Al registrarse usted está aceptando que podrá recibir correos electrónicos de otros usuarios para coordinar el intercambio de figuritas.</li>
            <li>Administrar el acceso a la plataforma</li>
          </ul>
          <p>Los datos no serán compartidos con terceros, ni utilizados con fines comerciales o publicitarios.</p>

          <h3>4. Protección de menores</h3>
          <p>La plataforma está diseñada para proteger la privacidad de los menores. Toda comunicación entre usuarios se realiza exclusivamente a través del email del adulto responsable. En ningún caso se expone información de contacto directo de los alumnos.</p>

          <h3>5. Seguridad</h3>
          <p>Los datos se almacenan en servidores seguros provistos por Supabase con cifrado en tránsito (HTTPS). El acceso a la plataforma está protegido por contraseña y requiere aprobación de la administradora.</p>

          <h3>6. Limitación de responsabilidad</h3>
          <p>FigurItas Santo Tomás fue desarrollada íntegramente con fines lúdicos, como proyecto escolar. Ni el desarrollador ni la administradora de la plataforma asumen responsabilidad alguna por:</p>
          <ul>
            <li>El resultado de los intercambios coordinados a través de la plataforma</li>
            <li>El uso indebido de la información por parte de los usuarios</li>
            <li>Interrupciones, errores o pérdida de datos derivados del uso de la plataforma</li>
            <li>Cualquier daño directo o indirecto derivado del uso o imposibilidad de uso de la plataforma</li>
          </ul>
          <p>El uso de la plataforma implica la aceptación de estas condiciones.</p>

          <h3>7. Eliminación de datos</h3>
          <p>Las familias pueden solicitar la eliminación de sus datos. La baja se procesará en un plazo razonable.</p>

          <h3>8. Modificaciones</h3>
          <p>Esta política puede actualizarse en cualquier momento. Se notificará a los usuarios registrados ante cambios significativos.</p>

          <div className="privacidad-footer">
            <p>FigurItas Santo Tomás · Proyecto escolar 2026 · Inés · Colegio Santo Tomás, Santa Rosa, La Pampa.</p>
          </div>
        </div>

        <Link to="/" className="btn-secondary btn-block" style={{ textAlign: 'center', marginTop: 24 }}>
          ← Volver al inicio
        </Link>
      </div>
    </div>
  )
}