import { Eye, Calendar, CheckCircle, XCircle } from 'lucide-react';
import StatusBadge from '@/shared/components/StatusBadge';
import type { Submission } from '@/submissions/types';

interface SubmissionsListProps {
    submissions: Submission[];
    onSelectSubmission: (submission: Submission) => void;
}

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getStatusIcon(success: boolean) {
    return success ? (
        <CheckCircle className="w-5 h-5 text-success-600" />
    ) : (
        <XCircle className="w-5 h-5 text-danger-600" />
    );
}

export default function SubmissionsList({ submissions, onSelectSubmission }: SubmissionsListProps) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Historial de Envíos</h2>
            </div>

            <div className="divide-y divide-gray-200">
                {submissions.map((submission) => (
                    <div
                        key={`${submission.userId}-${submission.guideNumber}-${submission.exerciseNumber}-${submission.createdAt}`}
                        className="p-6 hover:bg-gray-50 transition-colors duration-200"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex-shrink-0">{getStatusIcon(submission.success)}</div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <StatusBadge success={submission.success} />
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
                                onClick={() => onSelectSubmission(submission)}
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
    );
}
