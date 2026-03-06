// API Response Types
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: {
        message: string;
        statusCode: number;
        timestamp: string;
    };
}

// User Types
export interface User {
    id: string;
    sub: string;
    email: string;
    fullName: string | null;
    enabled?: boolean;
    roles?: string[];
    submissions?: any[];
}

// Exercise Types
export interface Exercise {
    guideNumber: number;
    exerciseNumber: number;
    enabled: boolean;
    submissions?: any[];
}

export interface Guide {
    guideNumber: number;
    enabled: boolean;
    exercises?: Exercise[];
}

// Available Exercises Types
export interface AvailableExercise {
    exerciseNumber: number;
    enabled: boolean;
    functionSignature?: string | null;
}

export interface GuideWithExercises {
    guideNumber: number;
    enabled: boolean;
    exercises: AvailableExercise[];
}
