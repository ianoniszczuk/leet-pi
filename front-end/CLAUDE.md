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

### Application Flow

`main.tsx` wraps the app in `BrowserRouter` → `Auth0ProviderWrapper` → `App`. The `App` component handles routing with `Header` shown on all pages except the unauthenticated landing.

### Authentication Architecture (Two-Layer)

The app uses a **dual-token system** on top of Auth0:
1. Auth0 handles SSO/identity — `useAuth` hook wraps `useAuth0` for login/logout
2. Custom backend tokens (`X-Auth-Token` / `X-Refresh-Token`) stored in `localStorage` are sent with every request via Axios interceptors in `ApiService`
3. On 401, tokens are cleared from localStorage (but no auto-redirect)
4. Admin role is checked via `user_data` key in localStorage (populated at login) with a fallback to `/users/me` API call

### Data Layer

All API calls go through the singleton `apiService` (`src/services/api.ts`). API endpoints are defined in `src/config/api.ts`.

For read-heavy data, use the cached hooks (`src/hooks/useCachedApi.ts`) which implement a cache-first strategy backed by `cacheService` with TTL-based invalidation:
- Available exercises: 30 min TTL
- User profile: 10 min TTL
- My submissions: 2 min TTL

Cache is invalidated automatically after successful code submissions.

Use `useApi` (`src/hooks/useApi.ts`) for non-cached, simpler API interactions.

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

### Key Types (`src/types/index.ts`)

- `SubmissionResponse` — result from code evaluation: `overallStatus`, `score`, `testResults[]`
- `GuideWithExercises` — structure for selecting guide/exercise in submission form
- `ApiResponse<T>` — standard backend envelope `{ success, data?, error? }`
