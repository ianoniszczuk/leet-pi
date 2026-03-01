import { useState, useMemo } from 'react';
import { Activity, Clock, Users, BookOpen, AlertTriangle } from 'lucide-react';
import { useAcademicMetrics } from '@/hooks/useAcademicMetrics';
import { DashboardHeader, type SubView } from './dashboard/DashboardHeader';
import { KpiCard } from './dashboard/KpiCard';
import { BentoGrid } from './dashboard/BentoGrid';
import { SkeletonLoader } from './dashboard/SkeletonLoader';
import { ErrorBlock } from './dashboard/EmptyState';
import { ProgressLineChart } from './dashboard/ProgressLineChart';
import { ProgressOverview } from './dashboard/ProgressOverview';
import { GuideHeatmap } from './dashboard/GuideHeatmap';
import { AttemptsBarChart } from './dashboard/AttemptsBarChart';
import { DifficultyBarChart } from './dashboard/DifficultyBarChart';
import { AtRiskTable } from './dashboard/AtRiskTable';
import type { AcademicMetricsData } from '@/hooks/useAcademicMetrics';

const fmtTime = (m: number | null) =>
    m === null ? '—' : m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;

function CursoView({ data }: { data: AcademicMetricsData }) {
    const totalStudents = data.progress?.length ?? 0;
    const avgProgress =
        totalStudents > 0
            ? Math.round(data.progress!.reduce((a, s) => a + s.progress, 0) / totalStudents)
            : 0;
    const totalExercises =
        data.progress && data.progress.length > 0 ? data.progress[0].totalExercises : 0;
    const atRiskCount = data.atRisk?.length ?? 0;

    return (
        <div className="space-y-3">
            {/* KPIs — single compact row, 6 columns on desktop, 3×2 on mobile */}
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                <KpiCard icon={Users} label="Alumnos" value={totalStudents} />
                <KpiCard icon={BookOpen} label="Ejercicios" value={totalExercises} />
                <KpiCard
                    icon={Activity}
                    label="Progreso prom."
                    value={`${avgProgress}%`}
                    scrollTo="section-progress"
                />
                <KpiCard
                    icon={Clock}
                    label="Tiempo resol."
                    value={fmtTime(data.resolutionTime?.avgMinutes ?? null)}
                    sub="1er intento → éxito"
                    scrollTo="section-weekly"
                />
                <KpiCard
                    icon={Activity}
                    label="Activos (7d)"
                    value={data.activeStudents?.count ?? '—'}
                />
                <KpiCard
                    icon={AlertTriangle}
                    label="En riesgo"
                    value={atRiskCount}
                    sub={atRiskCount === 0 ? 'Todos activos ✓' : 'Sin éxito 14d'}
                    scrollTo="section-atrisk"
                />
            </div>

            {/* Progress distribution (priority) — full width */}
            <ProgressOverview data={data.progress ?? []} id="section-progress" />

            {/* Weekly line chart + At-risk table — side by side */}
            <BentoGrid
                main={<ProgressLineChart data={data.weeklyActivity ?? []} id="section-weekly" />}
                side={<AtRiskTable data={data.atRisk ?? []} id="section-atrisk" />}
            />
        </div>
    );
}

function ProgresoView({ data }: { data: AcademicMetricsData }) {
    const guides = useMemo(() => {
        const set = new Set((data.completionMatrix ?? []).map(c => c.guideNumber));
        return Array.from(set).sort((a, b) => a - b);
    }, [data.completionMatrix]);

    const [selectedGuide, setSelectedGuide] = useState<number | null>(() => guides[0] ?? null);
    const validGuide = selectedGuide != null && guides.includes(selectedGuide) ? selectedGuide : guides[0] ?? null;

    return (
        <div className="space-y-3">
            {/* Global guide selector */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-[#57606a] uppercase tracking-widest">
                    Guía
                </span>
                <div className="flex gap-1 flex-wrap">
                    {guides.map(g => (
                        <button
                            key={g}
                            onClick={() => setSelectedGuide(g)}
                            className={`text-xs px-2.5 py-1 rounded-md border transition-colors font-mono ${validGuide === g
                                    ? 'bg-[#24292f] text-white border-[#24292f]'
                                    : 'border-[#d0d7de] text-[#57606a] hover:border-[#24292f] hover:text-[#24292f]'
                                }`}
                        >
                            G{g}
                        </button>
                    ))}
                </div>
            </div>

            <GuideHeatmap
                cells={data.completionMatrix ?? []}
                selectedGuide={validGuide}
                id="section-heatmap"
            />

            <BentoGrid
                main={
                    <AttemptsBarChart
                        data={data.attempts ?? []}
                        selectedGuide={validGuide}
                        id="section-attempts"
                    />
                }
                side={
                    <DifficultyBarChart
                        data={data.errorRate ?? []}
                        selectedGuide={validGuide}
                        id="section-difficulty"
                    />
                }
            />
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonLoader key={i} variant="kpi" />
                ))}
            </div>
            <SkeletonLoader variant="bar" />
            <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-3">
                <SkeletonLoader variant="line" />
                <SkeletonLoader variant="table" />
            </div>
        </div>
    );
}

export default function ActivityTab() {
    const [activeView, setActiveView] = useState<SubView>('curso');
    const { data, loading, error, reload } = useAcademicMetrics();

    return (
        <div className="space-y-4">
            <DashboardHeader activeView={activeView} onViewChange={setActiveView} />

            {loading ? (
                <DashboardSkeleton />
            ) : error ? (
                <ErrorBlock message={error} onRetry={reload} />
            ) : (
                <>
                    {activeView === 'curso' && <CursoView data={data} />}
                    {activeView === 'progreso' && <ProgresoView data={data} />}
                </>
            )}
        </div>
    );
}
