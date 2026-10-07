import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { AtraccionesService } from './services/api';
import { formatApiError } from './utils/apiErrors';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import TrustStrip from './components/TrustStrip';
import AttractionGallery from './components/AttractionGallery';
import AttractionDetail from './components/AttractionDetail';
import AdminDashboard from './components/AdminDashboard';
import MyReservations from './components/MyReservations';
import { IconLayers } from './components/icons/EcuadorIcons';

const useAtracciones = (limit) => {
  const [atracciones, setAtracciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    AtraccionesService.getAll({ page: 1, limit })
      .then((data) => {
        if (cancelled) return;
        setAtracciones(data.data ?? []);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(formatApiError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { atracciones, loading, error };
};

const HomePage = () => {
  const { atracciones, loading, error } = useAtracciones(12);

  return (
    <>
      <HeroSection />
      <TrustStrip />
      {error && (
        <div className="section-grid pt-8">
          <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800" role="alert">
            {error}
          </p>
        </div>
      )}
      <AttractionGallery
        atracciones={atracciones}
        loading={loading}
        limit={6}
        showViewAll
        title="Experiencias destacadas"
        subtitle="Las mejores atracciones cerca de tu aeropuerto de conexión."
      />
    </>
  );
};

const PER_PAGE = 9;

const buildPageList = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, current - 1, current, current + 1, total]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('…');
    out.push(sorted[i]);
  }
  return out;
};

const CatalogPage = () => {
  const [q, setQ] = useState('');
  const [debQ, setDebQ] = useState('');
  const [aeropuerto, setAeropuerto] = useState('ALL');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], meta: null });
  const [airports, setAirports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    AtraccionesService.getAll({ page: 1, limit: 100 })
      .then((data) => {
        if (cancelled) return;
        const codes = new Set(
          (data.data ?? []).map((a) => a.codigo_aeropuerto).filter(Boolean),
        );
        setAirports(['ALL', ...Array.from(codes).sort()]);
      })
      .catch(() => {
        /* el catálogo funciona igual sin el filtro de aeropuertos */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = { page, limit: PER_PAGE };
    if (debQ.trim()) params.q = debQ.trim();
    if (aeropuerto !== 'ALL') params.aeropuerto = aeropuerto;
    AtraccionesService.getAll(params)
      .then((data) => {
        if (cancelled) return;
        setResult(data);
      })
      .catch((err) => {
        if (!cancelled) setError(formatApiError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debQ, aeropuerto, page]);

  const items = result.data ?? [];
  const meta = result.meta ?? null;
  const totalPages = meta?.totalPages ?? 1;
  const from = meta ? (meta.currentPage - 1) * meta.itemsPerPage + 1 : 0;
  const to = meta ? Math.min(meta.currentPage * meta.itemsPerPage, meta.totalItems) : 0;

  const changeQuery = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="bg-gradient-to-b from-ec-mist/40 to-transparent pt-8 md:pt-12">
      <div className="section-grid mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-ec-pacific">Catálogo de experiencias</h1>
        <p className="mt-2 text-ec-slate max-w-2xl leading-relaxed">
          Busca tu próxima aventura por nombre o aeropuerto y reserva directa.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <label htmlFor="catalog-search" className="sr-only">
              Buscar experiencias
            </label>
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ec-slate" aria-hidden="true">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                </svg>
              </span>
              <input
                id="catalog-search"
                type="search"
                placeholder="Buscar por nombre, descripción o aeropuerto…"
                value={q}
                onChange={(e) => changeQuery(setQ)(e.target.value)}
                className="w-full rounded-xl border border-ec-mist bg-white pl-11 pr-4 py-3 min-h-11 text-sm focus:border-ec-volcano focus:ring-2 focus:ring-ec-volcano/25"
              />
            </div>
          </div>

          {airports.length > 1 && (
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por aeropuerto">
              {airports.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => changeQuery(setAeropuerto)(code)}
                  aria-pressed={aeropuerto === code}
                  className={[
                    'min-h-11 rounded-full px-4 py-2 text-sm font-bold transition-colors',
                    aeropuerto === code
                      ? 'bg-ec-pacific text-white'
                      : 'bg-white text-ec-slate border border-ec-mist hover:border-ec-pacific hover:text-ec-pacific',
                  ].join(' ')}
                >
                  {code === 'ALL' ? 'Todos' : code}
                </button>
              ))}
            </div>
          )}
        </div>

        {meta && !loading && (
          <p className="mt-4 text-sm text-ec-slate" role="status" aria-live="polite">
            {meta.totalItems === 0
              ? 'Sin resultados.'
              : `Mostrando ${from}–${to} de ${meta.totalItems} ${meta.totalItems === 1 ? 'experiencia' : 'experiencias'}.`}
            {debQ.trim() && (
              <>
                {' '}para «<strong className="text-ec-ink">{debQ.trim()}</strong>»
              </>
            )}
          </p>
        )}
      </div>

      {error && (
        <div className="section-grid mb-6">
          <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800" role="alert">
            {error}
          </p>
        </div>
      )}

      <AttractionGallery
        id="catalogo-full"
        atracciones={items}
        loading={loading}
        disableLocalFilter
        title="Todas las aventuras"
        subtitle="Explora la diversidad del Ecuador"
      />

      {!loading && totalPages > 1 && (
        <nav className="section-grid pt-2 pb-16 md:pb-24" aria-label="Paginación del catálogo">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="min-h-11 min-w-11 rounded-xl border border-ec-mist bg-white px-4 text-sm font-bold text-ec-slate disabled:opacity-40"
            >
              Anterior
            </button>
            {buildPageList(page, totalPages).map((p, i) =>
              p === '…' ? (
                <span key={`ellipsis-${i}`} className="px-1 text-ec-slate" aria-hidden="true">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  aria-current={p === page ? 'page' : undefined}
                  className={[
                    'min-h-11 min-w-11 rounded-xl px-4 text-sm font-bold transition-colors',
                    p === page
                      ? 'bg-ec-pacific text-white'
                      : 'border border-ec-mist bg-white text-ec-slate hover:border-ec-pacific hover:text-ec-pacific',
                  ].join(' ')}
                >
                  {p}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="min-h-11 min-w-11 rounded-xl border border-ec-mist bg-white px-4 text-sm font-bold text-ec-slate disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

const NotFoundPage = () => (
  <div className="section-grid py-24 text-center">
    <p className="text-sm font-bold uppercase tracking-wide text-ec-volcano">Error 404</p>
    <h1 className="mt-2 text-3xl md:text-4xl font-extrabold text-ec-ink">Página no encontrada</h1>
    <p className="mt-3 text-ec-slate">La ruta que buscas no existe o fue movida.</p>
    <Link to="/" className="btn-primary px-8 py-3 mt-8 inline-flex">
      Volver al inicio
    </Link>
  </div>
);

const App = () => (
  <Router>
    <AuthProvider>
      <WishlistProvider>
        <div className="min-h-screen flex flex-col bg-[#f7f9f8] font-sans text-ec-ink">
        <a href="#main-content" className="skip-link">
          Saltar al contenido principal
        </a>
        <Navbar />

        <main id="main-content" className="flex-grow" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/experiencias" element={<CatalogPage />} />
            <Route path="/experiencias/:id" element={<AttractionDetail />} />
            <Route path="/mis-reservas" element={<MyReservations />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        <footer className="bg-ec-ink text-ec-mist/80 py-12 md:py-14 border-t border-white/10">
          <div className="section-grid text-center md:text-left md:flex md:justify-between md:items-center gap-6">
            <div>
              <IconLayers className="w-8 h-8 text-ec-andes-light mx-auto md:mx-0 mb-3" />
              <p className="font-extrabold text-white">Ecuador Travel Hub</p>
              <p className="text-sm mt-2 max-w-md">
                Tu portal de experiencias y conexiones turísticas en Ecuador.
              </p>
            </div>
            <div className="mt-6 md:mt-0 flex flex-col items-center md:items-end gap-3">
              <nav className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2 text-sm font-semibold" aria-label="Enlaces legales">
                <Link to="/experiencias" className="hover:text-white transition-colors">Catálogo</Link>
                <Link to="/#confianza" className="hover:text-white transition-colors">Confianza</Link>
              </nav>
              <p className="text-xs text-ec-mist/60">© {new Date().getFullYear()} Ecuador Travel Marketplace</p>
            </div>
          </div>
        </footer>
      </div>
    </WishlistProvider>
  </AuthProvider>
</Router>
);

export default App;
