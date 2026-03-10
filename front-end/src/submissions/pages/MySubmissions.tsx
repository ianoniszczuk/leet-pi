import { useState } from 'react';
import { FileText } from 'lucide-react';
import ProtectedRoute from '@/auth/components/ProtectedRoute';
import { useCachedMySubmissions } from '@/shared/hooks/useCachedApi';
import PageHeader from '@/shared/components/PageHeader';
import SubmissionSummaryStats from '@/submissions/components/SubmissionSummaryStats';
import SubmissionsList from '@/submissions/components/SubmissionsList';
import SubmissionDetailModal from '@/submissions/components/SubmissionDetailModal';
import type { Submission } from '@/submissions/types';

export default function MySubmissions() {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  const { data: submissions, loading, error, refetch } = useCachedMySubmissions();

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded" />
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

  const successfulCount = submissions?.filter((s) => s.success).length ?? 0;
  const total = submissions?.length ?? 0;
  const successRate = total > 0 ? Math.round((successfulCount / total) * 100) : 0;

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Mis Envíos"
          subtitle="Revisa el historial de todas tus soluciones enviadas."
        />

        {!submissions || submissions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay submissions aún</h3>
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
            <SubmissionSummaryStats
              total={total}
              successful={successfulCount}
              successRate={successRate}
            />
            <SubmissionsList
              submissions={submissions}
              onSelectSubmission={setSelectedSubmission}
            />
          </>
        )}

        <SubmissionDetailModal
          submission={selectedSubmission}
          isOpen={selectedSubmission !== null}
          onClose={() => setSelectedSubmission(null)}
        />
      </div>
    </ProtectedRoute>
  );
}
