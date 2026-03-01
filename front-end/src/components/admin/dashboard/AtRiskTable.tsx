import { AlertTriangle, Activity } from 'lucide-react';
import type { StudentAtRiskMetric } from '@/types';

interface AtRiskTableProps {
    data: StudentAtRiskMetric[];
    id?: string;
}

const fmtDate = (iso: string | null) =>
    iso
        ? new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
        : 'Nunca';

export function AtRiskTable({ data, id }: AtRiskTableProps) {
    return (
        <div id={id} className="bg-white rounded-md border border-[#d0d7de] p-4 transition-shadow">
            <h3 className="text-xs font-semibold text-[#57606a] uppercase tracking-widest mb-3">
                Alumnos en riesgo — sin éxito en 14 días ({data.length})
            </h3>

            {data.length > 0 ? (
                <div className="overflow-y-auto max-h-52">
                    <table className="min-w-full text-xs">
                        <thead>
                            <tr className="border-b border-[#d0d7de]">
                                <th className="text-left pb-1.5 font-medium text-[#57606a] uppercase tracking-wide">
                                    Alumno
                                </th>
                                <th className="text-right pb-1.5 font-medium text-[#57606a] uppercase tracking-wide">
                                    Último envío
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f6f8fa]">
                            {data.map(s => (
                                <tr key={s.userId} className="hover:bg-[#fff8c5] transition-colors">
                                    <td className="py-1.5 flex items-center gap-1.5 text-[#24292f] font-mono">
                                        <AlertTriangle className="w-3 h-3 text-[#bf8700] flex-shrink-0" strokeWidth={1.5} />
                                        {s.lastName}, {s.firstName}
                                    </td>
                                    <td className="py-1.5 text-right text-[#6e7781] font-mono">
                                        {fmtDate(s.lastSubmissionAt)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="flex items-center gap-2 py-3 text-sm text-[#2da44e]">
                    <Activity className="w-4 h-4" strokeWidth={1.5} />
                    <span className="font-medium">Todos los alumnos están activos</span>
                </div>
            )}
        </div>
    );
}
