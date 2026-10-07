import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AtraccionesService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatPrice, normalizeAtraccion } from '../utils/atraccion';
import AuthLoginPanel from './AuthLoginPanel';
import AdminAttractionModal from './AdminAttractionModal';

const PAGE_SIZE = 100;

const AdminDashboard = () => {
  const { isAuthenticated, isAdmin, session, logout } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await AtraccionesService.getAll(
        { page: 1, limit: PAGE_SIZE },
        { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }
      );
      const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      setItems(list);
    } catch (err) {
      setError(err?.userMessage || err?.message || 'No se pudo cargar el catálogo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((raw) => {
      const a = normalizeAtraccion(raw);
      return `${a.nombre} ${a.codigo_aeropuerto} ${a.estado}`.toLowerCase().includes(q);
    });
  }, [items, query]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (raw) => {
    setEditing(normalizeAtraccion(raw));
    setModalOpen(true);
  };

  const handleDelete = async (raw) => {
    const a = normalizeAtraccion(raw);
    if (!window.confirm(`¿Eliminar "${a.nombre}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(raw.id);
    setError(null);
    try {
      await AtraccionesService.delete(raw.id);
      await load();
    } catch (err) {
      setError(err?.userMessage || err?.message || 'No se pudo eliminar la atracción.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="section-grid py-12 md:py-16">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl md:text-3xl font-extrabold text-ec-ink mb-2">Panel B2B</h1>
          <p className="text-ec-slate mb-6">
            Inicia sesión con una cuenta administradora para gestionar el catálogo.
          </p>
          <AuthLoginPanel />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="section-grid py-20 text-center">
        <h1 className="text-2xl font-extrabold text-ec-ink mb-3">Sin permisos</h1>
        <p className="text-ec-slate mb-6">
          La cuenta <strong>{session?.email}</strong> no tiene rol de administrador.
        </p>
        <button type="button" onClick={logout} className="btn-secondary px-6 py-3">
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="section-grid py-10 md:py-14">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-ec-ink">Panel B2B · Atracciones</h1>
          <p className="text-ec-slate text-sm mt-1">
            Gestiona el catálogo. Sesión: <strong>{session?.email}</strong>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            type="search"
            placeholder="Buscar por nombre, aeropuerto o estado"
            className="w-full sm:w-64 border border-ec-mist rounded-xl px-3 py-3 bg-white"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar atracciones"
          />
          <button type="button" onClick={openCreate} className="btn-primary px-5 py-3 shrink-0">
            Nueva atracción
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-r-xl" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-3" role="status" aria-live="polite">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-ec-mist rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-ec-slate py-10 text-center">No hay atracciones que mostrar.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ec-mist bg-white">
          <table className="w-full text-sm text-left">
            <thead className="bg-ec-mist/50 text-ec-slate uppercase text-xs tracking-wide">
              <tr>
                <th className="px-4 py-3 font-bold">Nombre</th>
                <th className="px-4 py-3 font-bold">Aeropuerto</th>
                <th className="px-4 py-3 font-bold">Precio</th>
                <th className="px-4 py-3 font-bold">Capacidad</th>
                <th className="px-4 py-3 font-bold">Duración</th>
                <th className="px-4 py-3 font-bold">Estado</th>
                <th className="px-4 py-3 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((raw) => {
                const a = normalizeAtraccion(raw);
                return (
                  <tr key={raw.id} className="border-t border-ec-mist/70">
                    <td className="px-4 py-3 font-semibold text-ec-ink max-w-[280px]">{a.nombre}</td>
                    <td className="px-4 py-3">{a.codigo_aeropuerto}</td>
                    <td className="px-4 py-3 tabular-nums">{formatPrice(a.precio_base)}</td>
                    <td className="px-4 py-3 tabular-nums">{a.capacidad_diaria ?? '—'}</td>
                    <td className="px-4 py-3">{a.duracion ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          a.estado === 'ACTIVA'
                            ? 'bg-green-100 text-green-800'
                            : a.estado === 'MANTENIMIENTO'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-ec-mist text-ec-slate'
                        }`}
                      >
                        {a.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(raw)}
                          className="btn-secondary px-3 py-2 text-xs"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(raw)}
                          disabled={deletingId === raw.id}
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          {deletingId === raw.id ? 'Eliminando…' : 'Eliminar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AdminAttractionModal
        isOpen={modalOpen}
        atraccion={editing}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </div>
  );
};

export default AdminDashboard;
