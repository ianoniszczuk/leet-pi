import { CheckCircle, XCircle } from 'lucide-react';
import type { Submission } from '@/submissions/types';

interface RecentSubmissionsCardProps {
    submissions: Submission[];
}

export default function RecentSubmissionsCard({ submissions }: RecentSubmissionsCardProps) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Envíos Recientes</h3>

            {submissions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No hay envíos recientes</p>
            ) : (
                <div className="space-y-3">
                    {submissions.map((submission, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                        >
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
    );
}
