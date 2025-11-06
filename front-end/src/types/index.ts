// Auth0 Types
export interface Auth0User {
  sub: string;
  email: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  picture?: string;
  [key: string]: any;
}

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
  firstName: string;
  lastName: string;
  enabled?: boolean;
  roles?: string[];
  submissions?: Submission[];
}

export interface UserProfile extends User {
  totalSubmissions?: number;
  successfulSubmissions?: number;
  successRate?: number;
}

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

// Exercise Types
export interface Exercise {
  guideNumber: number;
  exerciseNumber: number;
  enabled: boolean;
  submissions?: Submission[];
}

export interface Guide {
  guideNumber: number;
  enabled: boolean;
  exercises?: Exercise[];
}

// Form Types
export interface SubmissionForm {
  exerciseNumber: number;
  guideNumber: number;
  code: string;
}

// Available Exercises Types
export interface AvailableExercise {
  exerciseNumber: number;
  enabled: boolean;
}

export interface GuideWithExercises {
  guideNumber: number;
  enabled: boolean;
  exercises: AvailableExercise[];
}

// Component Props Types
export interface ProtectedRouteProps {
  children: React.ReactNode;
}

export interface AuthButtonProps {
  className?: string;
}

// Admin Types
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
