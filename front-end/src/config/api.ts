export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const API_ENDPOINTS = {
  // Health
  health: '/health',

  // Auth
  auth: {
    login: '/auth/login',
  },
  
  // Users
  users: {
    me: '/users/me',
    profile: '/users/profile',
    all: '/users',
    byId: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
  },
  
  // Submissions
  submissions: {
    submit: '/submissions',
    my: '/submissions/my',
    byId: (id: string) => `/submissions/${id}`,
    status: (id: string) => `/submissions/${id}/status`,
    availableExercises: '/submissions/exercises/available',
  },
} as const;
