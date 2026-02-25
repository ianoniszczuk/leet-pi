# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (hot-reload via nodemon + tsx)
npm run dev

# Database migrations
npm run migrations:generate -- src/migrations/<MigrationName>  # generate from entity diff
npm run migrations:run       # apply pending migrations
npm run migrations:revert    # revert last migration

# Admin management
npm run seed-admins          # seed admins from scripts/data/admins.csv
npm run seed-admins -- --file /path/to/other.csv
npm run make-admin -- email@example.com

# Code quality
npm run lint
npm run format
```

The server listens on `PORT` (default 3001 in Docker). OpenAPI docs are at `/api/docs`.

## Architecture

**Stack**: Express + TypeScript (ESM modules), TypeORM, PostgreSQL, Auth0, internal JWT.

**Layer flow**: `routes/` → `controllers/` → `services/` → `persistence/` (DAO) → `entities/`

**Startup sequence** (`src/index.ts`): connect DB → run pending migrations → seed admins → start listening.

### Path Aliases

`@/` maps to `src/`. All imports explicitly include the `.ts` extension (required by `moduleResolution: nodenext`).

### Dual Authentication System

Two auth middlewares coexist:

| Middleware | Token type | Header | Used by |
|---|---|---|---|
| `authenticateAuth0` | Auth0 JWT (RS256) | `Authorization: Bearer` | `POST /api/auth/login` |
| `authenticateAuth` | Internal JWT (HS256) | `X-Auth-Token` / `X-Refresh-Token` | All other protected routes |

The login flow (`POST /api/auth/login`) verifies the Auth0 token, upserts the user in the DB, and issues internal access + refresh tokens. Subsequent requests use the internal tokens only.

`requireAdmin` (in `src/middleware/adminAuth.ts`) wraps `authenticateAuth` and additionally checks the `user_roles` table for `roleId = 'admin'`.

### Migrations

New migration classes must be **manually imported and added** to the `migrations` array in `src/database/data-source.ts`. TypeORM does not auto-discover them. Use `tsconfig.migrations.json` (which is separate from the main tsconfig) for the migration CLI commands.

### Key Singletons

DAOs and services are exported as singleton instances (e.g., `export default new UserDAO()`). Import them directly without instantiating.

### Response Format

All responses use helpers from `src/utils/responseFormatter.ts` to produce consistent `{ success, data }` or `{ success, error: { message, statusCode } }` shapes.

### Admin Seed

`scripts/data/admins.csv` defines initial admin users. The seed is **idempotent**: it creates users if missing (with `sub: null`, filled at first Auth0 login), enables them, and assigns the admin role. It runs automatically on every server start.

### Code Judge

`src/services/codeJudgeService.ts` communicates synchronously with the external judge via `POST /evaluate`. The judge URL is `CODE_JUDGE_URL` (default `http://localhost:5000`). Only C language is supported.

### Environment Variables

Required variables beyond the defaults: `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `AUTH0_ISSUER`, `AUTH0_JWKS_URI`, `API_JWT_SECRET`, `API_REFRESH_SECRET`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`. Copy `.env-example` to get started.
