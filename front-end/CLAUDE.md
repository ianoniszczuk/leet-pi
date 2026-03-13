# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on port 3000
npm run build        # Type-check + build for production (outputs to dist/)
npm run lint         # ESLint with zero warnings allowed
npm run type-check   # TypeScript check without emitting files
npm run preview      # Preview production build locally
```

## Environment Variables

Copy `.env.example` to `.env` and set:

```
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=your-api-identifier
VITE_AUTH0_REDIRECT_URI=http://localhost:3000/callback
VITE_API_BASE_URL=http://localhost:3000/api
```

## Architecture

### Tech Stack
- React 18 + TypeScript, Vite bundler, Tailwind CSS
- Auth0 for authentication (`@auth0/auth0-react`)
- Axios for API communication, React Router v6
- Monaco Editor for C code editing

### Feature-Based Directory Structure

The codebase is organized by feature domain under `src/`:

```
src/
├── App.tsx / main.tsx / index.css        # Root files
├── admin/                                # Admin panel feature
│   ├── components/                       # Admin tabs, modals, dashboard charts
│   │   ├── AdminTabBar.tsx               # [NEW] Tab bar component (extracted from Admin.tsx)
│   │   └── ...
│   ├── hooks/                            # useAdmin, useAcademicMetrics
│   ├── pages/                            # Admin page
│   └── types/                            # Admin-specific types (AdminUser, metrics, etc.)
├── auth/                                 # Authentication feature
│   ├── components/                       # AdminRoute, AuthButton, ProtectedRoute
│   ├── config/                           # Auth0 provider config
│   ├── hooks/                            # useAuth
│   ├── pages/                            # Login callback, Landing page
│   └── types/                            # Auth0User, ProtectedRouteProps
├── profile/                              # User profile feature
│   ├── components/                       # EditProfileModal + sub-components:
│   │   ├── UserInfoCard.tsx              # [NEW] Avatar, name, email, edit button
│   │   ├── ExerciseStatsCard.tsx         # [NEW] Per-exercise success rate with progress bars
│   │   ├── OverallStatsCard.tsx          # [NEW] Total/successful/failed counts + rate bar
│   │   ├── RecentSubmissionsCard.tsx     # [NEW] Last N submissions with status icon
│   │   └── QuickActionsCard.tsx          # [NEW] CTA buttons (Enviar / Ver envíos)
│   ├── pages/                            # UserProfile page
│   └── types/                            # UserProfile (extends User)
├── submissions/                          # Submission history feature
│   ├── components/                       # [NEW] Submission sub-components:
│   │   ├── SubmissionSummaryStats.tsx    # [NEW] 3 stat cards (total, exitosos, tasa)
│   │   ├── SubmissionsList.tsx           # [NEW] Scrollable list of submission rows
│   │   └── SubmissionDetailModal.tsx     # [NEW] Modal showing selected submission code
│   ├── pages/                            # MySubmissions page
│   └── types/                            # Submission type
├── code/                                 # Code editor & evaluation feature
│   ├── components/                       # ResultsPanel, ExerciseRankings + [NEW]:
│   │   ├── CodeEditor.tsx                # Monaco editor with header & submit/reset actions
│   │   └── ExerciseSelector.tsx          # Guide & exercise dropdowns panel
│   ├── pages/                            # SubmitCode page
│   └── types/                            # SubmissionResponse, TestResult, ranking types
└── shared/                               # Cross-feature shared code
    ├── components/                       # Header, LoadingSpinner, SessionExpiredModal + [NEW]:
    │   ├── PageHeader.tsx                # [NEW] h1 + optional subtitle reusable header
    │   ├── StatCard.tsx                  # [NEW] Icon + label + value stat card
    │   ├── StatusBadge.tsx               # [NEW] Exitoso/Fallido pill badge
    │   ├── ConfirmDeleteModal.tsx        # [NEW] Generic delete confirmation modal
    │   └── ErrorBanner.tsx              # [NEW] Red error banner with optional dismiss
    ├── config/                           # API config, cache config
    ├── hooks/                            # useApi, useCachedApi
    ├── services/                         # ApiService (singleton), CacheService
    ├── types/                            # ApiResponse, User, Exercise, Guide, etc.
    └── utils/                            # Logger
```

### Application Flow

`main.tsx` wraps the app in `BrowserRouter` → `Auth0ProviderWrapper` → `App`. The `App` component handles routing with `Header` shown on all pages except the unauthenticated landing.

### Authentication Architecture (Two-Layer)

The app uses a **dual-token system** on top of Auth0:
1. Auth0 handles SSO/identity — `useAuth` hook wraps `useAuth0` for login/logout
2. Custom backend tokens (`X-Auth-Token` / `X-Refresh-Token`) stored in `localStorage` are sent with every request via Axios interceptors in `ApiService`
3. On 401, tokens are cleared from localStorage (but no auto-redirect)
4. Admin role is checked via `user_data` key in localStorage (populated at login) with a fallback to `/users/me` API call

### Data Layer

All API calls go through the singleton `apiService` (`src/shared/services/api.ts`). API endpoints are defined in `src/shared/config/api.ts`.

For read-heavy data, use the cached hooks (`src/shared/hooks/useCachedApi.ts`) which implement a cache-first strategy backed by `cacheService` with TTL-based invalidation:
- Available exercises: 30 min TTL
- User profile: 10 min TTL
- My submissions: 2 min TTL

Cache is invalidated automatically after successful code submissions.

Use `useApi` (`src/shared/hooks/useApi.ts`) for non-cached, simpler API interactions.

### Path Alias

`@/` maps to `src/` (configured in `vite.config.ts`).

### Tailwind Custom Tokens

Custom color scales defined in `tailwind.config.js`: `primary` (blue), `success` (green), `danger` (red). Custom font: `font-mono` uses JetBrains Mono.

### Routes

| Path | Component | Auth required |
|------|-----------|---------------|
| `/` | `Landing` | No (header only if authenticated) |
| `/callback` | `Callback` | No |
| `/submit` | `SubmitCode` | Yes (redirects via `useAuth`) |
| `/submissions` | `MySubmissions` | Yes |
| `/profile` | `UserProfile` | Yes |
| `/admin` | `Admin` | Yes + `AdminRoute` guard |

### Key Types

Types are split across feature modules:
- **`shared/types`**: `ApiResponse<T>`, `User`, `Exercise`, `Guide`, `GuideWithExercises`
- **`admin/types`**: `AdminUser`, `AdminGuide`, metrics types (StudentProgressMetric, etc.)
- **`auth/types`**: `Auth0User`, `ProtectedRouteProps`, `AuthButtonProps`
- **`profile/types`**: `UserProfile` (extends `User`)
- **`submissions/types`**: `Submission`
- **`code/types`**: `SubmissionResponse`, `TestResult`, `SubmissionForm`, ranking types
