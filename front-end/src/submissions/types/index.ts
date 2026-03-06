import type { User, Exercise } from '@/shared/types';

// Submission Types
export interface Submission {
    userId: string;
    guideNumber: number;
    exerciseNumber: number;
    createdAt: string;
    code: string;
    success: boolean;
    user?: User;
    exercise?: Exercise;
}
