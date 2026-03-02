import type { StudentProgressMetric } from '@/types';
import { EmptyState } from './EmptyState';

interface StudentProgressListProps {
    data: StudentProgressMetric[];
}

const GH = {
    green: '#2da44e',
    blue: '#0969da',
    red: '#cf222e',
};

export function StudentProgressList({ data }: StudentProgressListProps) {
    if (data.length === 0) return <EmptyState label="Sin alumnos habilitados" />;

    return (
        <div className="bg-white rounded-md border border-[#d0d7de] p-4">
            <h3 className="text-xs font-semibold text-[#57606a] uppercase tracking-widest mb-3">
                Progreso individual
            </h3>
            <div className="overflow-y-auto max-h-56 space-y-1.5">
                {data.map(s => {
                    const color = s.progress >= 80 ? GH.green : s.progress >= 40 ? GH.blue : GH.red;
                    return (
                        <div key={s.userId} className="flex items-center gap-2">
                            <span className="text-xs text-[#57606a] w-36 truncate font-mono">
                                {s.fullName ?? '—'}
                            </span>
                            <div className="flex-1 bg-[#f6f8fa] rounded-sm h-2 border border-[#d0d7de]">
                                <div
                                    className="h-2 rounded-sm transition-all"
                                    style={{ width: `${s.progress}%`, backgroundColor: color }}
                                />
                            </div>
                            <span className="text-[10px] font-mono text-[#24292f] w-9 text-right tabular-nums">
                                {s.progress}%
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
