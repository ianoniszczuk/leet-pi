#!/bin/sh
set -e

FILENAME="/backups/${POSTGRES_DB}-$(date +%Y-%m-%dT%H%M%S).sql.gz"

PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  -h "${POSTGRES_HOST}" \
  -p "${POSTGRES_PORT:-5432}" \
  -U "${POSTGRES_USER}" \
  --schema=public \
  --blobs \
  "${POSTGRES_DB}" | gzip -6 > "${FILENAME}"

echo "Backup creado: ${FILENAME}"
