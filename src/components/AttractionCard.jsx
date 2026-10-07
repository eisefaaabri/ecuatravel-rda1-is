import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  formatPrice,
  normalizeAtraccion,
  attractionThumbUrl,
} from '../utils/atraccion';
import { IconGlobe, IconCalendar } from './icons/EcuadorIcons';
import WishlistButton from './WishlistButton';

const AttractionCard = ({ raw, onReserve }) => {
  const a = normalizeAtraccion(raw);
  const [expanded, setExpanded] = useState(false);
  const imgSrc = attractionThumbUrl(raw);
  const desc = a.descripcion || '';
  const showToggle = desc.length > 120;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-ec-mist/90 bg-white shadow-sm transition-all duration-300 hover:shadow-ec-card hover:-translate-y-1">
      <div className="relative block h-52 md:h-56 overflow-hidden focus-within:ring-2 focus-within:ring-ec-volcano focus-within:ring-offset-2">
        <Link
          to={`/experiencias/${a.id}`}
          className="absolute inset-0"
          aria-label={`Ver detalle de ${a.nombre}`}
        >
          <img
            src={imgSrc}
            alt={`Vista de ${a.nombre}, Ecuador`}
            loading="lazy"
            decoding="async"
            width={600}
            height={400}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ec-ink/50 via-transparent to-transparent opacity-80" aria-hidden="true" />
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-ec-pacific shadow-sm">
            <IconGlobe className="w-3.5 h-3.5" />
            {a.codigo_aeropuerto}
          </span>
          {a.estado && a.estado !== 'ACTIVA' && (
            <span className="absolute top-14 left-3 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 shadow-sm">
              {a.estado}
            </span>
          )}
        </Link>
        <WishlistButton atraccionId={a.id} className="absolute top-3 right-3 z-10" />
      </div>

      <div className="flex flex-col flex-grow p-5 md:p-6 gap-3">
        <h3 className="text-lg font-extrabold text-ec-ink leading-snug">
          <Link to={`/experiencias/${a.id}`} className="hover:text-ec-pacific transition-colors">
            {a.nombre}
          </Link>
        </h3>

        {a.duracion && (
          <span className="inline-flex w-fit items-center rounded-full bg-ec-mist px-2.5 py-0.5 text-xs font-bold text-ec-slate">
            Duración: {a.duracion}
          </span>
        )}

        <div className="text-sm text-ec-slate">
          <p id={`desc-${a.id}`} className={expanded ? '' : 'line-clamp-2'}>
            {desc || 'Descubre esta experiencia en el detalle del tour.'}
          </p>
          {showToggle && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-xs font-bold text-ec-pacific hover:text-ec-pacific-light min-h-[30px] px-1 -ml-1 rounded"
              aria-expanded={expanded}
              aria-controls={`desc-${a.id}`}
            >
              {expanded ? 'Menos detalles' : 'Más detalles'}
            </button>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-ec-mist flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ec-slate">Desde</span>
            <p className="text-2xl font-extrabold text-ec-ink tabular-nums">{formatPrice(a.precio_base)}</p>
          </div>
          <button
            type="button"
            onClick={() => onReserve(a)}
            className="btn-primary px-5 py-2.5 text-sm shrink-0"
            aria-label={`Reservar ${a.nombre}`}
          >
            <IconCalendar className="w-4 h-4" />
            Reservar
          </button>
        </div>
      </div>
    </article>
  );
};

export default AttractionCard;
