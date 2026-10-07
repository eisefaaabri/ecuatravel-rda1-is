import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLoginPanel from './AuthLoginPanel';
import { IconLayers } from './icons/EcuadorIcons';

const NAV = [
  { to: '/', label: 'Inicio', match: (p) => p === '/' },
  { to: '/experiencias', label: 'Catálogo', match: (p) => p.startsWith('/experiencias') },
  { to: '/#confianza', label: 'Confianza', match: () => false },
];

const Navbar = () => {
  const location = useLocation();
  const { isAuthenticated, isAdmin, session, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const path = location.pathname;

  const isActive = (item) => item.match(path);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-ec-mist/80 bg-white/92 backdrop-blur-md shadow-sm">
        <div className="section-grid h-16 md:h-[4.5rem] flex items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg p-1 -ml-1 shrink-0"
            aria-label="Ecuador Travel — inicio"
          >
            <IconLayers className="w-8 h-8 text-ec-andes" />
            <span className="text-xl md:text-2xl font-extrabold tracking-tight text-ec-ink">
              ECUADOR<span className="text-ec-andes">.TRAVEL</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label="Navegación principal">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`text-sm font-bold min-h-11 inline-flex items-center px-4 rounded-lg transition-colors ${
                  isActive(item)
                    ? 'text-ec-volcano bg-ec-volcano/10'
                    : 'text-ec-slate hover:text-ec-ink hover:bg-ec-mist/60'
                }`}
                aria-current={isActive(item) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}

            {isAdmin && (
              <Link
                to="/admin"
                className={`text-sm font-bold min-h-11 inline-flex items-center px-4 rounded-lg transition-colors ${
                  path.startsWith('/admin')
                    ? 'text-ec-volcano bg-ec-volcano/10'
                    : 'text-ec-slate hover:text-ec-ink hover:bg-ec-mist/60'
                }`}
                aria-current={path.startsWith('/admin') ? 'page' : undefined}
              >
                Panel B2B
              </Link>
            )}

            {isAuthenticated ? (
              <div className="ml-2 flex items-center gap-2 pl-2 border-l border-ec-mist">
                <Link
                  to="/mis-reservas"
                  className={`text-sm font-bold min-h-11 inline-flex items-center px-3 rounded-lg transition-colors ${
                    path.startsWith('/mis-reservas')
                      ? 'text-ec-volcano bg-ec-volcano/10'
                      : 'text-ec-slate hover:text-ec-ink hover:bg-ec-mist/60'
                  }`}
                  aria-current={path.startsWith('/mis-reservas') ? 'page' : undefined}
                >
                  Mis reservas
                </Link>
                <span className="text-xs font-semibold text-ec-slate max-w-[110px] truncate" title={session?.email}>
                  {session?.email ?? 'Sesión activa'}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="min-h-11 px-3 rounded-lg text-sm font-bold text-ec-pacific hover:bg-ec-mist/80"
                >
                  Salir
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="ml-2 min-h-11 px-4 rounded-lg text-sm font-bold bg-ec-pacific text-white hover:bg-ec-pacific-light"
              >
                Acceder
              </button>
            )}
          </nav>

          <button
            type="button"
            className="md:hidden min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl border border-ec-mist text-ec-ink"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span className="sr-only">{mobileOpen ? 'Cerrar menú' : 'Abrir menú'}</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <nav
            id="mobile-nav"
            className="md:hidden border-t border-ec-mist bg-white px-4 py-3 space-y-1"
            aria-label="Navegación móvil"
          >
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`block min-h-11 px-4 py-3 rounded-xl font-bold ${
                  isActive(item) ? 'bg-ec-volcano/10 text-ec-volcano' : 'text-ec-slate hover:bg-ec-mist/50'
                }`}
                aria-current={isActive(item) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className={`block min-h-11 px-4 py-3 rounded-xl font-bold ${
                  path.startsWith('/admin') ? 'bg-ec-volcano/10 text-ec-volcano' : 'text-ec-slate hover:bg-ec-mist/50'
                }`}
                aria-current={path.startsWith('/admin') ? 'page' : undefined}
              >
                Panel B2B
              </Link>
            )}
            {isAuthenticated ? (
              <>
                <Link
                  to="/mis-reservas"
                  onClick={() => setMobileOpen(false)}
                  className={`block min-h-11 px-4 py-3 rounded-xl font-bold ${
                    path.startsWith('/mis-reservas') ? 'bg-ec-volcano/10 text-ec-volcano' : 'text-ec-slate hover:bg-ec-mist/50'
                  }`}
                  aria-current={path.startsWith('/mis-reservas') ? 'page' : undefined}
                >
                  Mis reservas
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                  className="w-full text-left min-h-11 px-4 py-3 rounded-xl font-bold text-ec-pacific"
                >
                  Cerrar sesión ({session?.email})
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthOpen(true);
                  setMobileOpen(false);
                }}
                className="w-full text-left min-h-11 px-4 py-3 rounded-xl font-bold bg-ec-pacific text-white"
              >
                Acceder
              </button>
            )}
          </nav>
        )}
      </header>

      {authOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-ec-ink/60"
            aria-label="Cerrar login"
            onClick={() => setAuthOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-ec-card p-2 max-h-[90vh] overflow-y-auto">
            <AuthLoginPanel onSuccess={() => setAuthOpen(false)} />
            <button
              type="button"
              className="mt-2 w-full min-h-11 text-sm font-bold text-ec-slate hover:text-ec-ink"
              onClick={() => setAuthOpen(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
