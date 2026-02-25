# ── Stage 1: dependencias ─────────────────────────────────────────
FROM python:3.10-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc build-essential \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Stage 2: desarrollo (--reload para hot-reload) ────────────────
FROM deps AS dev
RUN mkdir -p /tmp/submissions /tests
# El código fuente se monta como volumen desde compose; no se copia aquí.
EXPOSE 5000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000", "--reload"]

# ── Stage 3: producción (non-root user) ───────────────────────────
FROM python:3.10-slim AS prod
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc build-essential \
    && rm -rf /var/lib/apt/lists/*
COPY --from=deps /usr/local/lib/python3.10 /usr/local/lib/python3.10
COPY --from=deps /usr/local/bin /usr/local/bin
RUN addgroup --system app && adduser --system --ingroup app app
RUN mkdir -p /tmp/submissions /tests && chown app:app /tmp/submissions /tests
COPY --chown=app:app . .
USER app
EXPOSE 5000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]