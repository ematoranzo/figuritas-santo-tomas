import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [noticias, setNoticias] = useState([]);
  const [config, setConfig] = useState({});

  useEffect(() => {
    supabase
      .from('noticia')
      .select('*')
      .eq('estado', 'publicada')
      .eq('destacada', true)
      .order('fecha_publicacion', { ascending: false })
      .limit(3)
      .then(({ data }) => setNoticias(data || []));

    supabase
      .from('config_sitio')
      .select('clave, valor')
      .then(({ data }) => {
        const cfg = {};
        data?.forEach((r) => (cfg[r.clave] = r.valor));
        setConfig(cfg);
      });
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
        <img src="/logo.png" alt="FigurItas Santo Tomás" className="hero-logo" />
<h1>{config.nombre_sitio || 'FigurItas Santo Tomás'}</h1>
          <p>
            {config.mensaje_bienvenida ||
              '¡Bienvenidos a la plataforma de intercambio de figuritas!'}
          </p>
          <div className="hero-actions">
            <Link to="/registro" className="btn-primary btn-grande">
              Registrarse
            </Link>
            <Link to="/login" className="btn-secondary btn-grande">
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>
      <section className="como-funciona">
        <h2>¿Cómo funciona?</h2>
        <div className="pasos">
          <div className="paso">
            <span className="paso-num">1</span>
            <h3>Registrate</h3>
            <p>
              Completá el formulario con los datos del alumno y del adulto
              responsable.
            </p>
          </div>
          <div className="paso">
            <span className="paso-num">2</span>
            <h3>Cargá tus figuritas</h3>
            <p>
              Marcá cuáles te faltan y cuáles tenés repetidas en cada álbum.
            </p>
          </div>
          <div className="paso">
            <span className="paso-num">3</span>
            <h3>¡Intercambiá!</h3>
            <p>
              El sistema busca automáticamente quién tiene lo que necesitás.
            </p>
          </div>
        </div>
      </section>
      {noticias.length > 0 && (
        <section className="noticias">
          <h2>Novedades</h2>
          <div className="noticias-grid">
            {noticias.map((n) => (
              <div key={n.id} className="noticia-card">
                {n.imagen && <img src={n.imagen} alt={n.titulo} />}
                <h3>{n.titulo}</h3>
                <p>{n.resumen}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
