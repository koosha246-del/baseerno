#!/bin/bash
# Database backup script for Baseer No
# Run via cron: 0 2 * * * /path/to/scripts/backup-db.sh

set -e
# A truncated/corrupt backup must not look like success — the drill pair
# (restore-db.sh) depends on a trustworthy backup.
set -o pipefail

# The pg client tools are often not on PATH on Windows (e.g. they live at
# /c/pgsql16/pgsql/bin) — fail with an actionable message instead of an
# opaque "command not found". Mirrors restore-db.sh.
for tool in pg_dump gzip; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Error: '$tool' not found on PATH. Add the PostgreSQL bin directory, e.g.:" >&2
    echo "  export PATH=\"/c/pgsql16/pgsql/bin:\$PATH\"" >&2
    exit 1
  fi
done

BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_URL="${DATABASE_URL}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

if [ -z "$DB_URL" ]; then
  echo "Error: DATABASE_URL not set" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

echo "Starting backup..."

pg_dump "$DB_URL" | gzip > "$BACKUP_FILE"

echo "Backup saved to: $BACKUP_FILE"

find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

echo "Old backups cleaned up (retention: $RETENTION_DAYS days)"
echo "Backup completed successfully"
