import { useState } from 'react';
import { FileText, Eye, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useCachedMySubmissions } from '@/hooks/useCachedApi';
import type { Submission } from '@/types';

export default function MySubmissions() {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const {
    data: submissions,
    loading,
    error,
    refetch,
  } = useCachedMySubmissions();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-5 h-5 text-success-600" />
    ) : (
      <XCircle className="w-5 h-5 text-danger-600" />
    );
  };

  const getStatusColor = (success: boolean) => {
    return success
      ? 'bg-success-50 border-success-200 text-success-700'
      : 'bg-danger-50 border-danger-200 text-danger-700';
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-danger-50 border border-danger-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-danger-700 mb-2">
              Error al cargar submissions
            </h2>
            <p className="text-danger-600 mb-4">{error}</p>
            <button
              onClick={refetch}
              className="bg-danger-600 hover:bg-danger-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Reintentar
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mis Envíos
          </h1>
          <p className="text-gray-600">
            Revisa el historial de todas tus soluciones enviadas.
          </p>
        </div>

        {!submissions || submissions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay submissions aún
            </h3>
            <p className="text-gray-600 mb-6">
              Envía tu primera solución para verla aparecer aquí.
            </p>
            <a
              href="/submit"
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Enviar Código
            </a>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-primary-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Envíos</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {submissions.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-success-600" />
                  <div>
                    <p className="text-sm text-gray-600">Exitosos</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {submissions.filter(s => s.success).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-primary-600 font-bold text-sm">
                      {Math.round((submissions.filter(s => s.success).length / submissions.length) * 100)}%
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tasa de Éxito</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round((submissions.filter(s => s.success).length / submissions.length) * 100)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submissions List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Historial de Envíos
                </h2>
              </div>

              <div className="divide-y divide-gray-200">
                {submissions.map((submission, index) => (
                  <div
                    key={`${submission.userId}-${submission.guideNumber}-${submission.exerciseNumber}-${submission.createdAt}`}
                    className="p-6 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          {getStatusIcon(submission.success)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.success)}`}>
                              {submission.success ? 'Exitoso' : 'Fallido'}
                            </span>
                            <span className="text-sm text-gray-500">
                              Guía {submission.guideNumber} - Ejercicio {submission.exerciseNumber}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(submission.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setShowDetails(true);
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Details Modal */}
        {showDetails && selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detalles del Envío
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Guía:</span>
                      <p className="text-gray-900">{selectedSubmission.guideNumber}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Ejercicio:</span>
                      <p className="text-gray-900">{selectedSubmission.exerciseNumber}</p>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-600">Fecha:</span>
                    <p className="text-gray-900">{formatDate(selectedSubmission.createdAt)}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-600">Estado:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedSubmission.success)}`}>
                      {selectedSubmission.success ? 'Exitoso' : 'Fallido'}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-600">Código Enviado:</span>
                    <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-sm font-mono overflow-x-auto">
                      {selectedSubmission.code}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
