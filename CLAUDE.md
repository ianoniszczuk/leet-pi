# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Full-stack MVP for evaluating C programming exercises. Students submit C code via a web UI; the back-end routes it to a Python/GCC judge that compiles and runs it against pre-written test harnesses.

## Services

| Service | Stack | Port | CLAUDE.md |
|---|---|---|---|
| `back-end/` | Express + TypeScript + TypeORM + PostgreSQL | 3001 | [back-end/CLAUDE.md](back-end/CLAUDE.md) |
| `front-end/` | React 18 + TypeScript + Vite + Tailwind | 3000 | [front-end/CLAUDE.md](front-end/CLAUDE.md) |
| `juez-codigo/` | FastAPI + Python + GCC | 5000 | [juez-codigo/CLAUDE.md](juez-codigo/CLAUDE.md) |

## Running the Full Stack

All orchestration goes through Docker Compose via the Makefile:

```bash
make up           # Start all services in background
make up-live      # Start with logs attached
make up-build     # Rebuild images then start
make down         # Stop and remove containers
make logs         # Tail logs from all services
make ps           # Show service status
make clean        # Remove containers, networks, and volumes (destructive)
```

Startup order enforced by health checks: `code-judge` → `db` → `back-end`.

After `make up`:
- API: http://localhost:3001
- Swagger docs: http://localhost:3001/api/docs
- Code judge: http://localhost:5000
- Front-end dev server: run separately with `npm run dev` inside `front-end/`

## Environment Setup

Copy `.env-example` to `.env` inside `back-end/`. `DB_HOST` and `CODE_JUDGE_URL` are overridden automatically by Docker Compose, so they only matter for local (non-Docker) development.

## Cross-Service Architecture

```
Browser → Front-End (Vite dev server)
              ↓ REST (X-Auth-Token)
         Back-End API (Express)
              ↓ Auth0 JWKS (RS256 verify, login only)
              ↓ PostgreSQL (TypeORM, guides/exercises/submissions/users)
              ↓ POST /evaluate (synchronous, internal network)
         Code Judge (FastAPI)
              ↓ gcc compile: student.c + tests/guide-N/exercise-N.c
              ↓ execute binary, assert-based pass/fail
```

Key design decisions:
- **Dual auth**: Auth0 JWT is only used at `POST /api/auth/login`. All subsequent requests use internal HS256 JWTs (`X-Auth-Token` / `X-Refresh-Token`).
- **Judge model**: The judge does NOT use stdin/stdout. It compiles student code together with a pre-written C test harness and checks the exit code.
- **Test harnesses**: Live at `juez-codigo/tests/guide-{N}/exercise-{N}.c`. Adding a new exercise requires adding a harness file here AND creating the exercise via `POST /api/admin/guides/:guideNumber/exercises`.

## Adding New Exercises

1. Add test harness: `juez-codigo/tests/guide-{N}/exercise-{N}.c`
2. Create via API: `POST /api/admin/guides/:guideNumber/exercises` `{"exerciseNumber": N}`
3. Enable via API: `PATCH /api/admin/guides/:guideNumber/exercises/:exerciseNumber` `{"enabled": true}`
4. Ensure parent guide exists and is enabled (`POST /api/admin/guides` + PATCH if needed)

## OpenAPI Spec

`docs/openapi.yaml` is the single source of truth for the API contract. The back-end serves it at `/api/docs`. Edit this file to update Swagger documentation.
