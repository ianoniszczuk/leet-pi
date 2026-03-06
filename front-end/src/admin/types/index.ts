// Admin Types
export interface AdminUser {
    id: string;
    email: string;
    fullName: string | null;
    enabled: boolean;
    roles: string[];
}

export interface PaginatedAdminUsersResponse {
    users: AdminUser[];
    total: number;
    page: number;
    totalPages: number;
}

export interface UserStatus {
    total: number;
    enabled: number;
    disabled: number;
}

export interface CSVUploadResult {
    enabled: number;
    disabled: number;
    created: number;
    totalProcessed: number;
    errors?: string[];
}

export interface AdminExercise {
    guideNumber: number;
    exerciseNumber: number;
    enabled: boolean;
    functionSignature?: string | null;
    hasTestFile?: boolean;
}

export interface AdminGuide {
    guideNumber: number;
    enabled: boolean;
    deadline: string | null;
    exercises: AdminExercise[];
}

export interface UserDetailExercise {
    exerciseNumber: number;
    enabled: boolean;
    attempted: boolean;
    solved: boolean;
}

export interface UserDetailGuide {
    guideNumber: number;
    enabled: boolean;
    exercises: UserDetailExercise[];
}

export interface UserDetailData {
    id: string;
    fullName: string | null;
    email: string;
    lastSubmissionAt: string | null;
    guides: UserDetailGuide[];
}

// ── Metrics Types ─────────────────────────────────────────────────────────────

export interface StudentProgressMetric {
    userId: string;
    fullName: string | null;
    totalExercises: number;
    solved: number;
    /** 0–100 */
    progress: number;
}

export interface AvgResolutionTimeMetric {
    avgMinutes: number | null;
}

export interface ExerciseAttemptsMetric {
    guideNumber: number;
    exerciseNumber: number;
    avgAttempts: number;
}

export interface ActiveStudentsMetric {
    count: number;
}

export interface ExerciseErrorRateMetric {
    guideNumber: number;
    exerciseNumber: number;
    /** 0–1 */
    errorRate: number;
    totalAttempts: number;
}

export interface StudentAtRiskMetric {
    userId: string;
    fullName: string | null;
    lastSubmissionAt: string | null;
}

export interface ProgressDistributionMetric {
    bucket: string;
    count: number;
}

export interface WeeklyActivityMetric {
    week: string;
    count: number;
}

export interface ExerciseCompletionMatrixMetric {
    guideNumber: number;
    exerciseNumber: number;
    /** 0–1 fraction of enabled students who solved */
    completionRate: number;
    /** 0–1 fraction of enabled students who attempted */
    attemptedRate: number;
    totalStudents: number;
}
