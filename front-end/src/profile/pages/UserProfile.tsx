import { useState } from 'react';
import ProtectedRoute from '@/auth/components/ProtectedRoute';
import { useAuth } from '@/auth/hooks/useAuth';
import { useCachedUserProfile, useCachedMySubmissions } from '@/shared/hooks/useCachedApi';
import PageHeader from '@/shared/components/PageHeader';
import EditProfileModal from '@/profile/components/EditProfileModal';
import UserInfoCard from '@/profile/components/UserInfoCard';
import ExerciseStatsCard from '@/profile/components/ExerciseStatsCard';
import OverallStatsCard from '@/profile/components/OverallStatsCard';
import RecentSubmissionsCard from '@/profile/components/RecentSubmissionsCard';
import QuickActionsCard from '@/profile/components/QuickActionsCard';
import type { Submission } from '@/submissions/types';

export default function UserProfile() {
  const { user: auth0User } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const {
    data: userProfile,
    loading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useCachedUserProfile();

  const { data: submissions } = useCachedMySubmissions();

  if (profileLoading) {
    return (
      <ProtectedRoute>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full" />
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-48" />
                  <div className="h-4 bg-gray-200 rounded w-32" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded" />
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
            <h2 className="text-lg font-semibold text-danger-700 mb-2">Error al cargar perfil</h2>
            <p className="text-danger-600">{profileError}</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const successfulSubmissions = submissions?.filter((s: Submission) => s.success).length ?? 0;
  const totalSubmissions = submissions?.length ?? 0;
  const successRate =
    totalSubmissions > 0 ? Math.round((successfulSubmissions / totalSubmissions) * 100) : 0;

  const exerciseStats = submissions?.reduce(
    (acc, submission: Submission) => {
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
      if (submission.success) acc[key].successful++;
      return acc;
    },
    {} as Record<string, { guideNumber: number; exerciseNumber: number; total: number; successful: number }>
  ) ?? {};

  const recentSubmissions = submissions?.slice(0, 5) ?? [];

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Mi Perfil"
          subtitle="Información de tu cuenta y estadísticas de progreso."
        />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            <UserInfoCard
              auth0User={auth0User}
              userProfile={userProfile}
              onEditClick={() => setIsEditModalOpen(true)}
            />
            <ExerciseStatsCard exerciseStats={exerciseStats} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <OverallStatsCard
              totalSubmissions={totalSubmissions}
              successfulSubmissions={successfulSubmissions}
              successRate={successRate}
            />
            <RecentSubmissionsCard submissions={recentSubmissions} />
            <QuickActionsCard />
          </div>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSaved={refetchProfile}
        currentFullName={userProfile?.fullName ?? ''}
      />
    </ProtectedRoute>
  );
}
