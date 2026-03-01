import { ResponsiveBar } from '@nivo/bar';
import type { ExerciseErrorRateMetric } from '@/types';
import { EmptyState } from './EmptyState';

interface DifficultyBarChartProps {
    data: ExerciseErrorRateMetric[];
    /** When set, filter to only show exercises from this guide */
    selectedGuide?: number | null;
    id?: string;
}

export function DifficultyBarChart({ data, selectedGuide, id }: DifficultyBarChartProps) {
    // Filter by guide if specified
    const filtered = selectedGuide != null
        ? data.filter(e => e.guideNumber === selectedGuide)
        : data;

    // Take top 5 by error rate
    const top5 = [...filtered]
        .sort((a, b) => b.errorRate - a.errorRate)
        .slice(0, 5)
        .map(e => ({
            id: `G${e.guideNumber}·E${e.exerciseNumber}`,
            errorRate: Math.round(e.errorRate * 100),
            color: e.errorRate >= 0.7 ? '#cf222e' : e.errorRate >= 0.4 ? '#bf8700' : '#6e7781',
        }));

    if (top5.length === 0) return <EmptyState label="Sin datos de error" />;

    return (
        <div id={id} className="bg-white rounded-md border border-[#d0d7de] p-4 transition-shadow">
            <h3 className="text-xs font-semibold text-[#57606a] uppercase tracking-widest mb-4">
                Top {top5.length} ejercicios difíciles
                {selectedGuide != null && <span className="text-[#6e7781]"> — Guía {selectedGuide}</span>}
            </h3>
            <div className="h-[200px]">
                <ResponsiveBar
                    data={top5}
                    keys={['errorRate']}
                    indexBy="id"
                    layout="horizontal"
                    margin={{ top: 0, right: 24, bottom: 24, left: 72 }}
                    padding={0.35}
                    colors={({ data }) => (data as { color: string }).color}
                    borderRadius={2}
                    enableGridX={true}
                    enableGridY={false}
                    gridXValues={5}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{ tickSize: 0, tickPadding: 8, format: v => `${v}%` }}
                    axisLeft={{ tickSize: 0, tickPadding: 8 }}
                    label={d => `${d.value}%`}
                    labelSkipWidth={24}
                    labelTextColor="#ffffff"
                    theme={{
                        axis: {
                            ticks: {
                                text: { fontSize: 10, fill: '#57606a', fontFamily: 'JetBrains Mono, monospace' },
                            },
                        },
                        grid: { line: { stroke: '#f0f2f5', strokeDasharray: '4 4' } },
                        labels: { text: { fontSize: 10, fontFamily: 'JetBrains Mono, monospace' } },
                    }}
                    tooltip={({ data, value }) => (
                        <div className="bg-white border border-[#d0d7de] rounded px-3 py-2 text-xs font-mono shadow-sm">
                            <p className="text-[#57606a] mb-0.5">{data.id as string}</p>
                            <p className="font-semibold" style={{ color: data.color as string }}>
                                {value}% errores
                            </p>
                        </div>
                    )}
                />
            </div>
        </div>
    );
}
