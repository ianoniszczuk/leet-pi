import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    icon: LucideIcon;
    iconColorClass: string;
    label: string;
    value: string | number;
}

export default function StatCard({ icon: Icon, iconColorClass, label, value }: StatCardProps) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
                <Icon className={`w-8 h-8 ${iconColorClass}`} />
                <div>
                    <p className="text-sm text-gray-600">{label}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    );
}
