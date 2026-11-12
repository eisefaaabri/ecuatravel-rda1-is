import React, { useEffect, useId, useRef, useState } from 'react';
import { AtraccionesService } from '../services/api';
import { formatPrice } from '../utils/atraccion';

/**
 * Cancelación de una reserva web en dos pasos: confirmar (con motivo) y resultado con
 * el reembolso simulado del 100 % y los cupos liberados.
 */
const CancelReservationModal = ({ reservation, atraccionNombre, onClose, onCancelled }) => {
  const titleId = useId();
  const firstRef = useRef(null);
  const idempotencyKey = useRef(crypto.randomUUID());
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const close = () => (result ? onCancelled(result) : onClose());

  useEffect(() => {
    firstRef.current?.focus();
  }, [result]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !sending && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const confirm = async (e) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await AtraccionesService.cancelReservation(
        reservation.reservation_id,
        reason.trim(),
        idempotencyKey.current,
      );
      setResult(res);
    } catch (err) {
      setError(err?.userMessage || 'No se pudo cancelar la reserva.');
    } finally {
      setSending(false);
    }
  };

  const total = reservation.total_price?.total ?? 0;
  const refund = result?.refund;
  const restored = result?.stock_restoration;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="fixed inset-0 bg-ec-ink/70 backdrop-blur-sm cursor-default"
        aria-label="Cerrar"
        onClick={() => !sending && close()}
        tabIndex={-1}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-2xl border border-ec-mist bg-white shadow-ec-card animate-fade-in"
      >
        {!result ? (
          <form onSubmit={confirm} className="p-5 md:p-6 flex flex-col gap-4">
            <div>
              <h2 id={titleId} className="text-2xl leading-tight text-ec-ink">
                ¿Cancelar esta reserva?
              </h2>
              <p className="text-sm text-ec-slate mt-1">
                {atraccionNombre} · {reservation.date}
                {reservation.time ? ` ${reservation.time}` : ''} · {reservation.ticket_count}{' '}
                {reservation.ticket_count === 1 ? 'pasajero' : 'pasajeros'}
              </p>
            </div>
            <ul className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 space-y-1">
              <li>Se anulará la reserva y se liberarán los cupos del turno.</li>
              <li>
                {reservation.status === 'PENDING'
                  ? 'No hay pago que reembolsar.'
                  : `Recibirás el reembolso del 100% (${formatPrice(total)}).`}
              </li>
            </ul>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${titleId}-motivo`} className="text-sm font-bold text-ec-ink">
                Motivo de la cancelación
              </label>
              <input
                id={`${titleId}-motivo`}
                ref={firstRef}
                required
                minLength={3}
                maxLength={200}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="border border-ec-mist rounded-xl px-3 py-2.5 min-h-11 text-sm focus:border-ec-volcano focus:ring-2 focus:ring-ec-volcano/25"
              />
            </div>
            {error && (
              <p className="p-3 bg-red-50 border-l-4 border-red-500 text-red-800 text-sm rounded-r-xl" role="alert">
                {error}
              </p>
            )}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button type="button" onClick={onClose} disabled={sending} className="btn-secondary px-5 py-2.5 text-sm">
                Volver
              </button>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 min-h-11 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {sending ? 'Cancelando…' : 'Sí, cancelar reserva'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-5 md:p-6 flex flex-col gap-4" role="status" aria-live="polite">
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-lg font-bold text-green-700"
                aria-hidden="true"
              >
                ✓
              </span>
              <h2 id={titleId} className="text-2xl leading-tight text-ec-ink">
                {refund?.status === 'PROCESSED' ? '¡Cancelación y reembolso exitosos!' : '¡Cancelación exitosa!'}
              </h2>
            </div>
            <dl className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm space-y-2">
              {refund?.status === 'PROCESSED' && (
                <>
                  <div className="flex justify-between gap-3">
                    <dt className="text-green-900">Código de reembolso</dt>
                    <dd className="font-mono font-bold text-green-900">{refund.refund_id}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-green-900">Monto reembolsado</dt>
                    <dd className="font-bold text-green-900">100% · {formatPrice(refund.amount)}</dd>
                  </div>
                </>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-green-900">Stock reincorporado</dt>
                <dd className="font-bold text-green-900">
                  ✓ {restored?.restored_spots ?? reservation.ticket_count}{' '}
                  {(restored?.restored_spots ?? reservation.ticket_count) === 1 ? 'cupo liberado' : 'cupos liberados'}
                </dd>
              </div>
            </dl>
            {refund?.status === 'PROCESSED' && (
              <p className="text-xs text-ec-slate">Reembolso simulado: no se realiza un cobro ni una devolución real.</p>
            )}
            <button type="button" ref={firstRef} onClick={close} className="btn-primary px-5 py-2.5 text-sm self-end">
              Entendido
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CancelReservationModal;
