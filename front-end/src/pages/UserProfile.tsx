import { User, Mail, Calendar, Award, FileText, CheckCircle, XCircle } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useCachedUserProfile, useCachedMySubmissions } from '@/hooks/useCachedApi';
import type { UserProfile, Submission } from '@/types';

export default function UserProfile() {
  const { user: auth0User } = useAuth();
  
  const {
    data: userProfile,
    loading: profileLoading,
    error: profileError,
  } = useCachedUserProfile();

  const {
    data: submissions,
    loading: submissionsLoading,
  } = useCachedMySubmissions();

  if (profileLoading) {
    return (
      <ProtectedRoute>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-48"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (profileError) {
    return (
      <ProtectedRoute>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-danger-50 border border-danger-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-danger-700 mb-2">
              Error al cargar perfil
            </h2>
            <p className="text-danger-600">{profileError}</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const successfulSubmissions = submissions?.filter(s => s.success).length || 0;
  const totalSubmissions = submissions?.length || 0;
  const successRate = totalSubmissions > 0 ? Math.round((successfulSubmissions / totalSubmissions) * 100) : 0;

  // Group submissions by exercise
  const exerciseStats = submissions?.reduce((acc, submission) => {
    const key = `${submission.guideNumber}-${submission.exerciseNumber}`;
    if (!acc[key]) {
      acc[key] = {
        guideNumber: submission.guideNumber,
        exerciseNumber: submission.exerciseNumber,
        total: 0,
        successful: 0,
      };
    }
    acc[key].total++;
    if (submission.success) {
      acc[key].successful++;
    }
    return acc;
  }, {} as Record<string, { guideNumber: number; exerciseNumber: number; total: number; successful: number }>) || {};

  const recentSubmissions = submissions?.slice(0, 5) || [];

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mi Perfil
          </h1>
          <p className="text-gray-600">
            Información de tu cuenta y estadísticas de progreso.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Info Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                  {auth0User?.picture ? (
                    <img
                      src={auth0User.picture}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full"
                    />
                  ) : (
                    <User className="w-8 h-8 text-primary-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {userProfile?.firstName} {userProfile?.lastName}
                  </h2>
                  <p className="text-gray-600">{userProfile?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{userProfile?.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Miembro desde</p>
                    <p className="font-medium text-gray-900">
                      {userProfile ? new Date().toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'long' 
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Exercise Statistics */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Estadísticas por Ejercicio
              </h3>
              
              {Object.keys(exerciseStats).length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No hay envíos aún. ¡Envía tu primera solución!
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.values(exerciseStats).map((exercise, index) => {
                    const exerciseSuccessRate = Math.round((exercise.successful / exercise.total) * 100);
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">
                            Guía {exercise.guideNumber} - Ejercicio {exercise.exerciseNumber}
                          </p>
                          <p className="text-sm text-gray-600">
                            {exercise.successful}/{exercise.total} éxitos
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${exerciseSuccessRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700 w-12 text-right">
                            {exerciseSuccessRate}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* Overall Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Resumen General
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-600">Total Envíos</span>
                  </div>
                  <span className="font-semibold text-gray-900">{totalSubmissions}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-success-600" />
                    <span className="text-gray-600">Exitosos</span>
                  </div>
                  <span className="font-semibold text-gray-900">{successfulSubmissions}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-danger-600" />
                    <span className="text-gray-600">Fallidos</span>
                  </div>
                  <span className="font-semibold text-gray-900">{totalSubmissions - successfulSubmissions}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Tasa de Éxito</span>
                    <span className="font-semibold text-gray-900">{successRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${successRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Submissions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Envíos Recientes
              </h3>
              
              {recentSubmissions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No hay envíos recientes
                </p>
              ) : (
                <div className="space-y-3">
                  {recentSubmissions.map((submission, index) => (
                    <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          G{submission.guideNumber} - E{submission.exerciseNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(submission.createdAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      {submission.success ? (
                        <CheckCircle className="w-4 h-4 text-success-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-danger-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-primary-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">
                Acciones Rápidas
              </h3>
              <div className="space-y-3">
                <a
                  href="/submit"
                  className="block w-full bg-primary-600 hover:bg-primary-700 text-white text-center font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Enviar Nuevo Código
                </a>
                <a
                  href="/submissions"
                  className="block w-full bg-white hover:bg-gray-50 text-primary-600 text-center font-medium py-2 px-4 rounded-lg border border-primary-600 transition-colors duration-200"
                >
                  Ver Todos los Envíos
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
