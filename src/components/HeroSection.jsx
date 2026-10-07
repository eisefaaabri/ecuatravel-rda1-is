import React from 'react';
import heroLocal from '../assets/hero.png';
import { IconChevronRight } from './icons/EcuadorIcons';

const HERO_FALLBACK =
  'https://images.unsplash.com/photo-1590496889812-706f9d371457?auto=format&fit=crop&w=1920&q=80&auto=format';

const HeroSection = () => {
  const scrollToCatalog = () => {
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      className="relative w-full min-h-[min(85vh,720px)] flex items-end md:items-center overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <div className="absolute inset-0 z-0">
        <picture>
          <source srcSet={`${HERO_FALLBACK}&fm=webp`} type="image/webp" />
          <img
            src={heroLocal || HERO_FALLBACK}
            alt="Volcanes andinos y niebla sobre la cordillera ecuatoriana"
            className="w-full h-full object-cover object-center scale-105 md:scale-100"
            loading="eager"
            fetchPriority="high"
            width={1920}
            height={1080}
          />
        </picture>
        <div
          className="absolute inset-0 bg-gradient-to-tr from-ec-ink/85 via-ec-pacific/50 to-ec-andes/40"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(232,220,196,0.25),transparent_50%)]"
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 section-grid w-full pb-12 md:pb-16 pt-28 md:pt-32">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs md:text-sm font-bold uppercase tracking-[0.18em] text-ec-sand mb-6">
            <span className="h-2 w-2 rounded-full bg-ec-volcano animate-pulse" aria-hidden="true" />
            Ecuador · Cuatro mundos, un solo viaje
          </p>

          <h1
            id="hero-heading"
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight drop-shadow-lg"
          >
            Vive experiencias{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-ec-sand via-white to-ec-volcano">
              inolvidables
            </span>
          </h1>

          <p className="mt-5 md:mt-6 text-base md:text-xl text-white/90 max-w-xl leading-relaxed font-light">
            Tours seleccionados cerca de los aeropuertos principales. Reserva en minutos con confirmación
            inmediata — diseño claro, precios visibles, cero fricción.
          </p>

          <div className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              type="button"
              onClick={scrollToCatalog}
              className="btn-primary px-8 py-3.5 shadow-ec-hero hover:-translate-y-0.5 transition-transform"
              aria-label="Explorar catálogo de experiencias"
            >
              Explorar experiencias
              <IconChevronRight />
            </button>
            <a
              href="#confianza"
              className="btn-secondary border-white/30 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:border-white/50 min-h-11 inline-flex items-center justify-center px-8"
            >
              Por qué reservar aquí
            </a>
          </div>
        </div>

        <ul
          className="mt-10 md:mt-14 grid grid-cols-3 gap-3 md:gap-6 max-w-xl text-center md:text-left"
          aria-label="Regiones destacadas"
        >
          {[
            { label: 'Sierra', sub: 'Andes' },
            { label: 'Costa', sub: 'Pacífico' },
            { label: 'Amazonía', sub: 'Selva' },
          ].map((r) => (
            <li
              key={r.label}
              className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-2 py-3 md:px-4 md:py-4"
            >
              <span className="block text-sm md:text-base font-bold text-white">{r.label}</span>
              <span className="text-[10px] md:text-xs uppercase tracking-wider text-ec-sand/90">{r.sub}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default HeroSection;
