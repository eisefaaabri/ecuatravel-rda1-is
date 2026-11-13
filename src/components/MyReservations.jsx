import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AtraccionesService } from '../services/api';
import { formatPrice, normalizeAtraccion, attractionThumbUrl } from '../utils/atraccion';
import AuthLoginPanel from './AuthLoginPanel';
import PayReservationModal from './PayReservationModal';
import CancelReservationModal from './CancelReservationModal';

const STATUS_LABEL = {
  PENDING: 'Pendiente de pago',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
};

const REFRESCO_MS = 5000;

// Estado visible de la tarjeta: el check-in presencial se muestra como CONFIRMADO_ASISTIDO.
const estadoVisible = (r) => (r.checked_in ? 'CONFIRMADO_ASISTIDO' : r.status);

const BADGE = {
  CONFIRMED: { label: 'Confirmada', tone: 'bg-ec-andes/15 text-ec-andes' },
  CONFIRMADO_ASISTIDO: { label: 'Asistencia confirmada', tone: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelada', tone: 'bg-red-50 text-[#b91c1c]' },
  PENDING: { label: STATUS_LABEL.PENDING, tone: 'bg-amber-100 text-amber-800' },
};

const CardStatusBadge = ({ estado }) => {
  const b = BADGE[estado] ?? { label: STATUS_LABEL[estado] ?? estado, tone: 'bg-ec-mist text-ec-slate' };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold transition-colors duration-300 ${b.tone}`}
    >
      {b.label}
    </span>
  );
};

// Lo que se ve en la tarjeta; si no cambia, se conserva el mismo objeto y React no la repinta.
const huella = (r) =>
  [r.status, r.checked_in, r.cancelable, r.ticket_count, r.total_price?.total, r.date, r.time].join('|');

const fusionar = (previas, nuevas) => {
  const porId = new Map(previas.map((r) => [r.reservation_id, r]));
  return nuevas.map((n) => {
    const p = porId.get(n.reservation_id);
    return p && huella(p) === huella(n) ? p : n;
  });
};

// El backend calcula el plazo (24 h antes del turno, hora de Ecuador); se usa su respuesta.
const puedeCancelar = (r) =>
  r.cancelable ?? (r.cancelable_until ? Date.now() <= Date.parse(r.cancelable_until) : true);

const MyReservations = () => {
  const { isAuthenticated } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [atracciones, setAtracciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const [paying, setPaying] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [aviso, setAviso] = useState('');
  const actuales = useRef([]);

  // isSilent: refresco de fondo, sin spinner ni banner de error; solo cambia lo que cambió.
  const load = useCallback(async ({ isSilent = false } = {}) => {
    if (!isSilent) {
      setLoading(true);
      setError(null);
    }
    try {
      if (isSilent) {
        const resData = await AtraccionesService.getMyReservations();
        const nuevas = Array.isArray(resData?.data) ? resData.data : [];
        const previas = new Map(actuales.current.map((r) => [r.reservation_id, estadoVisible(r)]));
        const cambios = nuevas.filter(
          (r) => previas.has(r.reservation_id) && previas.get(r.reservation_id) !== estadoVisible(r),
        );
        if (cambios.length)
          setAviso(
            cambios
              .map((r) => `La reserva ${r.reservation_code ?? ''} ahora está: ${BADGE[estadoVisible(r)]?.label ?? r.status}.`)
              .join(' '),
          );
        setReservations((prev) => fusionar(prev, nuevas));
        return;
      }
      const [resData, catData] = await Promise.all([
        AtraccionesService.getMyReservations(),
        AtraccionesService.getAll({ page: 1, limit: 100 }),
      ]);
      setReservations(Array.isArray(resData?.data) ? resData.data : []);
      setAtracciones(Array.isArray(catData?.data) ? catData.data : []);
    } catch (err) {
      if (!isSilent) setError(err?.userMessage || 'No pudimos cargar tus reservas.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    actuales.current = reservations;
  }, [reservations]);

  // Silent Background Polling: cada 5 s mientras la pestaña está visible.
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') load({ isSilent: true });
    }, REFRESCO_MS);
    return () => clearInterval(id);
  }, [isAuthenticated, load]);

  useEffect(() => {
    if (!isAuthenticated) {
      setReservations([]);
      setLoading(false);
      return;
    }
    load();
  }, [isAuthenticated, load]);

  const atrMap = useMemo(
    () => new Map(atracciones.map((a) => [a.id, normalizeAtraccion(a)])),
    [atracciones],
  );

  if (!isAuthenticated) {
    return (
      <div className="section-grid py-16 md:py-20 max-w-lg">
        <h1 className="text-4xl md:text-5xl leading-tight text-ec-ink">Mis reservas</h1>
        <div className="mt-6 rounded-2xl border border-ec-mist bg-white p-6 shadow-ec-card">
          <p className="text-sm text-ec-slate mb-4">
            Inicia sesión para ver tus reservas y su estado de pago.
          </p>
          <AuthLoginPanel compact />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-ec-mist/40 to-transparent pt-8 md:pt-12 pb-16">
      <div className="section-grid">
        <h1 className="text-4xl md:text-5xl leading-tight text-ec-ink">Mis reservas</h1>
        <p className="mt-2 text-ec-slate">
          Consulta el estado de tus tours y gestiona el pago o la cancelación.
        </p>

        <p className="sr-only" aria-live="polite">
          {aviso}
        </p>

        {notice && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800" role="status">
            {notice}
          </div>
        )}

        {error && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => load()} className="btn-secondary px-4 py-1.5 text-xs">
              Reintentar
            </button>
          </div>
        )}

        {loading && (
          <div className="mt-8 space-y-4" role="status" aria-live="polite">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-32 bg-ec-mist rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && !error && reservations.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-ec-mist bg-white/60 p-10 text-center">
            <p className="text-ec-slate">Aún no tienes reservas.</p>
            <Link to="/experiencias" className="btn-primary px-8 py-3 mt-6 inline-flex">
              Explorar experiencias
            </Link>
          </div>
        )}

        {!loading && !error && reservations.length > 0 && (
          <ul className="mt-8 space-y-4">
            {reservations.map((r) => {
              const atr = atrMap.get(r.atraccion_id) ?? {
                id: r.atraccion_id,
                nombre: 'Experiencia eliminada',
                codigo_aeropuerto: '—',
              };
              return (
                <li
                  key={r.reservation_id}
                  className="rounded-2xl border border-ec-mist/90 bg-white p-4 md:p-5 flex flex-col gap-4 shadow-sm"
                >
                  <div className="flex flex-wrap gap-4">
                    <Link
                      to={`/experiencias/${atr.id}`}
                      className="shrink-0 w-full sm:w-32 h-40 sm:h-24 overflow-hidden rounded-xl border border-ec-mist bg-ec-mist"
                      aria-label={`Ver detalle de ${atr.nombre}`}
                    >
                      <img
                        src={attractionThumbUrl(atr)}
                        alt={atr.nombre}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h2 className="font-sans font-extrabold text-ec-ink truncate">
                            <Link to={`/experiencias/${atr.id}`} className="hover:text-ec-pacific">
                              {atr.nombre}
                            </Link>
                          </h2>
                          <p className="text-sm text-ec-slate mt-1">
                            {r.date} · {r.ticket_count} {r.ticket_count === 1 ? 'pasajero' : 'pasajeros'} · Salida {atr.codigo_aeropuerto}
                          </p>
                          <p className="text-xs text-ec-slate mt-1">
                            Ref:{' '}
                            <span className="font-mono">{String(r.reservation_id).split('-')[0]}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-extrabold text-ec-ink tabular-nums">
                            {formatPrice(r.total_price?.total ?? 0)}
                          </p>
                          <CardStatusBadge estado={estadoVisible(r)} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 border-t border-ec-mist pt-3">
                    {r.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => setPaying(r)}
                        className="btn-primary px-5 py-2.5 text-sm"
                      >
                        Pagar ahora
                      </button>
                    )}
                    {r.checked_in ? (
                      <span className="rounded-full bg-ec-andes/10 px-3 py-1.5 text-xs font-bold text-ec-andes">
                        Check-in realizado (servicio iniciado, no cancelable)
                      </span>
                    ) : r.status !== 'CONFIRMED' ? null : r.canal === 'BOOKING' ? (
                      <span className="text-xs text-ec-slate">Reserva hecha en Booking: cancélala desde Booking.</span>
                    ) : !puedeCancelar(r) ? (
                      <p className="text-xs text-ec-slate max-w-md text-right">
                        Cancelación no disponible (menos de 24h antes del inicio de la actividad). La política de
                        cancelación gratuita aplica hasta 24h antes.
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCancelling(r)}
                        className="btn-secondary px-5 py-2.5 text-sm"
                      >
                        Cancelar reserva
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {cancelling && (
        <CancelReservationModal
          reservation={cancelling}
          atraccionNombre={atrMap.get(cancelling.atraccion_id)?.nombre ?? 'Experiencia'}
          onClose={() => setCancelling(null)}
          onCancelled={(res) => {
            setCancelling(null);
            setNotice(
              res?.refund?.status === 'PROCESSED'
                ? `Reserva cancelada: cupos liberados y reembolso del 100% registrado (${res.refund.refund_id}).`
                : 'Reserva cancelada: cupos liberados.',
            );
            load({ isSilent: true });
          }}
        />
      )}

      {paying && (
        <PayReservationModal
          reservation={paying}
          atraccion={atrMap.get(paying.atraccion_id) ?? null}
          isOpen
          onClose={() => setPaying(null)}
          onSuccess={() => {
            setPaying(null);
            setNotice('Pago procesado correctamente. Tu reserva fue confirmada.');
            load({ isSilent: true });
          }}
        />
      )}
    </div>
  );
};

export default MyReservations;