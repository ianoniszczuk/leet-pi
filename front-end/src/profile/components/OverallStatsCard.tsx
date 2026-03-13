import { FileText, CheckCircle, XCircle } from 'lucide-react';

interface OverallStatsCardProps {
    totalSubmissions: number;
    successfulSubmissions: number;
    successRate: number;
}

export default function OverallStatsCard({
    totalSubmissions,
    successfulSubmissions,
    successRate,
}: OverallStatsCardProps) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen General</h3>

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
                    <span className="font-semibold text-gray-900">
                        {totalSubmissions - successfulSubmissions}
                    </span>
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
    );
}
