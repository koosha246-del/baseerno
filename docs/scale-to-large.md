# رسیدن به Large واقعی — Checklist اجرایی

> هدف: تبدیل «مونولیت آماده برای L» به «پلتفرم L عملیاتی».
> همه کدهای زیرساختی آمادهاند؛ این سند فقط **اجرا، deploy و اثبات** است.
> هر فاز: دستورات دقیق + معیار قبول/رد + زمانبندی.

---

## فاز ۰ — پیشنیازها (۳۰ دقیقه)

**قبل از هر deploy** این متغیرها را در تمام سرویسها ست کن:

| متغیر | از کجا | مورد نیاز برای |
|---|---|---|
| `DATABASE_URL` | Railway Postgres (primary) | web + worker |
| `DIRECT_URL` | Railway Postgres (primary, non-pooled) | migration (Prisma 7 adapter) |
| `REDIS_URL` | Upstash / Railway Redis | کش، rate limit، SSE |
| `JWT_SECRET` | تولید کن: `openssl rand -base64 48` | همه |
| `CRON_SECRET` | تولید کن: `openssl rand -base64 32` | cron ها |
| `SEARCH_HOST` / `SEARCH_API_KEY` | سرویس Meilisearch خودت | web |
| `RESEND_API_KEY` | Resend | ایمیل |
| `CLOUDINARY_*` | Cloudinary | آپلود |
| `PAYMENT_SIGNATURE_SECRET` | تولید کن | درگاه پرداخت |

**معیار قبول:** همه متغیرها در Dashboard ی Railway ست شدهاند و هیچکدام خالی نیست.

---

## فاز ۱ — Deploy سهسرویسه روی Railway (۲-۳ ساعت)

پیکربندی از قبل آماده است: `railway.toml` (web + worker + meilisearch).
مرجع کامل: [`RAILWAY_DEPLOY.md`](./RAILWAY_DEPLOY.md).

```bash
# ۱. لینک ریپو به Railway (یک بار)
railway link

# ۲. deploy همه سرویسها
railway up --detach

# ۳. مشاهده لاگ هر سرویس
railway logs --service web
railway logs --service worker
railway logs --service meilisearch
```

### پس از deploy، این checks را بزن:

```bash
# سلامت کلی (search باید "up" باشد)
curl -s https://<your-domain>/api/health | jq

# دامنه + SSL
curl -I https://<your-domain>/ | grep -iE "HTTP|cache-control"

# worker مشغول پردازش صف است؟ (۱ دقیقه صبر کن)
railway logs --service worker | grep -iE "processed|sent|backoff"
```

**معیار قبول:**
- `/api/health` → `{"healthy":true, "checks":{"db":"ok","redis":"ok","search":"up"}}`
- دامنه با HTTPS جواب میدهد (HSTS در هدر هست)
- worker لاگ پردازش صف دارد (نه فقط خطا)
- `restartPolicyType = "ON_FAILURE"` برای worker (از قبل در toml ست شده)

**معیار رد:** worker بعد از ۵ دقیقه هیچ لاگی نداشته باشد، یا Meilisearch با
`railway logs --service meilisearch` بالا نیاید (کافیست `MEILI_MASTER_KEY` ست شود).

---

## فاز ۲ — Read Replica واقعی (۱-۲ ساعت)

کد آماده است: `runOnReplica()` در `src/lib/db/replica.ts` کوئریهای سنگین
reports/dashboard را به replica میفرستد و در خطا به primary fallback میکند.

### Provision ی replica در Railway:

1. در Railway → منابع Postgres → **Create Replica** (همان provider).
2. URL ی replica را کپی کن (فقط read-only، معمولاً با `?read_only=true`).
3. در **همه سرویسها** ست کن:
   ```
   DATABASE_REPLICA_URL=<replica connection string>
   ```
   (`src/lib/db/replica.ts` به این متغیر نگاه میکند — بند ۲).

### اثبات:

```bash
# ۱. از داخل کد تست کن (در ترمینال محلی با env های production):
npx tsx -e "
  import { runOnReplica } from './src/lib/db/replica';
  runOnReplica(async (db) => {
    const r = await db.payment.count();
    console.log('replica query ok, payments =', r);
  }).then(console.log, console.error);
"

# ۲. drill ی fault-injection — replica را عمداً down کن و مطمئن شو fallback کار می‌کند:
npm run drill:replica
# → ✅ Fallback verified — replica failed, query re-ran on primary
#    (تست واحد replica-fault.test.ts همین سناریو را mock کرده)

# ۳. قطعی بودن replica را تست کن: بعد از یک mutation (خرید)،
#    گزارش dashboard ظرف چند ثانیه آپدیت شود (replication lag)
```

**معیار قبول:** کوئریهای گزارشها (فاز ۴ load test: سناریوی dashboard)
روی replica اجرا میشوند؛ اگر replica در دسترس نباشد، **بدون خطای ۵۰۰**
به primary fallback میکند (تست `replica.test.ts` این را پوشش میدهد).

---

## فاز ۳ — Meilisearch در production + cron ی sync (۱ ساعت)

شروع از قبل آماده است (`docker-compose.yml` برای محلی). برای production:

1. سرویس Meilisearch در Railway بالا رفته (فاز ۱).
2. `SEARCH_HOST` / `SEARCH_API_KEY` در web ست شده.
3. **بوتاسترپ ایندکس** (از ترمینال با env های production):

```bash
npm run seed:search
# → اگر fail شد، ایندکس خالی است و fallback ی FTS پستگرس جواب میدهد (تست شده)
```

4. **Cron ی همگامسازی** — route ی `POST /api/cron/search-sync` را با
   `x-cron-secret: <CRON_SECRET>` صدا بزن:

```bash
curl -X POST https://<your-domain>/api/cron/search-sync \
  -H "x-cron-secret: $CRON_SECRET"
# → {"ok":true,"synced":<n>}
```

در Vercel Cron (اگر بهجای Railway deploy ی web روی Vercel است) — از قبل در
`vercel.json` تنظیم شده:
```json
"crons": [
  { "path": "/api/cron/search-sync", "schedule": "0 */6 * * *" }
]
```

**معیار قبول:**
- `npm run verify:search` هر دو حالت را پاس کند: `index` (جستجوی میلیسرچ با
  غلطیابی فارسی) و `fallback` (جستجوی FTS).
- جستجوی سایت روی production نتیجه برمیگرداند (نه خطا).
- sync بهروزرسانیهای دوره را منعکس میکند: یک دوره را آپدیت کن، تا ۶ ساعت
  بعد (یا با کرون دستی) در جستجو پیدا شود.

---

## فاز ۴ — Load Test با k6 (۲-۳ ساعت)

اسکریپت آماده است: `scripts/load/k6-script.js` (۵۰ کاربر همزمان:
browse + search + dashboard).

### نصب و اجرا:

```bash
# نصب k6 (یک بار)
#   macOS:  brew install k6
#   Ubuntu: sudo gpg -k ... && sudo apt install k6
#   Win:    choco install k6  یا دانلود از https://k6.io

# اجرا روی production (نصب k6 لازم است):
K6_BASE_URL=https://<your-domain> \
K6_EMAIL=<test-user@example.com> \
K6_PASSWORD=<password> \
LOAD_VUS=50 \
npm run test:load
```

### معیار قبول (threshold های داخل اسکریپت):

| متریک | حد | نتیجه |
|---|---|---|
| `http_req_duration` p95 (همه) | < 500ms | قبول / رد |
| `http_req_failed` (همه — 429 ها جزو آنند) | < 5% | قبول / رد |
| browse (صفحات عمومی) p95 / errors | < 400ms / < 1% | قبول / رد |
| search p95 / errors | < 500ms / < 5% | قبول / رد |
| dashboard (پس از ورود) p95 / errors | < 600ms / < 1% | قبول / رد |

### تحلیل خودکار نتیجه:

بعد از هر اجرای k6، خروجی را با تحلیلگر خودکار ارزیابی کن
(گیت‌ها + پیشنهاد گلوگاه، خروجی CI-friendly با exit code):

```bash
npm run analyze:load
# → جدول گیت‌ها + پیشنهادها (مثلاً «dashboard کند → replica را بررسی کن»)
```

سناریوی‌های اجرا نشده (مثلاً در CI بدون credentials) **skip** می‌شوند نه fail —
فقط سناریوهای حاضر در result.json گیت می‌خورند (تست‌شده با fixture های
`scripts/load/fixtures/`).

### گیت خودکار در CI:

workflow ی `.github/workflows/load.yml` بعد از هر merge به `main` یک
**smoke load test** اجرا می‌کند (browse با ۵ VU و ۱۵ ثانیه)، با
`npm run analyze:load` گیت‌ها را ارزیابی می‌کند (اگر رد شوند build fail
می‌شود) و با `npm run record:load` نتیجه را برای نمودار Ops ذخیره می‌کند.
اجرای کامل ۵۰ VU با سناریوی dashboard همیشه دستی/staging است:

```bash
K6_EMAIL=... K6_PASSWORD=... LOAD_VUS=50 npm run test:load && npm run analyze:load && npm run record:load
```

### تاریخچه Load Test در Ops:

بعد از هر اجرا (CI یا دستی)، صفحه ی `/dashboard/ops` روند p95 ی هر سناریو
(browse / search / dashboard) و نتیجه ی قبول/رد را در طول زمان نشان می‌دهد
(جدول `LoadRun` در Postgres + نمودار recharts).

**آرشیو و مقایسه:** صفحه ی `/dashboard/ops/archive` (فقط ادمین) همه اجراها را
با فیلتر/جستجو نشان می‌دهد — دانلود CSV (`GET /api/ops/load-runs?format=csv`)
و **مقایسه دو اجرا کنار هم** برای پیدا کردن رگرسیون latency.

**گیت fault-injection در CI:** workflow ی کیفیت (`ci.yml`) حالا
`npm run drill:replica` را هم اجرا می‌کند — replica را عمداً down می‌کند و
ثابت می‌کند `runOnReplica` به primary fallback می‌کند.

**هشدار خودکار رگرسیون:** بعد از هر `record:load`، p95 ی هر سناریو با میانگین
۵ اجرای قبلی مقایسه می‌شود (`detectRegressions` در `src/lib/load-alerts.ts`).
اگر بیش از ۲۰٪ بدتر شده باشد، رویداد `load:regression` روی Event Bus پابلیش
می‌شود: یک AuditLog ثبت و به همه ادمین‌ها نوتیفیکیشن می‌رود
(لینک به `/dashboard/ops/archive`). تست واحد: `src/lib/__tests__/load-alerts.test.ts`.

**آرشیو با pagination:** صفحه آرشیو ۵۰ اجرای آخر را سرو می‌کند و با
`GET /api/ops/load-runs?offset=…` بقیه را بارگذاری می‌کند («بارگذاری اجراهای
قدیمی‌تر»). نمودار روند بالای جدول (با Brush برای زوم) روی همه اجراهای
بارگذاری‌شده رسم می‌شود.

**هشدار ایمیل رگرسیون شدید:** اگر p95 ی یک سناریو بیش از
`LOAD_REGRESSION_EMAIL_THRESHOLD`٪ (پیش‌فرض ۵۰) از baseline بدتر شود، علاوه
بر نوتیفیکیشن داخل اپ، یک ایمیل هشدار به همه ادمین‌ها می‌رود (با fallback ی
outbox).

**SLO ی API:** `src/lib/slo.ts` هر درخواست به route های rate-limited را در
باکت‌های ۵ دقیقه‌ای ثبت می‌کند (حجم، خطاهای 5xx، latency). صفحه Ops یک
heatmap ی ساعتی ۲۴ساعته از نرخ خطا + مجموع را نشان می‌دهد. توجه: چون edge
middleware حافظه‌ی جدا دارد، این آمار فقط route های Node-side (withRateLimit)
را پوشش می‌دهد — صفحات با Cache-Control و prisma histograms پوشش داده می‌شوند.

**اگر رد شد، به این ترتیب گلوگاه را پیدا کن:**
1. `npm run analyze:load` را بزن — خودش گلوگاه احتمالی را پیشنهاد می‌دهد.
2. `railway logs --service postgres` (یا `log_statement=all` روشن کن) — کوئریهای سنگین را پیدا کن و با `EXPLAIN ANALYZE` بررسی کن.

3. اگر کوئریهای گزارشها کندند → مطمئن شو روی replica میروند (فاز ۲).
4. اگر جستجو کند است → ایندکس Meilisearch را چک کن (`npm run verify:search:index`)
   و کش ۶۰ ثانیهای `/api/search` (کلید `search:courses:*`) را بررسی کن.
5. اگر 429 زیاد دیدی → rate limit ی search را بالا ببر
   (`src/lib/rate-limit.ts` — `SENSITIVE` preset).

---

## فاز ۵ — کش Edge (۱ ساعت)

از قبل پیادهسازی شده در `src/middleware.ts` + `src/lib/cache-control.ts`:

- **صفحات عمومی** (`/`, `/courses`, `/courses/[id]`, `/library`, `/about`, ...)
  → `Cache-Control: public, s-maxage=300, stale-while-revalidate=300`
- **Dashboard و صفحات فرم** → `private, no-store`
- **کاربر لاگینشده در صفحه عمومی** → `private` (هرگز کش عمومی برای سشن)

### اثبات:

```bash
curl -I https://<your-domain>/courses | grep -i cache-control
# → public, s-maxage=300, stale-while-revalidate=300

curl -I https://<your-domain>/dashboard | grep -i cache-control
# → private, no-store

# سرور را ۵ ثانیه down کن — صفحات عمومی باید از CDN/ISR جواب بدهند
```

**معیار قبول:** هدرها دقیقاً همین مقادیر؛ صفحات عمومی بعد از down شدن origin
همچنان (حداکثر ۵ دقیقه) قابل سرو از کش هستند.

---

## فاز ۶ — Backup & Restore Drill (۱ ساعت)

اسکریپت از قبل هست: `scripts/backup-db.sh`. این فاز فقط **تمرین restore** است:

```bash
# ۱. backup
./scripts/backup-db.sh          # → فایل .dump در ./backups

# ۲. restore به یک دیتابیس جدا (نه production!)
createdb baseerno_restore_test
pg_restore --no-owner --no-privileges -d baseerno_restore_test backups/<latest>.dump

# ۳. تأیید
psql baseerno_restore_test -c "select count(*) from \"Course\";"
psql baseerno_restore_test -c "select count(*) from \"Payment\";"
```

**معیار قبول:** restore بدون خطا؛ شمارش ردیفها با production برابر است.
**زمانبندی توصیهشده:** اجرای خودکار این drill هر ماه (CI job اختیاری).

---

## فاز ۷ — گیت نهایی «Large واقعی»

| معیار | وضعیت لازم |
|---|---|
| سه سرویس در Railway بالا | ✅ |
| `/api/health` سبز (db, redis, search) | ✅ |
| k6 با ۵۰ VU: p95 < 500ms، خطا < 1% | ✅ |
| هدرهای Cache-Control درست | ✅ |
| restore drill بدون خطا | ✅ |
| Meilisearch index با غلطیابی فارسی | ✅ |
| worker ایمیل با backoff و locking | ✅ |

**تخمین کلی:** ۶-۱۰ ساعت کار عملیاتی متمرکز (بدون احتساب خطاهای غیرمنتظره
production) + ۱ هفته مشاهده (Sentry + metrics) برای تثبیت.

---

## Rollback

| مشکل | اقدام |
|---|---|
| نسخه بد web | `railway rollback --service web` |
| ایندکس میلیسرچ خراب | `npm run seed:search` (بازسازی کامل) |
| worker خراب | ریستارت خودکار (ON_FAILURE)؛ صف در Postgres میماند |
| replica از کار افتاد | کد به primary fallback میکند (تستشده) |
| بازگشت کامل به تک-سرویسه | `git revert` تغییرات railway.toml |
