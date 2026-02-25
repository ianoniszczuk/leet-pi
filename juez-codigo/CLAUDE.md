# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Run dev server (port 5000, with auto-reload)
uvicorn main:app --host 0.0.0.0 --port 5000 --reload

# Docker build (dev target)
docker build --target dev -t code-judge:dev .

# Docker build (prod target)
docker build --target prod -t code-judge:latest .

# Manual API test
curl http://localhost:5000/health
curl -X POST http://localhost:5000/evaluate \
  -H "Content-Type: application/json" \
  -d '{"submissionId":"test-1","guideNumber":1,"exerciseNumber":1,"code":"int multiplyByTwo(int x){return x*2;}","language":"c","timeout":5000,"memoryLimit":256,"timestamp":"2024-01-01T00:00:00Z"}'
```

There is no test runner configured. Manual `curl` or the Docker run commands in the README are used for integration testing.

## Architecture

### How Evaluation Works

The service uses a **test harness compilation model** — not stdin/stdout comparison. Each exercise has a C test harness file (e.g., `tests/guide-1/exercise-1.c`) that contains a `main()` function with `assert`-based calls to functions the student must implement.

Evaluation flow in `services/code_executor.py`:
1. Student's code is written to `/tmp/submissions/<submissionId>.c`
2. The exercise test harness (e.g., `tests/guide-1/exercise-1.c`) is located via path resolution
3. Both files are compiled together: `gcc -std=c99 -Wall -Wextra <student.c> <harness.c> -lm -o <exe>`
4. The resulting binary is executed once; exit code `0` = all tests passed, non-zero = failure
5. Temp files are cleaned up in the `finally` block regardless of outcome

This means student code must **define the functions declared in the test harness**, not implement a `main()`.

### Test Harness Format

Test harnesses live at `tests/guide-{N}/exercise-{N}.c`. Each file:
- Declares the function(s) the student must implement
- Defines `main()` with assertions
- Prints `"All tests passed!\n"` and returns 0 on success

To add a new exercise, create `tests/guide-{N}/exercise-{N}.c` following this pattern.

### Path Resolution

The service searches for test harnesses in order:
1. `$TESTS_BASE_PATH` (env var)
2. `/tests` (Docker volume mount)
3. `./tests/` (local dev fallback)

Temporary compilation artifacts always go to `/tmp/submissions/`.

### Stack

- **FastAPI** + **Uvicorn** (Python 3.10)
- **Pydantic v2** for request/response validation (`models/schemas.py`)
- **gcc** (`-std=c99`) for compilation — must be present in the environment
- Only `language: "c"` is accepted; other values return HTTP 400

### Dockerfile Stages

- `deps` — base with gcc and pip packages
- `dev` — mounts source as volume, runs with `--reload`
- `prod` — non-root `app` user, no volume mounts, copies source into image
