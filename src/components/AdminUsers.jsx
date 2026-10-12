import React, { useEffect, useMemo, useState } from 'react';
import { AuthService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AdminUserModal from './AdminUserModal';

const AdminUsers = () => {
  const { session } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AuthService.getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.userMessage || err?.message || 'Error al cargar usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const toggleRole = async (user) => {
    if (user.id === session?.sub) {
      alert('No puedes cambiar tu propio rol.');
      return;
    }
    const newRole = user.rol === 'ADMIN' ? 'TURISTA' : 'ADMIN';
    if (!window.confirm(`¿Estás seguro de cambiar el rol de ${user.email} a ${newRole}?`)) return;

    setUpdatingId(user.id);
    try {
      await AuthService.updateUserRole(user.id, newRole);
      await loadUsers();
    } catch (err) {
      alert(err?.userMessage || 'Error al actualizar el rol.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const email = u.email?.toLowerCase() || '';
      const nombre = u.nombre_completo?.toLowerCase() || '';
      const rol = u.rol?.toLowerCase() || '';
      const dni = u.dni?.toLowerCase() || '';
      return email.includes(q) || nombre.includes(q) || rol.includes(q) || dni.includes(q);
    });
  }, [users, search]);

  return (
    <div className="space-y-4">
      {/* Barra superior de acciones para gestión de usuarios */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-sm">
          <input
            type="search"
            placeholder="Buscar por correo, nombre o DNI…"
            className="w-full border border-ec-mist rounded-xl px-3 py-2.5 bg-white text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar usuarios"
          />
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="btn-primary px-5 py-2.5 text-sm font-bold flex items-center justify-center gap-2 shrink-0"
        >
          <span className="text-base leading-none">＋</span> Nuevo Usuario
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-r-xl" role="alert">
          {error}
        </div>
      )}

      {loading && users.length === 0 ? (
        <div className="animate-pulse space-y-3" role="status" aria-live="polite">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 bg-ec-mist rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ec-mist bg-white">
          <table className="w-full text-sm text-left">
            <thead className="bg-ec-mist/50 text-ec-slate uppercase text-xs tracking-wide">
              <tr>
                <th className="px-4 py-3 font-bold">Usuario / Nombre</th>
                <th className="px-4 py-3 font-bold">DNI / Contacto</th>
                <th className="px-4 py-3 font-bold">Rol Actual</th>
                <th className="px-4 py-3 font-bold">Registro</th>
                <th className="px-4 py-3 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isSelf = u.id === session?.sub;
                return (
                  <tr key={u.id} className="border-t border-ec-mist/70 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-ec-ink">
                        {u.email} {isSelf && <span className="text-xs text-ec-gold font-bold ml-1">(Tú)</span>}
                      </div>
                      {u.nombre_completo && (
                        <div className="text-xs text-ec-slate">{u.nombre_completo}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ec-slate text-xs">
                      {u.dni ? <span>DNI: {u.dni}</span> : <span>—</span>}
                      {u.telefono && <div className="text-ec-slate/80">Tel: {u.telefono}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          u.rol === 'ADMIN'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {u.rol}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-ec-slate">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => toggleRole(u)}
                        disabled={isSelf || updatingId === u.id}
                        className="btn-secondary px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                        title={isSelf ? 'No puedes modificar tu propio rol' : ''}
                      >
                        {updatingId === u.id
                          ? 'Actualizando…'
                          : u.rol === 'ADMIN'
                          ? 'Revocar Admin'
                          : 'Hacer Admin'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-ec-slate">
                    {search ? 'No se encontraron usuarios que coincidan con la búsqueda.' : 'No hay usuarios registrados.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para crear nuevo usuario */}
      <AdminUserModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadUsers}
      />
    </div>
  );
};

export default AdminUsers;
