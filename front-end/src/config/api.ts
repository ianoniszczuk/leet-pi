export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
};

const authEndpoints = {
  login: '/auth/login',
};

const userEndpoints = {
  me: '/users/me',
  profile: '/users/profile',
  updateMe: '/users/me',
  all: '/users',
  byId: (id: string) => `/users/${id}`,
  delete: (id: string) => `/users/${id}`,
};

const submissionEndpoints = {
  submit: '/submissions',
  my: '/submissions/my',
  byId: (id: string) => `/submissions/${id}`,
  status: (id: string) => `/submissions/${id}/status`,
  availableExercises: '/submissions/exercises/available',
  rankings: (g: number, e: number) => `/submissions/rankings?guideNumber=${g}&exerciseNumber=${e}`,
};

const adminEndpoints = {
  uploadCSV: '/admin/users/upload-csv',
  userStatus: '/admin/users/status',
  users: '/admin/users',
  userEnabled: (id: string) => `/admin/users/${id}/enabled`,
  userRoles: (id: string) => `/admin/users/${id}/roles`,
  userDetails: (id: string) => `/admin/users/${id}/details`,
  guide: (n?: number) => (n !== undefined ? `/admin/guides/${n}` : '/admin/guides'),
  exercise: (g: number, e?: number) => (e !== undefined ? `/admin/guides/${g}/exercises/${e}` : `/admin/guides/${g}/exercises`),
  exerciseTestFile: (g: number, e: number) => `/admin/guides/${g}/exercises/${e}/test-file`,
  metrics: {
    progress: '/admin/metrics/progress',
    resolutionTime: '/admin/metrics/resolution-time',
    attempts: '/admin/metrics/attempts',
    activeStudents: '/admin/metrics/active-students',
    errorRate: '/admin/metrics/error-rate',
    atRisk: '/admin/metrics/at-risk',
    progressDistribution: '/admin/metrics/progress-distribution',
    weeklyActivity: '/admin/metrics/weekly-activity',
    completionMatrix: '/admin/metrics/completion-matrix',
  },
};

export const API_ENDPOINTS = {
  health: '/health',
  auth: authEndpoints,
  users: userEndpoints,
  submissions: submissionEndpoints,
  admin: adminEndpoints,
} as const;
