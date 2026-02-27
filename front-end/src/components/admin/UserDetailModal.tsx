import { useState, useEffect } from 'react';
import { X, User, Loader2, AlertCircle, ShieldCheck, Shield } from 'lucide-react';
import { apiService } from '@/services/api';
import type { UserDetailData, UserDetailExercise } from '@/types';

interface UserDetailModalProps {
  isOpen: boolean;
  userId: string | null;
  userRoles: string[];
  onClose: () => void;
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
      <User className="w-3 h-3" />
      ALUMNO
    </span>
  );
}

function ExerciseStatusIcon({ exercise }: { exercise: UserDetailExercise }) {
  if (exercise.solved) {
    return (
      <span className="text-success-600 font-bold text-base leading-none" title="Resuelto">
        ✓
      </span>
    );
  }
  if (exercise.attempted) {
    return (
      <span className="text-danger-600 font-bold text-base leading-none" title="Intentado">
        ✗
      </span>
    );
  }
  return (
    <span className="text-gray-400 font-bold text-base leading-none" title="Sin intentar">
      —
    </span>
  );
}

export default function UserDetailModal({ isOpen, userId, userRoles, onClose }: UserDetailModalProps) {
  const [data, setData] = useState<UserDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!userId) {
      setData(null);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setData(null);

    apiService
      .getAdminUserDetails(userId)
      .then((response) => {
        if (cancelled) return;
        if (response.success && response.data) {
          setData(response.data);
        } else {
          setError('No se pudieron cargar los detalles del usuario.');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Error de conexión. Intentá de nuevo.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  if (!isOpen) return null;

  const formattedDate = data?.lastSubmissionAt
    ? new Date(data.lastSubmissionAt).toLocaleString('es-AR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-200 ${
          isClosing ? 'opacity-0' : 'opacity-50'
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-xl shadow-2xl max-w-3xl w-full transform transition-all duration-200 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              {data ? (
                <>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {data.firstName} {data.lastName}
                    </h3>
                    <RoleBadge roles={userRoles} />
                  </div>
                  <p className="text-sm text-gray-500">{data.email}</p>
                </>
              ) : (
                <h3 className="text-lg font-semibold text-gray-900">Detalle de usuario</h3>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}

          {error && !isLoading && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {data && !isLoading && (
            <>
              {/* Meta row */}
              <p className="text-sm text-gray-500 mb-4">
                Último envío:{' '}
                <span className="font-medium text-gray-700">
                  {formattedDate ?? 'Sin envíos'}
                </span>
              </p>

              {/* Legend */}
              <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="text-success-600 font-bold">✓</span> Resuelto
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-danger-600 font-bold">✗</span> Intentado
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-gray-400 font-bold">—</span> Sin intentar
                </span>
              </div>

              {/* Guides */}
              <div className="overflow-y-auto max-h-[60vh] space-y-4 pr-1">
                {data.guides.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">Sin guías disponibles</p>
                )}
                {data.guides.map((guide) => (
                  <div key={guide.guideNumber} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Guide header */}
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                      <span className="text-sm font-semibold text-gray-800">
                        Guía {guide.guideNumber}
                      </span>
                      {guide.enabled ? (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                          Habilitada
                        </span>
                      ) : (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                          Deshabilitada
                        </span>
                      )}
                    </div>

                    {/* Exercises */}
                    <div className="p-3">
                      {guide.exercises.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-2">Sin ejercicios</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {guide.exercises.map((exercise) => (
                            <div
                              key={exercise.exerciseNumber}
                              className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg border text-center ${
                                exercise.solved
                                  ? 'bg-success-50 border-success-200'
                                  : exercise.attempted
                                  ? 'bg-red-50 border-red-200'
                                  : 'bg-gray-50 border-gray-200'
                              } ${!exercise.enabled ? 'opacity-50' : ''}`}
                              title={`Ejercicio ${exercise.exerciseNumber}${!exercise.enabled ? ' (deshabilitado)' : ''}`}
                            >
                              <span className="text-xs text-gray-500 mb-0.5">
                                E{exercise.exerciseNumber}
                              </span>
                              <ExerciseStatusIcon exercise={exercise} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 pb-6">
          <button
            onClick={handleClose}
            className="px-5 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
