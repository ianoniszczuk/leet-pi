import { ResponsiveBar } from '@nivo/bar';
import type { ExerciseAttemptsMetric } from '@/types';
import { EmptyState } from './EmptyState';

interface AttemptsBarChartProps {
    data: ExerciseAttemptsMetric[];
    /** When set, filter to only show exercises from this guide */
    selectedGuide?: number | null;
    id?: string;
}

export function AttemptsBarChart({ data, selectedGuide, id }: AttemptsBarChartProps) {
    const filtered = selectedGuide != null
        ? data.filter(a => a.guideNumber === selectedGuide)
        : data;

    const chartData = filtered.map(a => ({
        id: `G${a.guideNumber}·E${a.exerciseNumber}`,
        avgAttempts: Number(a.avgAttempts.toFixed(1)),
    }));

    if (chartData.length === 0) return <EmptyState label="Sin envíos registrados" />;

    return (
        <div id={id} className="bg-white rounded-md border border-[#d0d7de] p-4 transition-shadow">
            <h3 className="text-xs font-semibold text-[#57606a] uppercase tracking-widest mb-4">
                Intentos promedio por ejercicio
                {selectedGuide != null && <span className="text-[#6e7781]"> — Guía {selectedGuide}</span>}
            </h3>
            <div className="h-[200px]">
                <ResponsiveBar
                    data={chartData}
                    keys={['avgAttempts']}
                    indexBy="id"
                    margin={{ top: 8, right: 8, bottom: 48, left: 36 }}
                    padding={0.3}
                    colors={['#0969da']}
                    borderRadius={2}
                    enableGridX={false}
                    enableGridY={true}
                    gridYValues={5}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{ tickSize: 0, tickPadding: 8, tickRotation: -40 }}
                    axisLeft={{ tickSize: 0, tickPadding: 8 }}
                    labelSkipHeight={16}
                    labelTextColor="#ffffff"
                    theme={{
                        axis: {
                            ticks: {
                                text: { fontSize: 9, fill: '#57606a', fontFamily: 'JetBrains Mono, monospace' },
                            },
                        },
                        grid: { line: { stroke: '#f0f2f5', strokeDasharray: '4 4' } },
                        labels: { text: { fontSize: 10, fontFamily: 'JetBrains Mono, monospace' } },
                    }}
                    tooltip={({ data, value }) => (
                        <div className="bg-white border border-[#d0d7de] rounded px-3 py-2 text-xs font-mono shadow-sm">
                            <p className="text-[#57606a] mb-0.5">{data.id as string}</p>
                            <p className="font-semibold text-[#0969da]">{value} intentos prom.</p>
                        </div>
                    )}
                />
            </div>
        </div>
    );
}
