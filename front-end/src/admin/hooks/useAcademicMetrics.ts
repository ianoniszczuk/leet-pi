import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/shared/services/api';
import { cacheService } from '@/shared/services/cacheService';
import { CACHE_KEYS, CACHE_CONFIG } from '@/shared/config/cache';
import type {
    StudentProgressMetric,
    AvgResolutionTimeMetric,
    ExerciseAttemptsMetric,
    ActiveStudentsMetric,
    ExerciseErrorRateMetric,
    StudentAtRiskMetric,
    WeeklyActivityMetric,
    ExerciseCompletionMatrixMetric,
} from '@/admin/types';

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

const METRIC_KEYS = [
    CACHE_KEYS.metricsProgress,
    CACHE_KEYS.metricsResolutionTime,
    CACHE_KEYS.metricsAttempts,
    CACHE_KEYS.metricsActiveStudents,
    CACHE_KEYS.metricsErrorRate,
    CACHE_KEYS.metricsAtRisk,
    CACHE_KEYS.metricsWeeklyActivity,
    CACHE_KEYS.metricsCompletionMatrix,
] as const;

function tryLoadFromCache(): AcademicMetricsData | null {
    const progress = cacheService.get<StudentProgressMetric[]>(CACHE_KEYS.metricsProgress);
    const resolutionTime = cacheService.get<AvgResolutionTimeMetric>(CACHE_KEYS.metricsResolutionTime);
    const attempts = cacheService.get<ExerciseAttemptsMetric[]>(CACHE_KEYS.metricsAttempts);
    const activeStudents = cacheService.get<ActiveStudentsMetric>(CACHE_KEYS.metricsActiveStudents);
    const errorRate = cacheService.get<ExerciseErrorRateMetric[]>(CACHE_KEYS.metricsErrorRate);
    const atRisk = cacheService.get<StudentAtRiskMetric[]>(CACHE_KEYS.metricsAtRisk);
    const weeklyActivity = cacheService.get<WeeklyActivityMetric[]>(CACHE_KEYS.metricsWeeklyActivity);
    const completionMatrix = cacheService.get<ExerciseCompletionMatrixMetric[]>(CACHE_KEYS.metricsCompletionMatrix);

    if (progress && resolutionTime && attempts && activeStudents && errorRate && atRisk && weeklyActivity && completionMatrix) {
        return { progress, resolutionTime, attempts, activeStudents, errorRate, atRisk, weeklyActivity, completionMatrix };
    }
    return null;
}

export function useAcademicMetrics(): UseAcademicMetricsResult {
    const [data, setData] = useState<AcademicMetricsData>(EMPTY);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);

        const cached = tryLoadFromCache();
        if (cached) {
            setData(cached);
            setLoading(false);
            return;
        }

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

            const ttl = CACHE_CONFIG.metrics;
            const result: AcademicMetricsData = {
                progress: prog.success && prog.data ? prog.data : null,
                resolutionTime: rt.success && rt.data ? rt.data : null,
                attempts: att.success && att.data ? att.data : null,
                activeStudents: act.success && act.data ? act.data : null,
                errorRate: err.success && err.data ? err.data : null,
                atRisk: risk.success && risk.data ? risk.data : null,
                weeklyActivity: weekly.success && weekly.data ? weekly.data : null,
                completionMatrix: matrix.success && matrix.data ? matrix.data : null,
            };

            // Guardar cada métrica en caché individualmente
            if (result.progress) cacheService.set(CACHE_KEYS.metricsProgress, result.progress, ttl);
            if (result.resolutionTime) cacheService.set(CACHE_KEYS.metricsResolutionTime, result.resolutionTime, ttl);
            if (result.attempts) cacheService.set(CACHE_KEYS.metricsAttempts, result.attempts, ttl);
            if (result.activeStudents) cacheService.set(CACHE_KEYS.metricsActiveStudents, result.activeStudents, ttl);
            if (result.errorRate) cacheService.set(CACHE_KEYS.metricsErrorRate, result.errorRate, ttl);
            if (result.atRisk) cacheService.set(CACHE_KEYS.metricsAtRisk, result.atRisk, ttl);
            if (result.weeklyActivity) cacheService.set(CACHE_KEYS.metricsWeeklyActivity, result.weeklyActivity, ttl);
            if (result.completionMatrix) cacheService.set(CACHE_KEYS.metricsCompletionMatrix, result.completionMatrix, ttl);

            setData(result);
        } catch {
            setError('Error al cargar las métricas');
        } finally {
            setLoading(false);
        }
    }, []);

    const reload = useCallback(() => {
        // Invalidar todas las claves de métricas antes de refetchear
        METRIC_KEYS.forEach(key => cacheService.invalidate(key));
        load();
    }, [load]);

    useEffect(() => {
        load();
    }, [load]);

    return { data, loading, error, reload };
}

