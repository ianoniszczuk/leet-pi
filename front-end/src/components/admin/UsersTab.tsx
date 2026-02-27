import { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, ShieldCheck, Shield, User as UserIcon, CheckCircle, XCircle, Search, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { apiService } from '@/services/api';
import type { AdminUser } from '@/types';
import UserDetailModal from './UserDetailModal';
import CSVUploadModal from './CSVUploadModal';

const PAGE_SIZE = 10;

const ROLE_CHIPS = [
  { label: 'Todos',      value: '',           icon: null,       baseClass: 'bg-white text-gray-500 border-2 border-gray-200',        activeClass: 'bg-white text-gray-500 border-2 border-gray-500' },
  { label: 'SUPERADMIN', value: 'superadmin', icon: ShieldCheck, baseClass: 'bg-purple-100 text-purple-800 border-2 border-purple-200', activeClass: 'bg-purple-100 text-purple-800 border-2 border-purple-500' },
  { label: 'ADMIN',      value: 'admin',      icon: Shield,      baseClass: 'bg-blue-100 text-blue-800 border-2 border-blue-200',      activeClass: 'bg-blue-100 text-blue-800 border-2 border-blue-500' },
  { label: 'ALUMNO',     value: 'alumno',     icon: UserIcon,    baseClass: 'bg-gray-100 text-gray-600 border-2 border-gray-200',      activeClass: 'bg-gray-100 text-gray-600 border-2 border-gray-400' },
];

const STATUS_CHIPS = [
  { label: 'Todos',          value: undefined as boolean | undefined, icon: null,         baseClass: 'bg-white text-gray-500 border-2 border-gray-200',      activeClass: 'bg-white text-gray-500 border-2 border-gray-500' },
  { label: 'Habilitado',     value: true as boolean | undefined,      icon: CheckCircle,  baseClass: 'bg-green-100 text-green-800 border-2 border-green-200', activeClass: 'bg-green-100 text-green-800 border-2 border-green-500' },
  { label: 'Deshabilitado',  value: false as boolean | undefined,     icon: XCircle,      baseClass: 'bg-red-100 text-red-800 border-2 border-red-200',       activeClass: 'bg-red-100 text-red-800 border-2 border-red-500' },
];

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

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [roleFilter, setRoleFilter] = useState('');
  const [enabledFilter, setEnabledFilter] = useState<boolean | undefined>(undefined);
  const [csvModalOpen, setCsvModalOpen] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSuperAdmin = currentUserRoles.includes('superadmin');

  const loadUsers = async (searchTerm: string, page: number, role: string, enabledVal: boolean | undefined) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getAdminUsers({
        search: searchTerm,
        page,
        limit: PAGE_SIZE,
        role: role || undefined,
        enabled: enabledVal,
      });
      if (response.success && response.data) {
        setUsers(response.data.users);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
      } else {
        setError('Error al cargar los usuarios');
      }
    } catch {
      setError('Error al cargar los usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce: update effective search after 400ms and reset page
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, 400);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchInput]);

  // Fetch when effective search, page, or filters change
  useEffect(() => {
    loadUsers(search, currentPage, roleFilter, enabledFilter);
  }, [search, currentPage, roleFilter, enabledFilter]);

  const canToggleEnabled = (target: AdminUser): boolean => {
    if (target.roles.includes('superadmin')) return false;
    if (target.roles.includes('admin') && !isSuperAdmin) return false;
    return true;
  };

  const handleToggleEnabled = async (target: AdminUser) => {
    const newEnabled = !target.enabled;

    setUsers((prev) =>
      prev.map((u) => (u.id === target.id ? { ...u, enabled: newEnabled } : u))
    );
    setPendingIds((prev) => new Set(prev).add(target.id));

    try {
      const response = await apiService.updateUserEnabled(target.id, newEnabled);
      if (!response.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === target.id ? { ...u, enabled: target.enabled } : u))
        );
      }
    } catch {
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

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 space-y-3">
          {/* Search + buttons row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar por nombre, apellido o email..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setCsvModalOpen(true)}
              className="flex items-center gap-1.5 text-sm text-gray-700 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 font-medium px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              <Upload className="w-4 h-4" />
              Cargar CSV
            </button>
          </div>

          {/* Filter chips */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 font-medium">Rol:</span>
            {ROLE_CHIPS.map((chip) => {
              const Icon = chip.icon;
              const isActive = roleFilter === chip.value;
              return (
                <button
                  key={chip.value}
                  onClick={() => { setRoleFilter(chip.value); setCurrentPage(1); }}
                  className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-semibold transition-colors ${isActive ? chip.activeClass : chip.baseClass}`}
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  {chip.label}
                </button>
              );
            })}
            <span className="text-xs text-gray-500 font-medium ml-1">Estado:</span>
            {STATUS_CHIPS.map((chip) => {
              const Icon = chip.icon;
              const isActive = enabledFilter === chip.value;
              return (
                <button
                  key={String(chip.value)}
                  onClick={() => { setEnabledFilter(chip.value); setCurrentPage(1); }}
                  className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-semibold transition-colors ${isActive ? chip.activeClass : chip.baseClass}`}
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table body */}
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
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-6">
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">{error}</p>
                        <button
                          onClick={() => loadUsers(search, currentPage, roleFilter, enabledFilter)}
                          className="mt-2 text-sm text-red-700 underline"
                        >
                          Reintentar
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    {search || roleFilter || enabledFilter !== undefined
                      ? 'No se encontraron usuarios para los filtros aplicados'
                      : 'No hay usuarios registrados'}
                  </td>
                </tr>
              ) : (
                users.map((u) => {
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
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with pagination */}
        <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-500">{total} usuario{total !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || isLoading}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Página siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <UserDetailModal
        isOpen={selectedUser !== null}
        userId={selectedUser?.id ?? null}
        userRoles={selectedUser?.roles ?? []}
        onClose={() => setSelectedUser(null)}
      />

      <CSVUploadModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
      />
    </>
  );
}
