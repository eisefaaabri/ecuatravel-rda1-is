import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminService } from '../../services/api';
import AdminPageHeader from './AdminPageHeader';

const INTERVALO_MS = 5000;
const RESALTE_MS = 4000;

const hoyEcuador = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(new Date());

const formatHora = (iso) =>
  iso
    ? new Intl.DateTimeFormat('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(iso))
    : '—';

/** Barra de ocupación de un turno; resalta el cambio cuando el cupo se mueve. */
const Turno = ({ t, cambio }) => {
  const ocupado = t.total ? Math.round((t.reservado / t.total) * 100) : 0;
  const agotado = t.disponible === 0;
  return (
    <li
      className={`rounded-xl px-3 py-2 transition-colors duration-700 ${
        cambio ? 'bg-amber-100 ring-1 ring-amber-300' : 'bg-ec-mist/30'
      }`}
    >
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-bold tabular-nums text-ec-ink">{t.hora}</span>
        <span className="tabular-nums">
          {cambio && (
            <span className={`mr-2 text-xs font-bold ${cambio < 0 ? 'text-red-700' : 'text-green-700'}`}>
              {cambio > 0 ? `+${cambio}` : cambio}
            </span>
          )}
          {t.cerrada ? (
            <span className="font-semibold text-ec-slate">Cerrado</span>
          ) : (
            <>
              <strong className={agotado ? 'text-red-700' : 'text-ec-ink'}>{t.disponible}</strong>
              <span className="text-ec-slate"> libres de {t.total}</span>
            </>
          )}
        </span>
      </div>
      <div
        className="mt-1.5 h-1.5 rounded-full bg-white overflow-hidden"
        role="progressbar"
        aria-label={`Ocupación del turno ${t.hora}`}
        aria-valuemin={0}
        aria-valuemax={t.total}
        aria-valuenow={t.reservado}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${agotado ? 'bg-red-500' : 'bg-ec-andes'}`}
          style={{ width: `${ocupado}%` }}
        />
      </div>
    </li>
  );
};

const AdminStock = () => {
  const [fecha, setFecha] = useState(hoyEcuador);
  const [items, setItems] = useState([]);
  const [generado, setGenerado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vivo, setVivo] = useState(true);
  const [query, setQuery] = useState('');
  const [cambios, setCambios] = useState({});
  const previo = useRef(new Map());

  const load = useCallback(
    async (inicial = false) => {
      if (inicial) setLoading(true);
      try {
        const payload = await AdminService.getStock(fecha);
        const data = payload?.data ?? [];
        // Compara con la lectura anterior para resaltar los turnos que cambiaron.
        const nuevos = {};
        for (const a of data) {
          for (const t of a.turnos) {
            const clave = `${a.atraccion_id}|${t.slot_id}`;
            const antes = previo.current.get(clave);
            if (!inicial && antes !== undefined && antes !== t.disponible) nuevos[clave] = t.disponible - antes;
            previo.current.set(clave, t.disponible);
          }
        }
        if (Object.keys(nuevos).length) {
          setCambios((c) => ({ ...c, ...nuevos }));
          setTimeout(() => {
            setCambios((c) => {
              const resto = { ...c };
              for (const k of Object.keys(nuevos)) delete resto[k];
              return resto;
            });
          }, RESALTE_MS);
        }
        setItems(data);
        setGenerado(payload?.generado_en ?? null);
        setError(null);
      } catch (err) {
        setError(err?.userMessage || 'No se pudo consultar el stock.');
      } finally {
        if (inicial) setLoading(false);
      }
    },
    [fecha],
  );

  useEffect(() => {
    previo.current = new Map();
    setCambios({});
    load(true);
  }, [load]);

  // Consulta cada 5 s mientras la pestaña está visible y el modo en vivo activo.
  useEffect(() => {
    if (!vivo) return undefined;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') load(false);
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, [vivo, load]);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((a) => `${a.nombre} ${a.codigo_aeropuerto}`.toLowerCase().includes(q)) : items;
  }, [items, query]);

  const resumen = useMemo(
    () =>
      items.reduce(
        (r, a) => ({
          total: r.total + a.totales.total,
          reservado: r.reservado + a.totales.reservado,
          disponible: r.disponible + a.totales.disponible,
        }),
        { total: 0, reservado: 0, disponible: 0 },
      ),
    [items],
  );

  return (
    <section>
      <AdminPageHeader
        title="Stock en vivo"
        description="Cupos de cada atracción y turno. Se actualiza solo cada 5 segundos: las compras de la web y de Booking se ven al instante."
        actions={
          <>
            <label htmlFor="stock-fecha" className="sr-only">
              Fecha
            </label>
            <input
              id="stock-fecha"
              type="date"
              className="border border-ec-mist rounded-xl px-3 py-2.5 min-h-11 bg-white"
              value={fecha}
              onChange={(e) => e.target.value && setFecha(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setVivo((v) => !v)}
              aria-pressed={vivo}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 min-h-11 text-sm font-bold ${
                vivo ? 'border-green-300 bg-green-50 text-green-800' : 'border-ec-mist bg-white text-ec-slate'
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${vivo ? 'bg-green-600 motion-safe:animate-pulse' : 'bg-ec-slate/50'}`}
                aria-hidden="true"
              />
              {vivo ? 'En vivo' : 'En pausa'}
            </button>
          </>
        }
      />

      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <div className="flex gap-1.5">
            <dt className="text-ec-slate">Libres</dt>
            <dd className="font-bold tabular-nums text-ec-ink">{resumen.disponible}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-ec-slate">Reservados</dt>
            <dd className="font-bold tabular-nums text-ec-ink">{resumen.reservado}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-ec-slate">Capacidad</dt>
            <dd className="font-bold tabular-nums text-ec-ink">{resumen.total}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-ec-slate">Actualizado</dt>
            <dd className="font-semibold tabular-nums text-ec-ink">{formatHora(generado)}</dd>
          </div>
        </dl>
        <input
          type="search"
          placeholder="Buscar atracción o aeropuerto"
          aria-label="Buscar atracción"
          className="w-full sm:w-72 border border-ec-mist rounded-xl px-3 py-2.5 min-h-11 bg-white"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && (
        <div className="mb-5 p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-r-xl" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 animate-pulse" role="status" aria-live="polite">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-40 bg-ec-mist rounded-2xl" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <p className="text-ec-slate py-10 text-center">No hay atracciones que mostrar.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((a) => (
            <li key={a.atraccion_id} className="rounded-2xl border border-ec-mist bg-white p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="font-bold text-ec-ink leading-snug">{a.nombre}</p>
                  <p className="text-xs text-ec-slate">{a.codigo_aeropuerto}</p>
                </div>
                {a.estado !== 'PUBLICADA' && (
                  <span className="shrink-0 rounded-full bg-ec-mist px-2 py-0.5 text-[11px] font-bold text-ec-slate">
                    {a.estado}
                  </span>
                )}
              </div>
              {a.turnos.length === 0 ? (
                <p className="text-sm text-ec-slate">Sin turnos activos.</p>
              ) : (
                <ul className="space-y-2">
                  {a.turnos.map((t) => (
                    <Turno key={t.slot_id} t={t} cambio={cambios[`${a.atraccion_id}|${t.slot_id}`]} />
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="sr-only" aria-live="polite">
        {Object.keys(cambios).length ? `${Object.keys(cambios).length} turnos cambiaron de cupo.` : ''}
      </p>
    </section>
  );
};

export default AdminStock;
