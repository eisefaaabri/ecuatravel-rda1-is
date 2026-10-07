import React from 'react';
import { IconShield } from './icons/EcuadorIcons';

const TrustStrip = () => (
  <section
    id="confianza"
    className="border-y border-ec-mist bg-white/80 backdrop-blur-sm"
    aria-labelledby="trust-heading"
  >
    <div className="section-grid py-10 md:py-12">
      <h2 id="trust-heading" className="sr-only">
        Ventajas de reservar
      </h2>
      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-12 text-center sm:text-left">
        {[
          {
            title: 'Reserva Segura',
            text: 'Tus pagos están protegidos con encriptación de grado bancario.',
          },
          {
            title: 'Disponibilidad en Tiempo Real',
            text: 'Cupos actualizados al instante para todas nuestras atracciones.',
          },
          {
            title: 'Soporte 24/7',
            text: 'Asistencia garantizada en cualquier momento de tu viaje.',
          },
        ].map((item) => (
          <li key={item.title} className="flex flex-col sm:flex-row gap-3 items-center sm:items-start">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ec-andes/10 text-ec-andes">
              <IconShield />
            </span>
            <div>
              <h3 className="font-extrabold text-ec-ink">{item.title}</h3>
              <p className="text-sm text-ec-slate mt-1 leading-relaxed">{item.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export default TrustStrip;
