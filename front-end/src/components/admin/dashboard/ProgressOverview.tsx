import { useState } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import type { StudentProgressMetric } from '@/types';
import { EmptyState } from './EmptyState';

interface ProgressOverviewProps {
    data: StudentProgressMetric[];
    id?: string;
}

const BUCKETS = ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'];
const BUCKET_COLORS: Record<string, string> = {
    '0-20%': '#cf222e',
    '21-40%': '#bf8700',
    '41-60%': '#0969da',
    '61-80%': '#2da44e',
    '81-100%': '#8250df',
};

const PROGRESS_COLORS = { green: '#2da44e', blue: '#0969da', red: '#cf222e' };

type ViewMode = 'general' | 'individual';

export function ProgressOverview({ data, id }: ProgressOverviewProps) {
    const [mode, setMode] = useState<ViewMode>('general');

    // Bucket distribution
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
    const chartData = BUCKETS.map(b => ({ bucket: b, count: bucketMap[b], color: BUCKET_COLORS[b] }));
    const hasData = chartData.some(d => d.count > 0);

    return (
        <div id={id} className="bg-white rounded-md border border-[#d0d7de] p-4 transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-[#57606a] uppercase tracking-widest">
                    Distribución de progreso
                </h3>
                <div className="flex rounded-md border border-[#d0d7de] overflow-hidden text-xs font-medium w-fit">
                    {([
                        { id: 'general' as ViewMode, label: 'General' },
                        { id: 'individual' as ViewMode, label: 'Individual' },
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

            {mode === 'general' ? (
                hasData ? (
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
                            axisBottom={{ tickSize: 0, tickPadding: 8 }}
                            axisLeft={{ tickSize: 0, tickPadding: 8 }}
                            labelSkipHeight={12}
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
                                    <p className="text-[#57606a] mb-0.5">{data.bucket as string}</p>
                                    <p className="font-semibold text-[#24292f]">{value} alumnos</p>
                                </div>
                            )}
                        />
                    </div>
                ) : (
                    <EmptyState label="Sin datos de progreso" />
                )
            ) : data.length > 0 ? (
                <div className="overflow-y-auto max-h-56 space-y-1.5">
                    {data.map(s => {
                        const color =
                            s.progress >= 80 ? PROGRESS_COLORS.green :
                                s.progress >= 40 ? PROGRESS_COLORS.blue : PROGRESS_COLORS.red;
                        return (
                            <div key={s.userId} className="flex items-center gap-2">
                                <span className="text-xs text-[#57606a] w-36 truncate font-mono">
                                    {s.lastName}, {s.firstName}
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
            ) : (
                <EmptyState label="Sin alumnos habilitados" />
            )}
        </div>
    );
}
