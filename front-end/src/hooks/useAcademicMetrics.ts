import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api';
import type {
    StudentProgressMetric,
    AvgResolutionTimeMetric,
    ExerciseAttemptsMetric,
    ActiveStudentsMetric,
    ExerciseErrorRateMetric,
    StudentAtRiskMetric,
    WeeklyActivityMetric,
    ExerciseCompletionMatrixMetric,
} from '@/types';

export interface AcademicMetricsData {
    progress: StudentProgressMetric[] | null;
    resolutionTime: AvgResolutionTimeMetric | null;
    attempts: ExerciseAttemptsMetric[] | null;
    activeStudents: ActiveStudentsMetric | null;
    errorRate: ExerciseErrorRateMetric[] | null;
    atRisk: StudentAtRiskMetric[] | null;
    weeklyActivity: WeeklyActivityMetric[] | null;
    completionMatrix: ExerciseCompletionMatrixMetric[] | null;
}

export interface UseAcademicMetricsResult {
    data: AcademicMetricsData;
    loading: boolean;
    error: string | null;
    reload: () => void;
}

const EMPTY: AcademicMetricsData = {
    progress: null,
    resolutionTime: null,
    attempts: null,
    activeStudents: null,
    errorRate: null,
    atRisk: null,
    weeklyActivity: null,
    completionMatrix: null,
};

export function useAcademicMetrics(): UseAcademicMetricsResult {
    const [data, setData] = useState<AcademicMetricsData>(EMPTY);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [prog, rt, att, act, err, risk, weekly, matrix] = await Promise.all([
                apiService.getMetricsProgress(),
                apiService.getMetricsResolutionTime(),
                apiService.getMetricsAttempts(),
                apiService.getMetricsActiveStudents(),
                apiService.getMetricsErrorRate(),
                apiService.getMetricsAtRisk(),
                apiService.getMetricsWeeklyActivity(),
                apiService.getMetricsCompletionMatrix(),
            ]);

            setData({
                progress: prog.success && prog.data ? prog.data : null,
                resolutionTime: rt.success && rt.data ? rt.data : null,
                attempts: att.success && att.data ? att.data : null,
                activeStudents: act.success && act.data ? act.data : null,
                errorRate: err.success && err.data ? err.data : null,
                atRisk: risk.success && risk.data ? risk.data : null,
                weeklyActivity: weekly.success && weekly.data ? weekly.data : null,
                completionMatrix: matrix.success && matrix.data ? matrix.data : null,
            });
        } catch {
            setError('Error al cargar las métricas');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return { data, loading, error, reload: load };
}
