# 🚀 برنامه اجرایی: تکمیل مسیر تا «Large واقعی»

> مبنای این برنامه: چکلیست `docs/scale-to-large.md` + وضعیت واقعی کد (بررسیشده).
> همه ابزارها و اسکریپتها از قبل آمادهاند؛ این سند فقط **ترتیب اجرا، دستورهای دقیق و معیار قبول/رد** هر گام است.
> زمانها برای یک نفر با تمرکز کامل روی یک ماشین dev معمولی.

---

## 🗺️ نقشه کلی (به ترتیب اولویت)

| # | گام | زمان | خروجی |
|---|---|---|---|
| ۰ | آمادهسازی env و تولید اسرار | ۳۰ دقیقه | همه متغیرها ستشده |
| ۱ | **Deploy سهسرویسه روی Railway** | ۲-۳ ساعت | web + worker + meili بالا |
| ۲ | **Redis واقعی** (Upstash/Railway) | ۱ ساعت | `REDIS_URL` در web + worker |
| ۳ | **Meilisearch + seed + کرون sync** | ۱-۱.۵ ساعت | جستجوی فارسی با غلطیابی |
| ۴ | **Load test با k6** + تحلیل | ۲-۳ ساعت | آمار p95 + رکورد در Ops |
| ۵ | **Backup & Restore drill** | ۱ ساعت | بازیابی اثباتشده |
| ۶ | گیت نهایی «Large» | ۳۰ دقیقه | ۷/۷ شرط سبز |
| (اختیاری) | Read Replica واقعی | ۱-۲ ساعت | کوئریهای سنگین روی replica |

**جمع کل: ~۶-۱۰ ساعت** (بدون احتساب خطاهای غیرمنتظره production).

---

## گام ۰ — آمادهسازی env و اسرار (۳۰ دقیقه)

### ۰.۱ تولید اسرار از دست رفته

```bash
# CRON_SECRET — برای محافظت از endpoint های کرون
openssl rand -base64 32

# اگر JWT_SECRET / PAYMENT_SIGNATURE_SECRET میخواهی دوباره بزنی (اختیاری)
openssl rand -base64 48
```

### ۰.۲ جدول متغیرها برای هر سرویس Railway

> ⚠️ شرطهای سخت production در `src/lib/env.ts`:
> `DATABASE_URL` الزامی، `JWT_SECRET` ≥ ۳۲ کاراکتر، `PAYMENT_SIGNATURE_SECRET` ≥ ۱۶ کاراکتر، و **`DEMO_MODE` نباید در production ست شود** (اگر ست باشد startup خطا میدهد).
>
> ⚠️ **worker هم به `JWT_SECRET` و `PAYMENT_SIGNATURE_SECRET` نیاز دارد** — حتی اگر خودش مستقیم از JWT استفاده نکند. زنجیرهی import این است: `worker/email-worker.ts → email-queue → prisma-client → env.ts`، و `env.ts` در production در نبود این دو **همان اول startup کرش میکند**.

| متغیر | سرویس web | worker | meili | از کجا |
|---|---|---|---|---|
| `DATABASE_URL` | ✅ | ✅ | — | Railway Postgres (primary) |
| `DIRECT_URL` | ✅ | — | — | Railway Postgres (non-pooled) — برای migration ها |
| `REDIS_URL` | ✅ | — | — | گام ۲ (فقط web — worker از Redis استفاده نمیکند؛ ایمیل از صف Postgres است) |
| `JWT_SECRET` | ✅ | ✅ | — | تولیدشده (worker هم الزامی — شرط env.ts) |
| `PAYMENT_SIGNATURE_SECRET` | ✅ | ✅ | — | از `.env` فعلی (worker هم الزامی — شرط env.ts) |
| `CRON_SECRET` | ✅ | — | — | تولیدشده (نکتهی Vercel در گام ۳.۵) |
| `SEARCH_HOST` | ✅ | — | — | آدرس سرویس meili (گام ۳) |
| `SEARCH_API_KEY` | ✅ | — | — | همان `MEILI_MASTER_KEY` |
| `MEILI_MASTER_KEY` | — | — | ✅ | تولیدشده (≥ ۱۶ کاراکتر) |
| `MEILI_ENV` | — | — | ✅ | `production` |
| `NEXT_PUBLIC_SITE_URL` | ✅ | — | — | دامنه نهایی (باید قبل از build ست شود) |
| `RESEND_API_KEY` | ✅ | ✅ | — | Resend |
| `SENTRY_DSN` / `NEXT_PUBLIC_GA_ID` | ✅ | — | — | اختیاری |
| `CLOUDINARY_*` | ✅ | — | — | اختیاری |
| `REPLICA_URL` | ✅ | — | — | اختیاری (گام ۷) |

> 📌 نام دقیق متغیر replica **`REPLICA_URL`** است (از `src/lib/db/replica.ts` و `env.ts` تأیید شد) — سند قدیمی `scale-to-large.md` از `DATABASE_REPLICA_URL` یاد میکند که **اشتباه/منسوخ** است؛ با `REPLICA_URL` جلو برو.

**معیار قبول:** در داشبورد Railway هر سرویس، همه متغیرهای ردیفش ست شده و هیچکدام خالی نیست.

---

## گام ۱ — Deploy سهسرویسه روی Railway (۲-۳ ساعت)

پیکربندی آماده است: `railway.toml` (web + worker + meili از تصویر رسمی `getmeili/meilisearch:v1.13`). Build Command ها از قبل داخل `railway.toml` هستند (web: `npx prisma generate && npm run build`؛ worker: فقط `npx prisma generate` تا Next را build نکند).

### ۱.۱ نصب CLI و ورود

```bash
# نصب CLI (یک بار)
npm i -g @railway/cli
railway login
```

### ۱.۲ Push به GitHub (اگر ریپو هنوز نرفته)

```bash
git init
git add .
git commit -m "feat: large-scale infra (worker, meili, observability)"
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
git push -u origin main
```

### ۱.۳ ساخت پروژه و دپلوی — **ترتیب مهم است**

> ⚠️ `railway link` فقط روی **پروژهی موجود** کار میکند. پس اول پروژه را بساز، بعد (در صورت نیاز) link کن.

**مسیر A — داشبورد (پیشنهادی برای اولین بار):**

در [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → ریپو را انتخاب کن. Railway با خواندن `railway.toml` سه سرویس (`web`, `worker`, `meili`) را میسازد و دپلوی خودکار از GitHub است.

**مسیر B — CLI (برای دپلوی دستی/سریع):**

```bash
railway init          # در پوشهی پروژه — پروژه + سرویسها را از railway.toml میسازد
railway up --detach   # دپلوی همه سرویسها

# برای دپلویهای بعدی (بعد از اینکه پروژه وجود داشت):
railway link          # پروژهی موجود را انتخاب کن
railway up --detach
```

### ۱.۴ اعمال migration ها + seed

در Railway → سرویس `web` → Deploy → **Run Command** (یا محلی: `railway run --service web npx prisma migrate deploy`):

```bash
npx prisma migrate deploy
npm run db:seed          # فقط اگر میخواهی دادهی نمونه در production باشد
```

> اگر از دیتابیس pooling شده استفاده میکنی، مطمئن شو `DIRECT_URL` ست شده — Prisma 7 با adapter-pg از آن برای migration استفاده میکند.

### ۱.۵ Checks

```bash
# سلامت کلی (search بعد از ست کردن meili "up" میشود)
curl -s https://<your-domain>/api/health | jq

# دامنه + SSL + کش Edge
curl -I https://<your-domain>/courses | grep -iE "HTTP|cache-control"

# worker مشغول پردازش صف است؟
railway logs --service worker | grep -iE "processed|sent|backoff"
```

**معیار قبول:**
- `/api/health` → `{"healthy":true,"checks":{"db":"ok","redis":"ok","search":"up"}}`
- `Cache-Control: public, s-maxage=300` روی `/courses` و `private, no-store` روی `/dashboard`
- worker لاگ پردازش صف دارد.

**معیار رد:** worker بعد از ۵ دقیقه هیچ لاگی، یا meili بالا نیاید (`MEILI_MASTER_KEY` ست نشده باشد).

---

## گام ۲ — Redis واقعی (۱ ساعت)

کد آماده است: `src/lib/redis-client.ts` (singleton با fallback امن) — rate limit، کش `getOrSet` و SSE از آن استفاده میکنند. فعلاً `REDIS_URL` خالی است و همهچیز در-حافظهای است.

### مسیر A — پلاگین Redis خودِ Railway (سادهترین)

```bash
railway add --plugin redis
# → رشتهی اتصال (redis://...) را کپی کن و در web + worker ست کن:
#   REDIS_URL=redis://default:<password>@<host>:<port>
```

### مسیر B — Upstash (اگر نمیخواهی پلاگین اضافه کنی)

1. در [upstash.com](https://upstash.com) دیتابیس رایگان بساز.
2. رشتهی `rediss://...` (TLS) را کپی کن — `node-redis` در `redis-client.ts` از `createClient({ url })` همین رشته را قبول میکند.
3. در web + worker ست کن: `REDIS_URL=rediss://default:<token>@<host>:<port>`.

### اثبات

```bash
# بعد از ست کردن، health باید redis را "ok" نشان دهد
curl -s https://<your-domain>/api/health | jq .checks.redis
# → "ok"

# تست rate limit واقعی (با Redis، بین instance ها مشترک است):
# لاگینهای متوالی با رمز غلط بزن تا به 429 برسی (حد دقیق AUTH در کد است؛ تکرار کن تا 429 ببینی)
for i in $(seq 1 10); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST https://<your-domain>/api/auth/login \
    -H "Content-Type: application/json" -d '{"email":"student@baseerno.ir","password":"wrong"}'
done
```

**معیار قبول:** `/api/health` → `redis: "ok"`؛ با دو instance ی web، rate limit مشترک عمل میکند (لاگینهای متوالی → 429).

### اثبات خودکار (drill زنده — از قبل آماده است)

```bash
npm run verify:redis
# shared mode: ping + دو فرایند مجزا (شبیهسازی دو instance) — فرایند A سه درخواست مجاز،
#              فرایند B روی همان شمارنده بلاک میشود (اثبات اشتراک از طریق Redis)
# fallback mode: بدون REDIS_URL → fallback در-حافظهای هنوز max را اعمال میکند
```

> ⚠️ **نسخهی Redis محلی باید ≥ 6 باشد.** node-redis (پکیج `redis`) هنگام اتصال `HELLO 3` میفرستد که Redis 5 (build ویندوزی tporadowski) پشتیبانی نمیکند → حلقهی reconnect بیپایان. از build های `redis-windows/redis-windows` (Redis 7/8) یا docker استفاده کن. در CI، workflow `redis-drill.yml` همین drill را با سرویس `redis:7-alpine` اجرا میکند.


---

## گام ۳ — Meilisearch + seed + کرون sync (۱-۱.۵ ساعت)

سرویس `meili` در `railway.toml` تعریف شده (گام ۱). این گام فقط پیکربندی و ایندکس است.

### ۳.۱ پیکربندی meili

در سرویس `meili` → Variables:

```
MEILI_MASTER_KEY=<یک-کلید-تصادفی-حداقل-16-کاراکتر>
MEILI_ENV=production
```

سپس برای سرویس `meili` یک **دامنه** بگیر (Settings → Domains → Generate Domain) — مثلاً `https://baseerno-meili.up.railway.app`. این میشود `SEARCH_HOST`.

### ۳.۲ اتصال web به meili

در سرویس `web` → Variables:

```
SEARCH_HOST=https://baseerno-meili.up.railway.app
SEARCH_API_KEY=<همان MEILI_MASTER_KEY>
```

### ۳.۳ بوتاسترپ ایندکس (با تنظیمات فارسی + غلطیابی)

از داخل Railway → سرویس `web` → **Run Command** (یا از ترمینال محلی با env های production):

```bash
npm run seed:search
# → ✅ Indexed N courses into "courses"
# → ✅ Persian typo tolerance "..." → hit
```

> اسکریپت (`prisma/seed-meilisearch.ts`) خودش تنظیمات فارسی (typo tolerance، stop words) را اعمال میکند، کل ایندکس را از نو میسازد و **خود-تأیید** میکند (جستجوی دقیق + جستجوی با غلطی).
> اگر fail شد، ایندکس خالی است و fallback ی FTS پستگرس جواب میدهد (تستشده) — خطا نیست.

### ۳.۴ تأیید هر دو مسیر (ایندکس + fallback)

```bash
# از ترمینال محلی، با env های production:
npm run verify:search
# → ✅ همه checks پاس: index mode + fallback mode
```

### ۳.۵ کرون همگامسازی

محتویات دوره با رویداد `search:needs-sync` روی Event Bus علامت میخورد؛ کرون ایندکس را با آخرین داده هماهنگ میکند.

**اگر web روی Vercel است** (کرون از قبل در `vercel.json` هست):

> ⚠️ **مهم — ناسازگاری کرون Vercel:** route های `/api/cron/*` هدر `x-cron-secret` را چک میکنند، ولی **Vercel در درخواستهای cron هدر سفارشی نمیفرستد** (فقط `x-vercel-cron` میفرستد). کد (`src/app/api/cron/*/route.ts`) این است: `if (expected && cronSecret !== expected)`. یعنی:
> - اگر `CRON_SECRET` در Vercel **ست نشده باشد** → شرط رد میشود و کرونها کار میکنند ✅ (پیشنهاد برای Vercel)
> - اگر `CRON_SECRET` ست شده باشد → کرونهای Vercel 401 میخورند ❌ (باید route هدر `x-vercel-cron` را هم بپذیرد یا از کرون خارجی استفاده کنی)

```jsonc
// vercel.json (از قبل موجود)
"crons": [
  { "path": "/api/cron/search-sync", "schedule": "0 */6 * * *" },
  { "path": "/api/cron/email",       "schedule": "*/5 * * * *" }
]
```

**اگر web روی Railway است** (کرون بومی HTTP ندارد) — با یک سرویس cron خارجی رایگان مثل [cron-job.org](https://cron-job.org):

```bash
# هر ۶ ساعت: POST به کرون sync با هدر secret
curl -X POST https://<your-domain>/api/cron/search-sync \
  -H "x-cron-secret: $CRON_SECRET"
# → {"ok":true,"synced":<n>}
```

> 📌 ایمیل روی Railway به کرون **نیاز ندارد** — سرویس `worker` خودش هر ۱۰ ثانیه صف `EmailOutbox` را با backoff پردازش میکند (`restartPolicyType: ON_FAILURE` از قبل ست شده).

**معیار قبول:**
- `npm run verify:search` هر دو حالت (index + fallback) پاس باشد.
- جستجوی سایت روی production نتیجه برمیگرداند؛ «مکلمه» (غلط املایی) هم «مکالمه» را پیدا میکند.
- بعد از آپدیت یک دوره، با کرون دستی در جستجو ظاهر میشود.

---

## گام ۴ — Load test با k6 (۲-۳ ساعت)

اسکریپت آماده است: `scripts/load/k6-script.js` — ۴ سناریو (browse + search + auth + dashboard) با ۵۰ VU پیشفرض، و `handleSummary` آن خروجی `result.json` مینویسد.

### ۴.۱ نصب k6 (ویندوز)

```powershell
# روش ۱: chocolatey
choco install k6

# روش ۲: دانلود مستقیم از https://k6.io → زیپ را در PATH بگذار
k6 version   # تأیید نصب
```

(روی macOS: `brew install k6` — روی Ubuntu: از مستندات k6.io)

### ۴.۲ اجرای کامل ۵۰ VU روی production

> ⚠️ **هشدار مهم — متغیرهای تنظیم را با `-e` بده، نه بهصورت env شل:**
> `K6_VUS` و `K6_DURATION` با config-options خودِ k6 (`vus`/`duration`) برخورد میکنند و **کل بلاک scenarios را override** میکنند — فقط سناریوی browse اجرا میشود و بقیه از گزارش غایباند. اسکریپت بهجایشان از `LOAD_VUS` / `LOAD_DURATION` میخواند؛ آن را هم بهصورت `-e` بده (داخل `__ENV` میآید و با config برخورد نمیکند).

```bash
cd E:/Desktop/ZCodeProject
k6 run \
  -e K6_BASE_URL=https://<your-domain> \
  -e K6_EMAIL=student@baseerno.ir \
  -e K6_PASSWORD=<password> \
  -e LOAD_VUS=50 \
  -e LOAD_DURATION=60s \
  scripts/load/k6-script.js
```

> 🔑 **`K6_ORIGIN` (فقط برای تست local/staging):** لاگین در production چک CSRF دارد و فقط Origin دامنهی اصلی (`siteConfig.url` = baseerno.ir) را میپذیرد. وقتی به یک build محلی روی `127.0.0.1:8088` تست میگیری، باید `-e K6_ORIGIN=https://baseerno.ir` (یا Origin واقعی) را بدهی وگرنه لاگینها 403 میخورند. روی خود دامنهی production نیازی نیست.
>
> 🧪 برای یک **smoke سریع** روی build محلی: `-e LOAD_VUS=20 -e LOAD_DURATION=20s` کافی است (گیتها از روی آمار همان run خوانده میشوند).

### ۴.۳ تحلیل خودکار + ذخیره در Ops

```bash
npm run analyze:load    # جدول گیتها + پیشنهاد گلوگاه (exit code مناسب CI)
npm run record:load     # ذخیره در جدول LoadRun → نمودار /dashboard/ops
```

### ۴.۴ گیتهای پذیرش (threshold های داخل اسکریپت — با کد هماهنگ است)

| متریک | حد |
|---|---|
| `http_req_duration` p95 (همه) | < 600ms (سقف سانیتی — برابر گیت dashboard) |
| browse p95 / خطا | < 400ms / < 1% |
| search p95 / خطا | < 500ms / < 5% (429 تحمل میشود) |
| dashboard p95 / خطا | < 600ms / < 1% |

> 📌 گیت سراسری عمداً برابر **شلترین گیت سناریو** (dashboard: 600ms) است — گیت سراسری سختتر از گیت یک سناریو، خطای متناقض میسازد (dashboard با p95=550 از گیت خودش میگذرد ولی از گیت سراسری رد میشود).

### ۴.۵ اگر رد شد، به این ترتیب گلوگاه را پیدا کن

1. `npm run analyze:load` — خودش گلوگاه احتمالی را میگوید.
2. `railway logs --service postgres` — کوئریهای سنگین را با `EXPLAIN ANALYZE` بررسی کن.
3. اگر گزارشها کندند → مطمئن شو روی replica میروند (گام ۷).
4. اگر search کند است → ایندکس میلیسرچ + کش ۶۰ ثانیهای (`search:courses:*`) را چک کن.
5. اگر 429 زیاد دیدی → rate limit ی search را بالا ببر (`src/lib/rate-limit.ts` — SENSITIVE).

### ۴.۶ درسهای عملی که در validation محلی پیدا شد (قبلاً در اسکریپت اعمال شده)

این باگها در اجرای واقعی کشف و در `k6-script.js` رفع شدند — هنگام مواجهه، رفتار را غیرمنتظره ندان:

1. **کوکی سشن `Secure` روی http ارسال نمیشود:** k6 کوکی Secure را به http:// نمیفرستد → جستجوها 401 میشوند. اسکریپت `Set-Cookie` را میخواند و با `cookieJar().set()` بدون فلگ Secure در jar میگذارد.
2. **jar کوکی k6 بین iteration ها پاک میشود** (ولی module state نه): سناریوی search یک بار لاگین میکند ولی هر iteration دوباره توکن را در jar ست میکند (`ensureSessionInJar`) — وگرنه iteration دوم به بعد همهچیز 401 میشود.
3. **IP مشترک = rate limit ی AUTH سیر میشود:** rate limit ی AUTH در اپ per-IP است (5+2 burst). همه VU ها با یک IP ("local") از ۳۵ لاگین اول 429 میخورند. اسکریپت به ازای هر (سناریو، VU) یک IP ساختگی از بازهی معیار IANA (198.18.0.0/15) با `X-Forwarded-For` میفرستد — مثل production که هر کاربر IP خودش را دارد.
4. **نشانگر p99 همیشه ۰ است:** k6 برای Trend فقط p(90) و p(95) محاسبه میکند؛ خروجی بهجایش p90 را گزارش میکند.
5. **اگر ناگهان همهی سناریوها خطا گرفتند، اول infra را چک کن:** در تست محلی، خاموش شدن PostgreSQL باعث ۵۰۳ `DB_UNAVAILABLE` روی لاگینها و ۴۰۱ آبشاری روی search/dashboard شد — نه باگ اسکریپت. همیشه اول `curl /api/health` را ببین.
6. **اگر run طولانیتر از TTL سشن (۷ روز) باشد:** متغیر searchAuthed در VU میماند ولی توکن منقضی میشود و search ها تا ابد 401 میگیرند. برای run های کوتاه بیربط است؛ اگر روزی LOAD_DURATION از TTL سشن بیشتر شد، روی 401 دوباره login کن.

**معیار قبول:** همه گیتهای جدول ۴.۴ پاس؛ نتیجه در `/dashboard/ops` (و آرشیو `/dashboard/ops/archive`) ذخیره شده.

---

## گام ۵ — Backup & Restore drill (۱ ساعت)

اسکریپت آماده است: `scripts/backup-db.sh` (`pg_dump | gzip` با retention ۳۰ روزه).

### ۵.۱ بکاپ واقعی

```bash
# از ترمینال محلی (یا داخل سرور) — DATABASE_URL باید ست باشد
cd E:/Desktop/ZCodeProject
export DATABASE_URL="postgresql://...?sslmode=require"   # یا از .env
./scripts/backup-db.sh
# → Backup saved to: ./backups/backup_YYYYMMDD_HHMMSS.sql.gz
```

> 💡 روی ویندوز، `pg_dump` باید در PATH باشد. اگر پستگرس portable است:
> `export PATH="/c/pgsql16/pgsql/bin:$PATH"` قبل از اجرا.

### ۵.۲ تمرین Restore (به دیتابیس جدا — نه production!)

> ⚠️ **اصلاح نسبت به scale-to-large.md:** اسکریپت خروجی `.sql.gz` (دستور SQL خام) میدهد، نه `.dump` — پس restore با `psql` است، نه `pg_restore`.
> 💡 دستورهای `psql`/`createdb` بهصورت تعاملی رمز میپرسند و در اجرای غیرتعاملی hang میکنند — اول `PGPASSWORD` را بده:

```bash
# ۰. رمز را برای دستورهای psql غیرتعاملی کن (همان رمز postgres)
export PGPASSWORD=postgres

# ۱. دیتابیس تست بساز
createdb -U postgres baseerno_restore_test

# ۲. بازیابی از بکاپ
gunzip -c backups/backup_<latest>.sql.gz | psql -U postgres -d baseerno_restore_test

# ۳. تأیید — شمارش باید با production برابر باشد
psql -U postgres -d baseerno_restore_test -c 'select count(*) from "Course";'
psql -U postgres -d baseerno_restore_test -c 'select count(*) from "Payment";'

# ۴. پاکسازی
dropdb -U postgres baseerno_restore_test
```

### ۵.۳ زمانبندی

- **محلی/VPS:** `crontab -e` → `0 2 * * * /path/to/scripts/backup-db.sh`
- **CI اختیاری:** یک job ی ماهانه در `.github/workflows/` برای drill خودکار.

**معیار قبول:** restore بدون خطا؛ شمارش ردیفها با production برابر.

---

## گام ۶ — گیت نهایی «Large واقعی» (۳۰ دقیقه)

| معیار | وضعیت لازم |
|---|---|
| سه سرویس در Railway بالا | ☐ |
| `/api/health` سبز (db, redis, search) | ☐ |
| k6 با ۵۰ VU: همه گیتهای جدول ۴.۴ پاس | ☐ |
| هدرهای Cache-Control درست | ☐ |
| restore drill بدون خطا | ☐ |
| Meilisearch index با غلطیابی فارسی | ☐ |
| worker ایمیل با backoff و locking | ☐ |

**همه ۷ مورد سبز = سایت در ردهی Large.** سپس ۱ هفته مشاهده (Sentry + متریک Ops) برای تثبیت.

---

## گام ۷ (اختیاری) — Read Replica واقعی (۱-۲ ساعت)

کد آماده است: `runOnReplica()` در `src/lib/db/replica.ts` — کوئریهای سنگین reports/dashboard به replica میروند و در خطا به primary fallback میکنند.

1. در Railway → منابع Postgres → **Create Replica**.
2. `REPLICA_URL=<replica connection string>` در سرویس `web` (نام متغیر از `env.ts`/`replica.ts` تأیید شد — `DATABASE_REPLICA_URL` نسخهی قدیمی است).
3. اثبات:
   ```bash
   npm run drill:replica
   # → ✅ Fallback verified — replica failed, query re-ran on primary
   ```
   و بعد از یک خرید، گزارش dashboard ظرف چند ثانیه آپدیت شود (replication lag).

**معیار قبول:** گزارشها روی replica اجرا میشوند؛ اگر replica down باشد، بدون 500 به primary fallback میکند (تست `replica.test.ts` پوشش میدهد).

---

## Rollback (اگر چیزی خراب شد)

| مشکل | اقدام |
|---|---|
| نسخه بد web | `railway rollback --service web` |
| ایندکس میلیسرچ خراب | `npm run seed:search` (بازسازی کامل) |
| worker خراب | ریستارت خودکار (ON_FAILURE)؛ صف در Postgres میماند |
| replica از کار افتاد | کد به primary fallback میکند (تستشده) |
| بازگشت کامل به تک-سرویسه | `git revert` تغییرات railway.toml |

---

**آمادگی:** همه اسکریپتها و فایلهای پیکربندی (railway.toml، Procfile، vercel.json، backup-db.sh، k6-script.js، seed-meilisearch.ts، verify-search.ts) از قبل در ریپو هستند — هیچ کار کدنویسی در این برنامه نیست، فقط اجرا و ست کردن.
