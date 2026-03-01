import { ResponsiveLine } from '@nivo/line';
import type { WeeklyActivityMetric } from '@/types';
import { EmptyState } from './EmptyState';

interface ProgressLineChartProps {
    data: WeeklyActivityMetric[];
    id?: string;
}

export function ProgressLineChart({ data, id }: ProgressLineChartProps) {
    if (data.length === 0) return <EmptyState label="Sin actividad registrada" />;

    const lineData = [
        {
            id: 'envíos',
            data: data.map(d => ({ x: d.week, y: d.count })),
        },
    ];

    return (
        <div id={id} className="bg-white rounded-md border border-[#d0d7de] p-4 transition-shadow">
            <h3 className="text-xs font-semibold text-[#57606a] uppercase tracking-widest mb-4">
                Evolución semanal · envíos totales
            </h3>
            <div className="h-[200px]">
                <ResponsiveLine
                    data={lineData}
                    curve="monotoneX"
                    margin={{ top: 8, right: 16, bottom: 32, left: 40 }}
                    xScale={{ type: 'point' }}
                    yScale={{ type: 'linear', min: 0, stacked: false }}
                    enablePoints={false}
                    enableArea={true}
                    areaOpacity={0.05}
                    colors={['#0969da']}
                    lineWidth={2}
                    useMesh={true}
                    enableSlices="x"
                    gridXValues={[]}
                    gridYValues={5}
                    theme={{
                        axis: {
                            ticks: {
                                text: {
                                    fontSize: 10,
                                    fill: '#57606a',
                                    fontFamily: 'JetBrains Mono, monospace',
                                },
                            },
                        },
                        grid: {
                            line: {
                                stroke: '#f0f2f5',
                                strokeDasharray: '4 4',
                            },
                        },
                        crosshair: {
                            line: {
                                stroke: '#d0d7de',
                                strokeWidth: 1,
                            },
                        },
                    }}
                    sliceTooltip={({ slice }) => (
                        <div className="bg-white border border-[#d0d7de] rounded px-3 py-2 text-xs font-mono shadow-sm">
                            <p className="text-[#57606a] mb-1">{String(slice.points[0]?.data.x)}</p>
                            <p className="font-semibold text-[#0969da]">
                                {String(slice.points[0]?.data.y)} envíos
                            </p>
                        </div>
                    )}
                />
            </div>
        </div>
    );
}
