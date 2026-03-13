import { FileText, CheckCircle } from 'lucide-react';
import StatCard from '@/shared/components/StatCard';

interface SubmissionSummaryStatsProps {
    total: number;
    successful: number;
    successRate: number;
}

export default function SubmissionSummaryStats({
    total,
    successful,
    successRate,
}: SubmissionSummaryStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
                icon={FileText}
                iconColorClass="text-primary-600"
                label="Total Envíos"
                value={total}
            />
            <StatCard
                icon={CheckCircle}
                iconColorClass="text-success-600"
                label="Exitosos"
                value={successful}
            />
            {/* Success-rate card: custom layout with the % as the icon area */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                        <span className="text-primary-600 font-bold text-sm">{successRate}%</span>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Tasa de Éxito</p>
                        <p className="text-2xl font-bold text-gray-900">{successRate}%</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
