import { ResponsiveBar } from '@nivo/bar';
import type { StudentProgressMetric } from '@/types';
import { EmptyState } from './EmptyState';

interface DistributionBarChartProps {
    data: StudentProgressMetric[];
}

const BUCKETS = ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'];
const BUCKET_COLORS: Record<string, string> = {
    '0-20%': '#cf222e',
    '21-40%': '#bf8700',
    '41-60%': '#0969da',
    '61-80%': '#2da44e',
    '81-100%': '#8250df',
};

export function DistributionBarChart({ data }: DistributionBarChartProps) {
    const bucketMap: Record<string, number> = Object.fromEntries(BUCKETS.map(b => [b, 0]));
    data.forEach(s => {
        const p = s.progress;
        const b =
            p <= 20 ? '0-20%' :
                p <= 40 ? '21-40%' :
                    p <= 60 ? '41-60%' :
                        p <= 80 ? '61-80%' : '81-100%';
        bucketMap[b]++;
    });

    const chartData = BUCKETS.map(b => ({
        bucket: b,
        count: bucketMap[b],
        color: BUCKET_COLORS[b],
    }));

    if (!chartData.some(d => d.count > 0)) return <EmptyState label="Sin datos de progreso" />;

    return (
        <div className="bg-white rounded-md border border-[#d0d7de] p-4">
            <h3 className="text-xs font-semibold text-[#57606a] uppercase tracking-widest mb-4">
                Distribución de progreso
            </h3>
            <div className="h-[200px]">
                <ResponsiveBar
                    data={chartData}
                    keys={['count']}
                    indexBy="bucket"
                    margin={{ top: 8, right: 8, bottom: 32, left: 36 }}
                    padding={0.3}
                    colors={({ data }) => (data as { color: string }).color}
                    borderRadius={2}
                    enableGridX={false}
                    enableGridY={true}
                    gridYValues={5}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                        tickSize: 0,
                        tickPadding: 8,
                    }}
                    axisLeft={{
                        tickSize: 0,
                        tickPadding: 8,
                    }}
                    labelSkipHeight={12}
                    labelTextColor="#ffffff"
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
                        labels: {
                            text: {
                                fontSize: 10,
                                fontFamily: 'JetBrains Mono, monospace',
                            },
                        },
                    }}
                    tooltip={({ data, value }) => (
                        <div className="bg-white border border-[#d0d7de] rounded px-3 py-2 text-xs font-mono shadow-sm">
                            <p className="text-[#57606a] mb-0.5">{data.bucket as string}</p>
                            <p className="font-semibold text-[#24292f]">{value} alumnos</p>
                        </div>
                    )}
                />
            </div>
        </div>
    );
}
