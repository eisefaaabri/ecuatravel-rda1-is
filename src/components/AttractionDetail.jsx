import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AtraccionesService } from '../services/api';
import {
  normalizeAtraccion,
  formatPrice,
  attractionImageUrl,
} from '../utils/atraccion';
import CheckoutCard from './CheckoutCard';
import CheckoutModal from './CheckoutModal';
import WishlistButton from './WishlistButton';
import ReviewsSection from './ReviewsSection';
import { IconGlobe, IconCalendar } from './icons/EcuadorIcons';

const parseItinerary = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') return value.split('\n').map((s) => s.trim()).filter(Boolean);
  return [];
};

const AttractionDetail = () => {
  const { id } = useParams();
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    AtraccionesService.getById(id)
      .then((data) => {
        if (!cancelled) setRaw(data.data ?? data);
      })
      .catch(() => {
        if (!cancelled) setError('No pudimos cargar esta experiencia. Intenta de nuevo.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const a = normalizeAtraccion(raw);
  const heroSrc = raw ? attractionImageUrl(raw, 1200) : '';
  const itinerarySteps = parseItinerary(a?.itinerario);
  const includes = Array.isArray(a?.incluye) ? a.incluye : [];
  const isAvailable = !a || a.estado === 'ACTIVA';

  if (loading) {
    return (
      <div className="section-grid py-16" role="status" aria-live="polite">
        <div className="animate-pulse space-y-6 max-w-4xl">
          <div className="h-8 bg-ec-mist rounded w-2/3" />
          <div className="h-64 bg-ec-mist rounded-2xl" />
          <div className="h-4 bg-ec-mist rounded w-full" />
          <div className="h-4 bg-ec-mist rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (error || !a) {
    return (
      <div className="section-grid py-20 text-center">
        <p className="text-ec-slate mb-6" role="alert">
          {error ?? 'Experiencia no encontrada.'}
        </p>
        <Link to="/experiencias" className="btn-primary px-8 inline-flex">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <article className="pb-16 md:pb-24">
      <nav className="section-grid py-4 text-sm text-ec-slate" aria-label="Ruta de navegación">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link to="/" className="hover:text-ec-pacific font-semibold">
              Inicio
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to="/experiencias" className="hover:text-ec-pacific font-semibold">
              Catálogo
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ec-ink font-bold truncate max-w-[200px] sm:max-w-none" aria-current="page">
            {a.nombre}
          </li>
        </ol>
      </nav>

      <header className="section-grid mb-8 md:mb-10">
<div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ec-pacific/10 px-3 py-1 text-xs font-bold text-ec-pacific">
              <IconGlobe className="w-3.5 h-3.5" />
              Salida {a.codigo_aeropuerto}
            </span>
            {a.duracion && (
              <span className="text-xs font-semibold text-ec-slate">{a.duracion}</span>
            )}
            {!isAvailable && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                No disponible: {a.estado}
              </span>
            )}
            <WishlistButton atraccionId={a.id} className="ml-auto" />
          </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-ec-ink tracking-tight max-w-4xl">
          {a.nombre}
        </h1>
        <p className="mt-4 text-lg text-ec-slate max-w-3xl leading-relaxed">
          {a.descripcion?.split('.')[0] ? `${a.descripcion.split('.')[0]}.` : a.descripcion}
        </p>
      </header>

      <div className="section-grid detail-grid">
        <div className="space-y-8 min-w-0">
          <figure className="rounded-2xl overflow-hidden shadow-ec-card border border-ec-mist/80 m-0">
            <img
              src={heroSrc}
              alt={`Imagen principal de la experiencia ${a.nombre}`}
              loading="eager"
              fetchPriority="high"
              width={1200}
              height={675}
              className="w-full aspect-[16/10] object-cover"
            />
          </figure>

          <section aria-labelledby="detail-overview">
            <h2 id="detail-overview" className="text-xl font-extrabold text-ec-ink mb-3">
              Resumen
            </h2>
            <p className="text-ec-slate leading-relaxed whitespace-pre-line">{a.descripcion}</p>
          </section>

          {(includes.length > 0 || itinerarySteps.length > 0) && (
            <section className="prose-disclosure space-y-3" aria-label="Información adicional del tour">
              {includes.length > 0 && (
                <details>
                  <summary>
                    Qué incluye
                    <span className="text-ec-pacific text-sm font-bold" aria-hidden="true">
                      Ver
                    </span>
                  </summary>
                  <div className="disclosure-body">
                    <ul className="list-disc pl-5 space-y-1">
                      {includes.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </details>
              )}

              {itinerarySteps.length > 0 && (
                <details>
                  <summary>
                    Itinerario detallado
                    <span className="text-ec-pacific text-sm font-bold" aria-hidden="true">
                      Ver
                    </span>
                  </summary>
                  <div className="disclosure-body">
                    <ol className="list-decimal pl-5 space-y-2">
                      {itinerarySteps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </details>
              )}
            </section>
          )}

          <section className="prose-disclosure" aria-label="Disponibilidad de la atracción">
            <details open>
              <summary>
                Disponibilidad
                <span className="text-ec-pacific text-sm font-bold" aria-hidden="true">
                  Ver
                </span>
              </summary>
              <div className="disclosure-body">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <IconGlobe className="w-4 h-4 text-ec-pacific" />
                    Punto de salida: aeropuerto {a.codigo_aeropuerto}.
                  </li>
                  <li>
                    Estado:{' '}
                    <strong className="text-ec-ink">{a.estado}</strong>.
                  </li>
                  <li>
                    Capacidad diaria:{' '}
                    <strong className="text-ec-ink">
                      {a.capacidad_diaria != null ? `${a.capacidad_diaria} plazas` : 'Consultar'}
                    </strong>
                    .
                  </li>
                  <li>
                    Consulta los cupos reales de tu fecha al continuar con la reserva.
                  </li>
                </ul>
              </div>
            </details>
          </section>

          <ReviewsSection atraccionId={a.id} />
        </div>

        <div className="lg:sticky lg:top-24 space-y-4">
          <CheckoutCard atraccion={a} onReserve={() => setCheckoutOpen(true)} />
          <p className="text-xs text-ec-slate text-center px-2">
            Precio por persona:{' '}
            <strong className="text-ec-ink">{formatPrice(a.precio_base)}</strong>.
          </p>
          {isAvailable ? (
            <button
              type="button"
              onClick={() => setCheckoutOpen(true)}
              className="btn-secondary w-full min-h-11 py-3 inline-flex justify-center gap-2"
            >
              <IconCalendar className="w-4 h-4" />
              Reservar
            </button>
          ) : (
            <div
              className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
              role="status"
            >
              Esta experiencia no está disponible para reservar en este momento (estado:{' '}
              <strong>{a.estado}</strong>).
            </div>
          )}
        </div>
      </div>

      {checkoutOpen && (
        <CheckoutModal atraccion={a} isOpen onClose={() => setCheckoutOpen(false)} />
      )}
    </article>
  );
};

export default AttractionDetail;
