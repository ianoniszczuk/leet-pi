import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, ShieldCheck, Shield, User as UserIcon, CheckCircle, XCircle } from 'lucide-react';
import { apiService } from '@/services/api';
import type { AdminUser } from '@/types';
import UserDetailModal from './UserDetailModal';

interface UsersTabProps {
  currentUserRoles: string[];
}

function RoleBadge({ roles }: { roles: string[] }) {
  if (roles.includes('superadmin')) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
        <ShieldCheck className="w-3 h-3" />
        SUPERADMIN
      </span>
    );
  }
  if (roles.includes('admin')) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
        <Shield className="w-3 h-3" />
        ADMIN
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
      <UserIcon className="w-3 h-3" />
      ALUMNO
    </span>
  );
}

function EnabledBadge({ enabled }: { enabled: boolean }) {
  return enabled ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
      <CheckCircle className="w-3 h-3" />
      Habilitado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
      <XCircle className="w-3 h-3" />
      Deshabilitado
    </span>
  );
}

export default function UsersTab({ currentUserRoles }: UsersTabProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const isSuperAdmin = currentUserRoles.includes('superadmin');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getAdminUsers();
      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        setError('Error al cargar los usuarios');
      }
    } catch {
      setError('Error al cargar los usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const canToggleEnabled = (target: AdminUser): boolean => {
    if (target.roles.includes('superadmin')) return false;
    if (target.roles.includes('admin') && !isSuperAdmin) return false;
    return true;
  };

  const handleToggleEnabled = async (target: AdminUser) => {
    const newEnabled = !target.enabled;

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === target.id ? { ...u, enabled: newEnabled } : u))
    );
    setPendingIds((prev) => new Set(prev).add(target.id));

    try {
      const response = await apiService.updateUserEnabled(target.id, newEnabled);
      if (!response.success) {
        // Revert
        setUsers((prev) =>
          prev.map((u) => (u.id === target.id ? { ...u, enabled: target.enabled } : u))
        );
      }
    } catch {
      // Revert
      setUsers((prev) =>
        prev.map((u) => (u.id === target.id ? { ...u, enabled: target.enabled } : u))
      );
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(target.id);
        return next;
      });
    }
  };

  const handleToggleAdmin = async (target: AdminUser) => {
    const newRoles = target.roles.includes('admin') ? [] : ['admin'];

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === target.id ? { ...u, roles: newRoles } : u))
    );
    setPendingIds((prev) => new Set(prev).add(target.id));

    try {
      const response = await apiService.updateUserRoles(target.id, newRoles);
      if (response.success && response.data) {
        setUsers((prev) =>
          prev.map((u) => (u.id === target.id ? { ...u, roles: response.data!.roles } : u))
        );
      } else {
        setUsers((prev) =>
          prev.map((u) => (u.id === target.id ? { ...u, roles: target.roles } : u))
        );
      }
    } catch {
      setUsers((prev) =>
        prev.map((u) => (u.id === target.id ? { ...u, roles: target.roles } : u))
      );
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(target.id);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-800">{error}</p>
          <button onClick={loadUsers} className="mt-2 text-sm text-red-700 underline">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Listado de usuarios
          <span className="ml-2 text-sm font-normal text-gray-500">({users.length})</span>
        </h2>
        <button
          onClick={loadUsers}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Actualizar
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((u) => {
              const isPending = pendingIds.has(u.id);
              const canToggle = canToggleEnabled(u);
              const canManageAdmin = isSuperAdmin && !u.roles.includes('superadmin');

              return (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <button
                      onClick={() => setSelectedUser(u)}
                      className="text-left text-gray-600 cursor-pointer"
                    >
                      {u.firstName} {u.lastName}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{u.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <RoleBadge roles={u.roles} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <EnabledBadge enabled={u.enabled} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {canToggle && (
                        <button
                          onClick={() => handleToggleEnabled(u)}
                          disabled={isPending}
                          className={`text-xs px-3 py-1 rounded font-medium transition-colors ${u.enabled
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin inline" />
                          ) : u.enabled ? (
                            'Deshabilitar'
                          ) : (
                            'Habilitar'
                          )}
                        </button>
                      )}
                      {canManageAdmin && (
                        <button
                          onClick={() => handleToggleAdmin(u)}
                          disabled={isPending}
                          className={`text-xs px-3 py-1 rounded font-medium transition-colors ${u.roles.includes('admin')
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin inline" />
                          ) : u.roles.includes('admin') ? (
                            'Quitar ADMIN'
                          ) : (
                            'Hacer ADMIN'
                          )}
                        </button>
                      )}
                      {!canToggle && !canManageAdmin && (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                  No hay usuarios registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

      <UserDetailModal
        isOpen={selectedUser !== null}
        userId={selectedUser?.id ?? null}
        userRoles={selectedUser?.roles ?? []}
        onClose={() => setSelectedUser(null)}
      />
    </>
  );
}
