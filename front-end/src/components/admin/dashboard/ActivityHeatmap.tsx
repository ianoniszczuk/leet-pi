import { ResponsiveCalendar } from '@nivo/calendar';
import type { WeeklyActivityMetric } from '@/types';
import { EmptyState } from './EmptyState';

interface ActivityHeatmapProps {
    data: WeeklyActivityMetric[];
}

/**
 * GitHub-style contribution heatmap using @nivo/calendar.
 * Maps weekly activity data to daily calendar entries (one per week start).
 */
export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
    if (data.length === 0) return <EmptyState label="Sin actividad registrada" />;

    // Convert week labels into calendar data. Each week value is a date string (YYYY-MM-DD).
    const calendarData = data.map(d => ({
        day: d.week,
        value: d.count,
    }));

    // Determine year range from data
    const years = calendarData.map(d => new Date(d.day).getFullYear());
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const from = `${minYear}-01-01`;
    const to = `${maxYear}-12-31`;

    // Find max value for legend
    const maxVal = Math.max(...calendarData.map(d => d.value), 1);

    return (
        <div className="bg-white rounded-md border border-[#d0d7de] p-4">
            <h3 className="text-xs font-semibold text-[#57606a] uppercase tracking-widest mb-4">
                Actividad de envíos
            </h3>
            <div className="h-[160px]">
                <ResponsiveCalendar
                    data={calendarData}
                    from={from}
                    to={to}
                    emptyColor="#ebedf0"
                    colors={['#9be9a8', '#40c463', '#30a14e', '#216e39']}
                    minValue={0}
                    maxValue={maxVal}
                    margin={{ top: 8, right: 16, bottom: 0, left: 24 }}
                    yearSpacing={40}
                    monthBorderWidth={0}
                    monthLegendPosition="before"
                    monthLegendOffset={10}
                    dayBorderWidth={2}
                    dayBorderColor="#ffffff"
                    daySpacing={0}
                    tooltip={({ day, value }) => (
                        <div className="bg-[#24292f] text-white text-[10px] rounded px-2 py-1 font-mono whitespace-nowrap">
                            {day}: {value ?? 0} envíos
                        </div>
                    )}
                    theme={{
                        labels: {
                            text: {
                                fontSize: 10,
                                fill: '#57606a',
                                fontFamily: 'JetBrains Mono, monospace',
                            },
                        },
                    }}
                />
            </div>
            {/* Legend */}
            <div className="flex items-center justify-end gap-1.5 mt-2 text-[10px] text-[#57606a]">
                <span>Menos</span>
                {['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'].map((c, i) => (
                    <div key={i} className="w-[10px] h-[10px] rounded-sm" style={{ backgroundColor: c }} />
                ))}
                <span>Más</span>
            </div>
        </div>
    );
}
