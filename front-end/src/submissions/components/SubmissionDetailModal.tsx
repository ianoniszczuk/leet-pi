import { XCircle } from 'lucide-react';
import StatusBadge from '@/shared/components/StatusBadge';
import type { Submission } from '@/submissions/types';

interface SubmissionDetailModalProps {
    submission: Submission | null;
    isOpen: boolean;
    onClose: () => void;
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

export default function SubmissionDetailModal({
    submission,
    isOpen,
    onClose,
}: SubmissionDetailModalProps) {
    if (!isOpen || !submission) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Detalles del Envío</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm font-medium text-gray-600">Guía:</span>
                                <p className="text-gray-900">{submission.guideNumber}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-600">Ejercicio:</span>
                                <p className="text-gray-900">{submission.exerciseNumber}</p>
                            </div>
                        </div>

                        <div>
                            <span className="text-sm font-medium text-gray-600">Fecha:</span>
                            <p className="text-gray-900">{formatDate(submission.createdAt)}</p>
                        </div>

                        <div>
                            <span className="text-sm font-medium text-gray-600">Estado:</span>
                            <span className="ml-2">
                                <StatusBadge success={submission.success} />
                            </span>
                        </div>

                        <div>
                            <span className="text-sm font-medium text-gray-600">Código Enviado:</span>
                            <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-sm font-mono overflow-x-auto">
                                {submission.code}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
