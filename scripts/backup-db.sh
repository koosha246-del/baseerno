#!/bin/bash
# Database backup script for Baseer No
# Run via cron: 0 2 * * * /path/to/scripts/backup-db.sh

set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_URL="${DATABASE_URL}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

if [ -z "$DB_URL" ]; then
  echo "Error: DATABASE_URL not set"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

echo "Starting backup..."

pg_dump "$DB_URL" | gzip > "$BACKUP_FILE"

echo "Backup saved to: $BACKUP_FILE"

find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Old backups cleaned up (retention: $RETENTION_DAYS days)"
echo "Backup completed successfully"
