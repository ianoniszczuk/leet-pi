import { useState } from 'react';
import type { ExerciseCompletionMatrixMetric } from '@/types';
import { EmptyState } from './EmptyState';

// GitHub green scale
const heatColor = (rate: number): string => {
    if (rate === 0) return '#ebedf0';
    if (rate < 0.25) return '#9be9a8';
    if (rate < 0.5) return '#40c463';
    if (rate < 0.75) return '#30a14e';
    return '#216e39';
};

type HeatMode = 'completion' | 'attempted';

interface GuideHeatmapProps {
    cells: ExerciseCompletionMatrixMetric[];
    /** Externally controlled selected guide */
    selectedGuide: number | null;
    id?: string;
}

export function GuideHeatmap({ cells, selectedGuide, id }: GuideHeatmapProps) {
    const [mode, setMode] = useState<HeatMode>('completion');

    const guideCells = cells.filter(c => c.guideNumber === selectedGuide);

    return (
        <div id={id} className="bg-white rounded-md border border-[#d0d7de] p-4 transition-shadow">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                <h3 className="text-xs font-semibold text-[#57606a] uppercase tracking-widest">
                    Heatmap de completitud — Guía {selectedGuide ?? '—'}
                </h3>

                {/* Mode toggle */}
                <div className="flex rounded-md border border-[#d0d7de] overflow-hidden text-xs font-medium w-fit">
                    {([
                        { id: 'completion' as HeatMode, label: 'Resueltos' },
                        { id: 'attempted' as HeatMode, label: 'Intentaron' },
                    ]).map(o => (
                        <button
                            key={o.id}
                            onClick={() => setMode(o.id)}
                            className={`px-3 py-1.5 transition-colors ${mode === o.id
                                ? 'bg-[#24292f] text-white'
                                : 'bg-white text-[#57606a] hover:bg-[#f6f8fa]'
                                }`}
                        >
                            {o.label}
                        </button>
                    ))}
                </div>
            </div>

            {guideCells.length === 0 ? (
                <EmptyState label="Sin ejercicios habilitados en esta guía" />
            ) : (
                <>
                    {/* Legend */}
                    <div className="flex items-center gap-1.5 mb-3 text-[10px] text-[#57606a]">
                        <span>0%</span>
                        {['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'].map((c, i) => (
                            <div key={i} className="w-[10px] h-[10px] rounded-sm" style={{ backgroundColor: c }} />
                        ))}
                        <span>100%</span>
                        <span className="ml-2 text-[#6e7781]">
                            ({mode === 'completion' ? 'completados' : 'intentaron'})
                        </span>
                    </div>

                    {/* Grid */}
                    <div className="flex flex-wrap gap-1.5">
                        {guideCells.map(cell => {
                            const rate = mode === 'completion' ? cell.completionRate : cell.attemptedRate;
                            const pct = Math.round(rate * 100);
                            return (
                                <div key={`${cell.guideNumber}-${cell.exerciseNumber}`} className="group relative">
                                    <div
                                        className="w-9 h-9 rounded-sm cursor-default transition-transform hover:scale-110"
                                        style={{ backgroundColor: heatColor(rate) }}
                                    />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-max hidden group-hover:block z-10">
                                        <div className="bg-[#24292f] text-white text-[10px] rounded px-2 py-1 font-mono whitespace-nowrap">
                                            G{cell.guideNumber}-E{cell.exerciseNumber}: {pct}%
                                            {cell.totalStudents > 0 && (
                                                <span className="text-[#8c959f] ml-1">
                                                    ({Math.round(rate * cell.totalStudents)}/{cell.totalStudents})
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-center text-[9px] text-[#57606a] mt-0.5 font-mono leading-none">
                                        {cell.exerciseNumber}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
