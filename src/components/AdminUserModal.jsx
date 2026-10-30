import React, { useEffect, useId, useRef, useState } from 'react';
import { AuthService } from '../services/api';

const EMPTY_FORM = {
  email: '',
  password: '',
  rol: 'ADMIN',
  nombre_completo: '',
  dni: '',
  telefono: '',
};

const AdminUserModal = ({ isOpen, onClose, onSaved }) => {
  const titleId = useId();
  const emailInputRef = useRef(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setError(null);
      setTimeout(() => emailInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !saving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, saving, onClose]);

  if (!isOpen) return null;

  const setField = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const emailTrimmed = form.email.trim();
    if (!emailTrimmed) {
      setError('El correo electrónico es requerido.');
      return;
    }

    if (!form.password || form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (form.dni && !/^\d{7,20}$/.test(form.dni.trim())) {
      setError('El DNI debe contener entre 7 y 20 dígitos numéricos.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        email: emailTrimmed,
        password: form.password,
        rol: form.rol,
      };

      if (form.nombre_completo.trim()) {
        payload.nombre_completo = form.nombre_completo.trim();
      }
      if (form.dni.trim()) {
        payload.dni = form.dni.trim();
      }
      if (form.telefono.trim()) {
        payload.telefono = form.telefono.trim();
      }

      await AuthService.createUser(payload);
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err?.userMessage || err?.message || 'Error al crear el usuario.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 bg-ec-ink/70 backdrop-blur-sm cursor-default"
        aria-label="Cerrar modal"
        onClick={() => !saving && onClose()}
        tabIndex={-1}
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl border border-ec-mist bg-white shadow-ec-card animate-fade-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-ec-mist bg-gradient-to-r from-ec-mist/50 to-white px-5 py-4 md:px-6">
          <div>
            <h2 id={titleId} className="text-2xl md:text-3xl leading-tight text-ec-ink">
              Crear Nuevo Usuario
            </h2>
            <p className="text-xs text-ec-slate mt-0.5">
              Registra un nuevo usuario con permisos de Administrador o Turista
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ec-slate transition hover:bg-ec-mist/70 hover:text-ec-ink disabled:opacity-50"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 md:p-6 flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-800 text-sm rounded-r-xl" role="alert">
              {error}
            </div>
          )}

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="usr-email" className="text-sm font-bold text-ec-ink">
              Correo Electrónico <span className="text-red-500">*</span>
            </label>
            <input
              id="usr-email"
              ref={emailInputRef}
              type="email"
              required
              placeholder="admin@ecuatravel.com"
              className="w-full border border-ec-mist rounded-xl px-3 py-2.5 bg-white text-sm"
              value={form.email}
              onChange={setField('email')}
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="usr-password" className="text-sm font-bold text-ec-ink">
              Contraseña <span className="text-red-500">*</span>
            </label>
            <input
              id="usr-password"
              type="password"
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="w-full border border-ec-mist rounded-xl px-3 py-2.5 bg-white text-sm"
              value={form.password}
              onChange={setField('password')}
            />
          </div>

          {/* Rol */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="usr-rol" className="text-sm font-bold text-ec-ink">
              Rol del Usuario <span className="text-red-500">*</span>
            </label>
            <select
              id="usr-rol"
              className="w-full border border-ec-mist rounded-xl px-3 py-2.5 bg-white text-sm font-semibold"
              value={form.rol}
              onChange={setField('rol')}
            >
              <option value="ADMIN">ADMIN (Acceso total al panel B2B)</option>
              <option value="TURISTA">TURISTA (Cliente estándar)</option>
            </select>
          </div>

          {/* Nombre completo */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="usr-nombre" className="text-sm font-bold text-ec-ink">
              Nombre Completo <span className="text-xs font-normal text-ec-slate">(opcional)</span>
            </label>
            <input
              id="usr-nombre"
              type="text"
              placeholder="Ej. Sofía Andrade"
              className="w-full border border-ec-mist rounded-xl px-3 py-2.5 bg-white text-sm"
              value={form.nombre_completo}
              onChange={setField('nombre_completo')}
            />
          </div>

          {/* DNI y Teléfono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="usr-dni" className="text-sm font-bold text-ec-ink">
                DNI / Cédula <span className="text-xs font-normal text-ec-slate">(opcional)</span>
              </label>
              <input
                id="usr-dni"
                type="text"
                placeholder="1723456789"
                className="w-full border border-ec-mist rounded-xl px-3 py-2.5 bg-white text-sm"
                value={form.dni}
                onChange={setField('dni')}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="usr-telefono" className="text-sm font-bold text-ec-ink">
                Teléfono <span className="text-xs font-normal text-ec-slate">(opcional)</span>
              </label>
              <input
                id="usr-telefono"
                type="tel"
                placeholder="+593987654321"
                className="w-full border border-ec-mist rounded-xl px-3 py-2.5 bg-white text-sm"
                value={form.telefono}
                onChange={setField('telefono')}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-3 border-t border-ec-mist/60 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-secondary px-5 py-2.5 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary px-6 py-2.5 text-sm font-bold"
              disabled={saving}
            >
              {saving ? 'Creando…' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUserModal;
