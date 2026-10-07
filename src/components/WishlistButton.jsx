import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

const HeartIcon = ({ filled }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="w-5 h-5"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

/**
 * Corazón de favoritos con estado optimista.
 * Si no hay sesión, muestra una pista para iniciar sesión.
 */
const WishlistButton = ({ atraccionId, className = '' }) => {
  const { isAuthenticated } = useAuth();
  const { isWishlisted, toggle, loading } = useWishlist();
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState(null);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const active = Boolean(isAuthenticated) && isWishlisted(atraccionId);

  const showHint = (msg) => {
    setHint(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setHint(null), 2600);
  };

  const handleClick = async () => {
    if (!isAuthenticated) {
      showHint('Inicia sesión para guardar en favoritos');
      return;
    }
    setBusy(true);
    const res = await toggle(atraccionId);
    setBusy(false);
    if (!res.ok && res.message) showHint(res.message);
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy || loading}
        aria-pressed={active}
        aria-label={active ? 'Quitar tour de favoritos' : 'Guardar tour en favoritos'}
        title={active ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        className={[
          'inline-flex items-center justify-center rounded-full p-2 shadow-sm transition-all',
          active
            ? 'bg-ec-volcano text-white hover:bg-ec-volcano/90'
            : 'bg-white/95 text-ec-slate hover:text-ec-volcano border border-ec-mist',
          busy || loading ? 'opacity-60 cursor-wait' : 'cursor-pointer',
        ].join(' ')}
      >
        {!(busy || loading) && <HeartIcon filled={active} />}
        {(busy || loading) && <span className="block w-5 h-5 animate-ping rounded-full bg-ec-volcano/40" />}
      </button>
      {hint && (
        <span
          role="status"
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-max max-w-[220px] rounded-lg bg-ec-ink text-white text-xs font-semibold px-3 py-1.5 shadow-lg z-20"
        >
          {hint}
        </span>
      )}
    </div>
  );
};

export default WishlistButton;