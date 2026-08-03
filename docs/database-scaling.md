# مقیاس دیتابیس — بصیر نو

این سند pooling، read replica، پارتیشن‌بندی و نگهداری/backup را پوشش می‌دهد. همه موارد **اختیاری** هستند: بدون هیچ کدام، برنامه با یک `DATABASE_URL` ساده مثل قبل کار می‌کند.

## ۱. Connection pooling (Supabase/Neon pattern)

- `DATABASE_URL` = کانکشن pooled (مثلاً `?pgbouncer=true&connection_limit=10` در Supabase، یا پورت pool در Neon).
- `DIRECT_URL` = کانکشن مستقیم (برای migration ها) — اختیاری.
- `src/lib/env.ts` هر دو را می‌خواند. `src/lib/db/prisma-client.ts` از `DATABASE_URL` استفاده می‌کند.

```bash
# .env
DATABASE_URL=postgresql://user:pass@host:6543/db?pgbouncer=true
DIRECT_URL=postgresql://user:pass@host:5432/db
```

> چرا؟ Prisma یک اتصال per-instance باز می‌کند؛ با چند instance بدون pool، Postgres به سقف connection می‌رسد. Pool واسطه می‌شود.

## ۲. Read replica (اختیاری)

- `REPLICA_URL` را تنظیم کن؛ `src/lib/db/replica.ts` یک کلاینت دوم می‌سازد.
- استفاده: کوئری‌های سنگین فقط-خواندنی (dashboard stats، گزارش‌ها، کاتالوگ) از `getReplicaClient()` — با fallback به primary وقتی خالی است.
- ⚠️ هرگز از replica بنویس؛ و برای داده‌ای که تازه نوشته شده از replica نخوان (lag چند ثانیه‌ای دارد).

## ۳. پارتیشن‌بندی جداول بزرگ (Message, Notification, ChatMessage, EmailOutbox)

جداول پررشد بر اساس `createdAt` پارتیشن ماهانه می‌شوند. الگوی expand/contract بدون downtime:

```sql
-- 1) جدول پارتیشن‌بندی‌شده جدید با همان ستون‌ها
CREATE TABLE "Message_new" (
  LIKE "Message" INCLUDING DEFAULTS INCLUDING CONSTRAINTS
) PARTITION BY RANGE ("createdAt");

-- 2) پارتیشن‌های اولیه
CREATE TABLE "Message_new_202607" PARTITION OF "Message_new"
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE "Message_new_202608" PARTITION OF "Message_new"
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

-- 3) کپی داده در پنجره‌های کوچک (batch insert)
-- 4) swap: ALTER TABLE ... RENAME; یا نقطه توقف کوتاه
-- 5) ایندکس‌ها روی جدول جدید
```

نگهداری: اسکریپت cron که پارتیشن ماه آینده را می‌سازد و پارتیشن‌های قدیمی‌تر از retention را drop می‌کند.

> پیش از اجرا در production حتماً روی محیط staging تست شود؛ migration های دستی پارتیشن را در CI با Postgres واقعی اجرا کن.

## ۴. ایندکس‌های پیشنهادی (EXPLAIN شده)

برخی ایندکس‌های composite مفید برای کوئری‌های پرتکرار:

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Notification_userId_read_idx"
  ON "Notification"("userId", "read");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Message_senderId_sentAt_idx"
  ON "Message"("senderId", "sentAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ChatMessage_conversationId_createdAt_idx"
  ON "ChatMessage"("conversationId", "createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Payment_userId_status_idx"
  ON "Payment"("userId", "status");
```

قبل از افزودن هر ایندکس، با `EXPLAIN ANALYZE` روی کوئری واقعی تأیید کن که استفاده می‌شود.

## ۵. نگهداری (VACUUM/ANALYZE)

```bash
# هر شب
vacuumdb --analyze --jobs=4 "$DATABASE_URL"
```

## ۶. Backup / Restore

اسکریپت موجود: `scripts/backup-db.sh` (pg_dump روزانه + retention ۳۰ روز).

```bash
# restore
gunzip -c backups/backup_YYYYMMDD_HHMMSS.sql.gz | psql "$DATABASE_URL"
```

اهداف پیشنهادی: RPO ≤ ۲۴h (backup روزانه)، RTO ≤ ۳۰ دقیقه. ماهی یک‌بار تست restore واقعی انجام بده و مستندش کن.

## ۷. معماری اتصال فعلی

- `src/lib/db/prisma-client.ts`: `prismaRaw` (خام، برای admin/repair) + `prisma` (soft-delete aware + timing).
- `src/lib/db/replica.ts`: کلاینت replica اختیاری.
- `scripts/backup-db.sh`: backup خودکار.
