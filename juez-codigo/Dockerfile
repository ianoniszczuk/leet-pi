# ── Stage 0: compilar nsjail (solo herramientas de build) ─────────
FROM python:3.10-slim AS nsjail-builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    autoconf bison flex gcc g++ git libprotobuf-dev \
    libnl-route-3-dev libtool make pkg-config protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*
RUN git clone --depth 1 --branch 3.4 https://github.com/google/nsjail.git /nsjail-src \
    && cd /nsjail-src && make -j$(nproc) \
    && strip /nsjail-src/nsjail

# ── Stage 1: dependencias Python ──────────────────────────────────
FROM python:3.10-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc build-essential \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Stage 2: desarrollo (--reload para hot-reload) ────────────────
FROM deps AS dev
COPY --from=nsjail-builder /nsjail-src/nsjail /usr/local/bin/nsjail
RUN apt-get update && apt-get install -y --no-install-recommends \
    libprotobuf32t64 libnl-route-3-200 \
    && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /tmp/submissions /tests /jail/tmp /jail/dev
EXPOSE 5000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000", "--reload"]

# ── Stage 3: producción (non-root user) ───────────────────────────
FROM python:3.10-slim AS prod
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc build-essential libprotobuf32t64 libnl-route-3-200 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=nsjail-builder /nsjail-src/nsjail /usr/local/bin/nsjail
COPY --from=deps /usr/local/lib/python3.10 /usr/local/lib/python3.10
COPY --from=deps /usr/local/bin /usr/local/bin
RUN addgroup --system app && adduser --system --ingroup app app
RUN mkdir -p /tmp/submissions /tests /jail/tmp /jail/dev \
    && chown app:app /tmp/submissions /tests
COPY --chown=app:app . .
USER app
EXPOSE 5000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]