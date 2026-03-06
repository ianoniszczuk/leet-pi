import type { User } from '@/shared/types';

export interface UserProfile extends User {
    totalSubmissions?: number;
    successfulSubmissions?: number;
    successRate?: number;
}
