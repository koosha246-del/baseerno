#!/bin/bash
# Backup/Restore parity drill — self-verifying test for the backup pair.
#
# Proves the گام ۵ acceptance ("restore without error + counts equal
# production") end-to-end against REAL scratch databases, without touching
# any production data:
#
#   1. Create a scratch source DB seeded with known row counts.
#   2. Backup it with scripts/backup-db.sh.
#   3. Restore into a separate scratch target with scripts/restore-db.sh
#      → must PASS (counts match the source).
#   4. Insert one extra row into the source, restore again from the same
#      backup → must FAIL (the drill's comparison must catch the mismatch
#      and exit non-zero).
#   5. Clean up scratch DBs + the backup file (always, even on failure).
#
# This is CI-friendly: exits 0 only when the whole drill behaves as
# specified. Wire it into a cron job / workflow for the monthly restore
# drill (docs/EXECUTE-TO-LARGE.md گام ۵.۳).
#
# Usage:
#   ./scripts/drill-backup-restore.sh
#
# Requires: DATABASE_URL (any reachable Postgres — only the connection
# parts are used; the source DB named in it is NEVER modified), and the
# pg client tools on PATH.

set -e
set -o pipefail

for tool in psql pg_dump createdb dropdb gunzip; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Error: '$tool' not found on PATH. Add the PostgreSQL bin directory, e.g.:" >&2
    echo "  export PATH=\"/c/pgsql16/pgsql/bin:\$PATH\"" >&2
    exit 1
  fi
done

DB_URL="${DATABASE_URL:?DATABASE_URL not set}"

# Parse connection parts from DATABASE_URL (same regex as restore-db.sh).
if [[ "$DB_URL" =~ ^postgres(ql)?://([^:]+):([^@]*)@([^:/]+)(:([0-9]+))?/([^?]*)(\?.*)?$ ]]; then
  PGUSER="${BASH_REMATCH[2]}"
  PGPASSWORD="${BASH_REMATCH[3]}"
  PGHOST="${BASH_REMATCH[4]}"
  PGPORT="${BASH_REMATCH[6]:-5432}"
else
  echo "Error: cannot parse DATABASE_URL (expected postgresql://user:pass@host:port/db)" >&2
  exit 1
fi
export PGPASSWORD

CONN=(-h "$PGHOST" -p "$PGPORT" -U "$PGUSER")

# Unique scratch names per run: timestamp + PID so parallel/re-run drills
# can never collide (two runs within the same second are otherwise a
# real possibility with a monthly cron re-run or manual + CI overlap).
TS=$(date +%Y%m%d_%H%M%S)
SRC_DB="drill_src_${TS}_$$"
TGT_DB="drill_tgt_${TS}_$$"
DRILL_BACKUP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/drill-backup.XXXXXX")"

cleanup() {
  dropdb --if-exists "${CONN[@]}" "$TGT_DB" >/dev/null 2>&1 || true
  dropdb --if-exists "${CONN[@]}" "$SRC_DB" >/dev/null 2>&1 || true
  rm -rf "$DRILL_BACKUP_DIR"
}
trap cleanup EXIT

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Drill: backup → restore parity ==="
echo "Source: $SRC_DB   Target: $TGT_DB"

# ── 1. Scratch source DB with known counts ──────────────────────────
createdb "${CONN[@]}" "$SRC_DB"
psql "${CONN[@]}" -d "$SRC_DB" -q -v ON_ERROR_STOP=1 <<'SQL'
CREATE TABLE "Course" (id TEXT PRIMARY KEY);
CREATE TABLE "Payment" (id TEXT PRIMARY KEY);
CREATE TABLE "Enrollment" (id TEXT PRIMARY KEY);
INSERT INTO "Course"     SELECT 'c' || g FROM generate_series(1, 4) g;
INSERT INTO "Payment"    SELECT 'p' || g FROM generate_series(1, 5) g;
INSERT INTO "Enrollment" SELECT 'e' || g FROM generate_series(1, 5) g;
SQL

# Source connection string with the scratch DB name (no query params).
BASE_URL="${DB_URL%%\?*}"
SRC_URL="${BASE_URL%/*}/$SRC_DB"

# ── 2. Backup ───────────────────────────────────────────────────────
echo "--- Backup ---"
BACKUP_DIR="$DRILL_BACKUP_DIR" DATABASE_URL="$SRC_URL" \
  "$SCRIPT_DIR/backup-db.sh" >/dev/null

# ── 3. Restore → must pass (counts match) ───────────────────────────
echo "--- Restore (expect PASS) ---"
RESTORE_LOG="$DRILL_BACKUP_DIR/restore-pass.log"
if ! DATABASE_URL="$SRC_URL" BACKUP_DIR="$DRILL_BACKUP_DIR" RESTORE_TARGET_DB="$TGT_DB" \
  "$SCRIPT_DIR/restore-db.sh" >"$RESTORE_LOG" 2>&1; then
  echo "❌ Drill failed: restore exited non-zero even though counts matched." >&2
  tail -n 20 "$RESTORE_LOG" >&2 || true
  exit 1
fi
echo "✅ Restore passed with matching counts."

# ── 4. Inject a mismatch → restore must FAIL ────────────────────────
echo "--- Restore after source mutation (expect FAIL) ---"
psql "${CONN[@]}" -d "$SRC_DB" -q -c "INSERT INTO \"Course\" VALUES ('c-extra');"
RESTORE_LOG="$DRILL_BACKUP_DIR/restore-fail.log"
if DATABASE_URL="$SRC_URL" BACKUP_DIR="$DRILL_BACKUP_DIR" RESTORE_TARGET_DB="$TGT_DB" \
  "$SCRIPT_DIR/restore-db.sh" >"$RESTORE_LOG" 2>&1; then
  echo "❌ Drill failed: restore succeeded despite a count mismatch." >&2
  exit 1
fi
echo "✅ Restore correctly rejected the mismatch (non-zero exit)."

echo ""
echo "🎉 Drill passed: backup → restore parity + mismatch detection verified."
