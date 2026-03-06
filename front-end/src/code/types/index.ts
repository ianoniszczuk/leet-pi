// Code submission response types
export interface SubmissionResponse {
    submissionId: string;
    overallStatus: 'approved' | 'failed' | 'compilation_error' | 'pending';
    message: string;
    score: number;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    compilationError?: string | null;
    testResults: TestResult[];
    executionTime: string | null;
    memoryUsage: string | null;
    timestamp: string;
}

export interface TestResult {
    testNumber: number;
    passed: boolean;
    executionTime?: string;
    error?: string | null;
}

// Form Types
export interface SubmissionForm {
    exerciseNumber: number;
    guideNumber: number;
    code: string;
}

// Ranking Types
export interface RankingFewestEntry {
    rank: number;
    fullName: string;
    attempts: number;
}

export interface RankingEarliestEntry {
    rank: number;
    fullName: string;
    submittedAt: string;
    marginMs: number;
}

export interface ExerciseRankingsData {
    hasDeadline: boolean;
    fewestAttempts: RankingFewestEntry[];
    earliestCompletion: RankingEarliestEntry[];
}
