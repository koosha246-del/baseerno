#!/bin/bash
# Database restore script for Baseer No — the "restore drill" half of the
# backup pair (backup-db.sh).
#
# Restores a backup_*.sql.gz (plain SQL produced by pg_dump | gzip) into a
# SEPARATE throwaway database so the drill never touches production data,
# then compares restored row counts against the SOURCE database — so the
# "counts equal production" acceptance check is deterministic, not
# eyeball-based.
#
# Usage:
#   ./scripts/restore-db.sh [backup-file]          # default: latest backup
#   RESTORE_TARGET_DB=drill_test ./scripts/restore-db.sh
#   RESTORE_CLEANUP=1 ./scripts/restore-db.sh      # drop the target DB after verify
#   SKIP_COMPARE=1 ./scripts/restore-db.sh         # skip the source comparison
#
# Safety rails:
#   - The target database defaults to `baseerno_restore_test` and is
#     dropped + recreated before restoring, so a drill is idempotent.
#   - Restoring into the SAME database name as DATABASE_URL is refused
#     unless ALLOW_PRODUCTION_RESTORE=1 (a drill should never hit prod).
#   - Non-interactive: the password is read from DATABASE_URL and exported
#     as PGPASSWORD, so psql/createdb/dropdb never prompt (a prompt would
#     hang a scripted drill).
#
# NOTE on client tools: createdb/dropdb do NOT parse a connection URI as
# their positional argument (they connect as the OS user instead). We
# therefore parse DATABASE_URL into PG* variables and pass -h/-p/-U
# explicitly — same shape as the drill commands in docs/EXECUTE-TO-LARGE.md.
# The regex below is intentionally localhost-focused: passwords containing
# '@' (URL-encoded as %40 in practice) or IPv6 hosts like [::1] are not
# handled — acceptable for the local drill this script serves.
#
# Acceptance (docs/EXECUTE-TO-LARGE.md گام ۵): restore without error and
# row counts on key tables equal to production. The script exits non-zero
# when any restored count differs from the source.

set -e
# A truncated/corrupt backup must fail the drill deterministically (the
# whole point of a restore drill is trustworthiness), not produce a
# partial restore that happens to look like success.
set -o pipefail

# The pg client tools are often not on PATH on Windows (e.g. they live at
# /c/pgsql16/pgsql/bin) — fail with an actionable message instead of an
# opaque "command not found".
for tool in psql createdb dropdb gunzip; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Error: '$tool' not found on PATH. Add the PostgreSQL bin directory, e.g.:" >&2
    echo "  export PATH=\"/c/pgsql16/pgsql/bin:\$PATH\"" >&2
    exit 1
  fi
done

BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_URL="${DATABASE_URL}"
TARGET_DB="${RESTORE_TARGET_DB:-baseerno_restore_test}"
ALLOW_PRODUCTION_RESTORE="${ALLOW_PRODUCTION_RESTORE:-0}"
RESTORE_CLEANUP="${RESTORE_CLEANUP:-0}"
SKIP_COMPARE="${SKIP_COMPARE:-0}"

if [ -z "$DB_URL" ]; then
  echo "Error: DATABASE_URL not set" >&2
  exit 1
fi

# Parse postgres(ql)://user:password@host[:port]/dbname[?params]
if [[ "$DB_URL" =~ ^postgres(ql)?://([^:]+):([^@]*)@([^:/]+)(:([0-9]+))?/([^?]*)(\?.*)?$ ]]; then
  PGUSER="${BASH_REMATCH[2]}"
  PGPASSWORD="${BASH_REMATCH[3]}"
  PGHOST="${BASH_REMATCH[4]}"
  PGPORT="${BASH_REMATCH[6]:-5432}"
  SRC_DB="${BASH_REMATCH[7]}"
else
  echo "Error: cannot parse DATABASE_URL (expected postgresql://user:pass@host:port/db)" >&2
  exit 1
fi
export PGPASSWORD

# Pick the backup file: explicit arg, or the most recent one. The `|| true`
# is required: under `set -o pipefail` an empty glob makes `ls | head`
# exit non-zero, which would otherwise kill the script before the friendly
# "backup not found" message below.
if [ -n "${1:-}" ]; then
  BACKUP_FILE="$1"
else
  BACKUP_FILE="$(ls -t "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | head -1 || true)"
fi
if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: backup file not found. Pass a path, or run scripts/backup-db.sh first." >&2
  exit 1
fi

# Production guard: the drill restores to a SEPARATE database. Refuse when
# the target matches the source, or when the source name can't be
# determined at all.
if [ "$ALLOW_PRODUCTION_RESTORE" != "1" ]; then
  if [ -z "$SRC_DB" ]; then
    echo "Error: could not determine the source database name from DATABASE_URL." >&2
    echo "This drill restores to a SEPARATE database ($TARGET_DB)." >&2
    exit 1
  fi
  if [ "$SRC_DB" = "$TARGET_DB" ]; then
    echo "Error: refusing to restore into '$TARGET_DB' — it matches the source database." >&2
    echo "This drill restores to a SEPARATE database. Override with ALLOW_PRODUCTION_RESTORE=1 if you really mean it." >&2
    exit 1
  fi
fi

CONN=(-h "$PGHOST" -p "$PGPORT" -U "$PGUSER")

echo "Restoring: $BACKUP_FILE"
echo "Target DB: $TARGET_DB"

# Drop + recreate the target (idempotent drill).
dropdb --if-exists "${CONN[@]}" "$TARGET_DB" >/dev/null 2>&1 || true
createdb "${CONN[@]}" "$TARGET_DB"

# Restore the plain-SQL backup. Stdout is silenced (the pg_dump preamble
# prints noise like `set_config`); ON_ERROR_STOP + stderr keep failures
# loud, and pipefail surfaces a corrupt gzip.
gunzip -c "$BACKUP_FILE" | psql "${CONN[@]}" -d "$TARGET_DB" -v ON_ERROR_STOP=1 -q >/dev/null

# Verify — restored row counts vs the SOURCE database. The drill spec
# (Course, Payment, Enrollment) names real Prisma models → real tables.
TABLES="Course Payment Enrollment"
echo ""
echo "Verification (restored vs source '$SRC_DB'):"
fail=0
for table in $TABLES; do
  restored=$(psql "${CONN[@]}" -t -A -d "$TARGET_DB" -c "select count(*) from \"$table\";") \
    || { echo "  ❌ $table: count query on restored DB failed" >&2; exit 1; }
  if [ "$SKIP_COMPARE" = "1" ]; then
    echo "  $table: $restored rows (comparison skipped)"
    continue
  fi
  source_count=$(psql "${CONN[@]}" -t -A -d "$SRC_DB" -c "select count(*) from \"$table\";") \
    || { echo "  ❌ $table: count query on source DB failed" >&2; exit 1; }
  if [ "$restored" = "$source_count" ]; then
    echo "  ✅ $table: $restored = $source_count"
  else
    echo "  ❌ $table: restored $restored ≠ source $source_count"
    fail=1
  fi
done

echo ""
if [ "$fail" = "1" ]; then
  echo "Restore drill FAILED — row counts do not match production." >&2
  exit 1
fi

if [ "$SKIP_COMPARE" = "1" ]; then
  echo "Restore drill completed successfully (comparison skipped)."
else
  echo "Restore drill passed: counts match the source database."
fi

if [ "$RESTORE_CLEANUP" = "1" ]; then
  dropdb --if-exists "${CONN[@]}" "$TARGET_DB"
  echo "Cleaned up: '$TARGET_DB' dropped"
fi
