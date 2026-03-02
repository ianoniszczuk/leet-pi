import AppDataSource from '../database/data-source.ts';

// ── Centralised metric constants ──────────────────────────────────────────────
// Thresholds that define "at risk" and "active" windows.
// Changing them here affects every query automatically.
export const METRICS_CONSTANTS = {
    /** Days without a successful submission before a student is considered "at risk" */
    AT_RISK_DAYS: 14,
    /** Days used to count "active" students */
    ACTIVE_STUDENTS_DAYS: 7,
    /** Number of past weeks included in the weekly-activity evolution chart */
    WEEKLY_EVOLUTION_WEEKS: 8,
    /** Number of exercises returned in the high-error-rate ranking */
    ERROR_RATE_TOP_N: 10,
} as const;

// ── Metric return types ───────────────────────────────────────────────────────

export interface StudentProgressMetric {
    userId: string;
    fullName: string | null;
    /** Total enabled exercises available */
    totalExercises: number;
    /** Exercises solved by this student */
    solved: number;
    /** Progress as a percentage (0–100) */
    progress: number;
}

export interface AvgResolutionTimeMetric {
    /** Average time in minutes from first attempt to first success (null = no data) */
    avgMinutes: number | null;
}

export interface ExerciseAttemptsMetric {
    guideNumber: number;
    exerciseNumber: number;
    /** Average number of submission attempts (of any outcome) per student who attempted */
    avgAttempts: number;
}

export interface ActiveStudentsMetric {
    count: number;
}

export interface ExerciseErrorRateMetric {
    guideNumber: number;
    exerciseNumber: number;
    /** Fraction of failed submissions: failed / total (0–1) */
    errorRate: number;
    totalAttempts: number;
}

export interface StudentAtRiskMetric {
    userId: string;
    fullName: string | null;
    lastSubmissionAt: string | null;
}

export interface ProgressDistributionMetric {
    /** Range label, e.g. "0-20%" */
    bucket: string;
    count: number;
}

export interface WeeklyActivityMetric {
    /** ISO week label, e.g. "2025-W08" */
    week: string;
    count: number;
}

export interface ExerciseCompletionMatrixMetric {
    guideNumber: number;
    exerciseNumber: number;
    /** Fraction of enabled students who solved (0–1) */
    completionRate: number;
    /** Fraction of enabled students who attempted (0–1) */
    attemptedRate: number;
    totalStudents: number;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class MetricsService {
    /**
     * Progress per enabled student (only students with role 'alumno', i.e. no role row).
     * Progress is computed over all *enabled* exercises.
     */
    async getProgressByStudent(): Promise<StudentProgressMetric[]> {
        const rows = await AppDataSource.query<
            { user_id: string; full_name: string | null; solved: string; total_exercises: string }[]
        >(`
      SELECT
        u.id            AS user_id,
        u.full_name,
        COUNT(DISTINCT CASE WHEN t.success THEN t.guide_number || '-' || t.exercise_number END) AS solved,
        (SELECT COUNT(*) FROM exercises e2 WHERE e2.enabled = true)                             AS total_exercises
      FROM users u
      LEFT JOIN tries t ON t.user_id = u.id
      WHERE u.enabled = true
        AND NOT EXISTS (
          SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id
        )
      GROUP BY u.id, u.full_name
      ORDER BY u.full_name ASC
    `);

        return rows.map((r) => {
            const solved = Number(r.solved);
            const total = Number(r.total_exercises);
            return {
                userId: r.user_id,
                fullName: r.full_name ?? null,
                totalExercises: total,
                solved,
                progress: total > 0 ? Math.round((solved / total) * 100) : 0,
            };
        });
    }

    /**
     * Average resolution time in minutes.
     * Computed as time from a student's *first submission* on an exercise
     * to their *first successful submission* on the same exercise.
     * Students who never solved the exercise are excluded.
     */
    async getAvgResolutionTime(): Promise<AvgResolutionTimeMetric> {
        const [row] = await AppDataSource.query<{ avg_minutes: string | null }[]>(`
      WITH first_attempt AS (
        SELECT user_id, guide_number, exercise_number, MIN(created_at) AS first_at
        FROM submissions
        GROUP BY user_id, guide_number, exercise_number
      ),
      first_success AS (
        SELECT user_id, guide_number, exercise_number, MIN(created_at) AS success_at
        FROM submissions
        WHERE success = true
        GROUP BY user_id, guide_number, exercise_number
      )
      SELECT AVG(
        EXTRACT(EPOCH FROM (fs.success_at - fa.first_at)) / 60.0
      ) AS avg_minutes
      FROM first_attempt fa
      JOIN first_success fs
        ON fa.user_id        = fs.user_id
       AND fa.guide_number   = fs.guide_number
       AND fa.exercise_number = fs.exercise_number
      -- Exclude instant first-attempt successes (they skew the avg toward 0)
      WHERE fs.success_at > fa.first_at
    `);

        return {
            avgMinutes: row?.avg_minutes != null ? Math.round(Number(row.avg_minutes)) : null,
        };
    }

    /**
     * Average number of submission attempts per student for each exercise.
     * Only exercises that have been attempted by at least one student are returned.
     */
    async getAvgAttemptsByExercise(): Promise<ExerciseAttemptsMetric[]> {
        const rows = await AppDataSource.query<
            { guide_number: string; exercise_number: string; avg_attempts: string }[]
        >(`
      SELECT
        s.guide_number,
        s.exercise_number,
        CAST(COUNT(*) AS FLOAT) / COUNT(DISTINCT s.user_id) AS avg_attempts
      FROM submissions s
      GROUP BY s.guide_number, s.exercise_number
      ORDER BY s.guide_number ASC, s.exercise_number ASC
    `);

        return rows.map((r) => ({
            guideNumber: Number(r.guide_number),
            exerciseNumber: Number(r.exercise_number),
            avgAttempts: Math.round(Number(r.avg_attempts) * 10) / 10,
        }));
    }

    /**
     * Number of distinct enabled students who submitted in the last N days.
     * N is controlled by METRICS_CONSTANTS.ACTIVE_STUDENTS_DAYS.
     */
    async getActiveStudentsLast7Days(): Promise<ActiveStudentsMetric> {
        const [row] = await AppDataSource.query<{ count: string }[]>(`
      SELECT COUNT(DISTINCT s.user_id) AS count
      FROM submissions s
      JOIN users u ON u.id = s.user_id
      WHERE u.enabled = true
        AND s.created_at >= NOW() - INTERVAL '${METRICS_CONSTANTS.ACTIVE_STUDENTS_DAYS} days'
    `);

        return { count: Number(row?.count ?? 0) };
    }

    /**
     * Exercises ranked by error rate (failed / total submissions), descending.
     * Returns top N as defined by METRICS_CONSTANTS.ERROR_RATE_TOP_N.
     */
    async getExercisesWithHighestErrorRate(): Promise<ExerciseErrorRateMetric[]> {
        const rows = await AppDataSource.query<
            { guide_number: string; exercise_number: string; error_rate: string; total_attempts: string }[]
        >(`
      SELECT
        guide_number,
        exercise_number,
        CAST(SUM(CASE WHEN success = false THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) AS error_rate,
        COUNT(*)                                                                    AS total_attempts
      FROM submissions
      GROUP BY guide_number, exercise_number
      HAVING COUNT(*) > 0
      ORDER BY error_rate DESC
      LIMIT ${METRICS_CONSTANTS.ERROR_RATE_TOP_N}
    `);

        return rows.map((r) => ({
            guideNumber: Number(r.guide_number),
            exerciseNumber: Number(r.exercise_number),
            errorRate: Math.round(Number(r.error_rate) * 1000) / 1000,
            totalAttempts: Number(r.total_attempts),
        }));
    }

    /**
     * Enabled students (alumno role, i.e. no role row) with no successful submission
     * in the last N days, as defined by METRICS_CONSTANTS.AT_RISK_DAYS.
     */
    async getStudentsAtRisk(): Promise<StudentAtRiskMetric[]> {
        const rows = await AppDataSource.query<
            { user_id: string; full_name: string | null; last_submission_at: string | null }[]
        >(`
      SELECT
        u.id                    AS user_id,
        u.full_name,
        MAX(s.created_at)::text AS last_submission_at
      FROM users u
      LEFT JOIN submissions s ON s.user_id = u.id
      WHERE u.enabled = true
        AND NOT EXISTS (
          SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id
        )
        AND NOT EXISTS (
          SELECT 1
          FROM submissions s2
          WHERE s2.user_id = u.id
            AND s2.success = true
            AND s2.created_at >= NOW() - INTERVAL '${METRICS_CONSTANTS.AT_RISK_DAYS} days'
        )
      GROUP BY u.id, u.full_name
      ORDER BY u.full_name ASC
    `);

        return rows.map((r) => ({
            userId: r.user_id,
            fullName: r.full_name ?? null,
            lastSubmissionAt: r.last_submission_at ?? null,
        }));
    }

    /**
     * Distribution of student progress bucketed into 5 ranges of 20 percentage points each.
     * Only enabled students without a role (alumnos) are included.
     */
    async getProgressDistribution(): Promise<ProgressDistributionMetric[]> {
        const rows = await AppDataSource.query<{ bucket: string; count: string }[]>(`
      WITH student_progress AS (
        SELECT
          u.id AS user_id,
          COUNT(DISTINCT CASE WHEN t.success THEN t.guide_number || '-' || t.exercise_number END) AS solved,
          (SELECT COUNT(*) FROM exercises e2 WHERE e2.enabled = true)                             AS total
        FROM users u
        LEFT JOIN tries t ON t.user_id = u.id
        WHERE u.enabled = true
          AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id)
        GROUP BY u.id
      ),
      bucketed AS (
        SELECT
          CASE
            WHEN total = 0 THEN '0-20%'
            WHEN ROUND((solved::FLOAT / total) * 100) <= 20 THEN '0-20%'
            WHEN ROUND((solved::FLOAT / total) * 100) <= 40 THEN '21-40%'
            WHEN ROUND((solved::FLOAT / total) * 100) <= 60 THEN '41-60%'
            WHEN ROUND((solved::FLOAT / total) * 100) <= 80 THEN '61-80%'
            ELSE '81-100%'
          END AS bucket
        FROM student_progress
      )
      SELECT bucket, COUNT(*) AS count
      FROM bucketed
      GROUP BY bucket
      ORDER BY bucket ASC
    `);

        // Ensure all buckets appear even if count is 0
        const BUCKETS = ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'];
        const map = new Map(rows.map((r) => [r.bucket, Number(r.count)]));
        return BUCKETS.map((b) => ({ bucket: b, count: map.get(b) ?? 0 }));
    }

    /**
     * Submission count per ISO week for the last N weeks.
     * N is controlled by METRICS_CONSTANTS.WEEKLY_EVOLUTION_WEEKS.
     */
    async getWeeklyActivityEvolution(): Promise<WeeklyActivityMetric[]> {
        const rows = await AppDataSource.query<{ week: string; count: string }[]>(`
      SELECT
        TO_CHAR(DATE_TRUNC('week', created_at), 'IYYY-"W"IW') AS week,
        COUNT(*)                                                AS count
      FROM submissions
      WHERE created_at >= DATE_TRUNC('week', NOW()) - INTERVAL '${METRICS_CONSTANTS.WEEKLY_EVOLUTION_WEEKS - 1} weeks'
      GROUP BY week
      ORDER BY week ASC
    `);

        return rows.map((r) => ({ week: r.week, count: Number(r.count) }));
    }

    /**
     * Per-exercise completion + attempted rates for the heatmap.
     * Only enabled exercises within enabled guides are included.
     */
    async getExerciseCompletionMatrix(): Promise<ExerciseCompletionMatrixMetric[]> {
        const rows = await AppDataSource.query<{
            guide_number: string;
            exercise_number: string;
            completion_rate: string;
            attempted_rate: string;
            total_students: string;
        }[]>(`
      WITH enabled_students AS (
        SELECT COUNT(*)::FLOAT AS cnt
        FROM users u
        WHERE u.enabled = true
          AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id)
      ),
      agg AS (
        SELECT
          t.guide_number,
          t.exercise_number,
          COUNT(DISTINCT CASE WHEN t.success THEN t.user_id END)::FLOAT AS solved_count,
          COUNT(DISTINCT t.user_id)::FLOAT                              AS attempted_count
        FROM tries t
        JOIN exercises e2 ON e2.guide_number = t.guide_number AND e2.exercise_number = t.exercise_number
        JOIN guides g2    ON g2.guide_number = t.guide_number
        WHERE e2.enabled = true AND g2.enabled = true
        GROUP BY t.guide_number, t.exercise_number
      )
      SELECT
        e.guide_number,
        e.exercise_number,
        COALESCE(a.solved_count,   0) / NULLIF(es.cnt, 0) AS completion_rate,
        COALESCE(a.attempted_count, 0) / NULLIF(es.cnt, 0) AS attempted_rate,
        es.cnt::INT                                         AS total_students
      FROM exercises e
      JOIN guides g ON g.guide_number = e.guide_number
      CROSS JOIN enabled_students es
      LEFT JOIN agg a ON a.guide_number = e.guide_number AND a.exercise_number = e.exercise_number
      WHERE e.enabled = true AND g.enabled = true
      ORDER BY e.guide_number ASC, e.exercise_number ASC
    `);

        return rows.map((r) => ({
            guideNumber: Number(r.guide_number),
            exerciseNumber: Number(r.exercise_number),
            completionRate: Math.round(Number(r.completion_rate ?? 0) * 1000) / 1000,
            attemptedRate: Math.round(Number(r.attempted_rate ?? 0) * 1000) / 1000,
            totalStudents: Number(r.total_students),
        }));
    }
}

export default new MetricsService();
