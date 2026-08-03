# راهنمای Deploy به Railway (چند-سرویسه)

از این به بعد پروژه با **سه سرویس مستقل** روی Railway اجرا میشود
(تعریفشده در `railway.toml`):

| سرویس | نقش | Start Command |
|---|---|---|
| `web` | برنامه Next.js | `npm start` |
| `worker` | صف ایمیل (پردازش EmailOutbox) | `npm run worker:email` |
| `meili` | Meilisearch (جستجوی فارسی) | تصویر رسمی |

> ⚠️ `railway.toml` اولویت دارد؛ فایل قدیمی `railway.json` دیگر استفاده
> نمیشود و قابل حذف است. Build Command ها از الان داخل `railway.toml`
> هستند (web: `npx prisma generate && npm run build` — worker فقط
> `npx prisma generate` چون Next را build نمیکند).
>
> ⚠️ متغیرهای محیطی را نمیتوان داخل `railway.toml` تعریف کرد — باید در
> داشبورد (Service → Variables) یا با `railway variables set` ست شوند.

## مرحله ۱: Push به GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## مرحله ۲: Deploy در Railway

1. به https://railway.app بروید و با GitHub لاگین کنید.
2. **New Project** → **Deploy from GitHub repo** → ریپازیتوری را انتخاب کنید.
3. Railway با خواندن `railway.toml` سه سرویس `web`، `worker` و `meili`
   را میسازد (سرویس meili از تصویر Docker رسمی بالا میآید).

> ترتیب مهم: اول پروژه را بساز، بعد (در صورت نیاز) `railway link` بزن.

## مرحله ۳: تنظیم متغیرهای محیطی

در هر سرویس → Variables:

**سرویس `web`:**

```
DATABASE_URL=postgresql://...?sslmode=require
# برای جدا کردن کوئریهای سنگین از دیتابیس اصلی (اختیاری):
REPLICA_URL=postgresql://...?sslmode=require

JWT_SECRET=یک-رشته-تصادفی-طولانی-حداقل-32-کاراکتر
PAYMENT_SIGNATURE_SECRET=یک-رشته-تصادفی-دیگر
CRON_SECRET=یک-رشته-تصادفی-دیگر-برای-کرون-ها

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

RESEND_API_KEY=...
SENTRY_DSN=...
NEXT_PUBLIC_GA_ID=...
NEXT_PUBLIC_SITE_URL=https://baseerno.ir

# جستجو (آدرس داخلی سرویس meili در Railway):
SEARCH_HOST=https://<meili-service>.up.railway.app
SEARCH_API_KEY=<همان MEILI_MASTER_KEY>

# (اختیاری) Redis برای rate limit و کش اشتراکی:
REDIS_URL=redis://... یا rediss://...
```

**سرویس `worker`:**

> ⚠️ **مهم:** worker بهصورت غیرمستقیم `env.ts` را import میکند
> (`email-queue → prisma-client → env`). `env.ts` در production به
> `DATABASE_URL`، `JWT_SECRET` (≥۳۲ کاراکتر) و `PAYMENT_SIGNATURE_SECRET`
> (≥۱۶ کاراکتر) نیاز دارد و در نبودشان **همان اول startup کرش میکند**.
> پس این سه متغیر برای worker هم الزامی است، حتی اگر خودش مستقیم از
> JWT استفاده نکند:

```
DATABASE_URL=postgresql://...?sslmode=require
JWT_SECRET=همان-مقدار-web
PAYMENT_SIGNATURE_SECRET=همان-مقدار-web
RESEND_API_KEY=...
```

**سرویس `meili`:**

```
MEILI_MASTER_KEY=<یک-کلید-تصادفی-حداقل-16-کاراکتر>
MEILI_ENV=production
```

## مرحله ۴: دامنه

1. Railway → سرویس `web` → Settings → Domains → **Custom Domain** → `baseerno.ir`
2. DNS: `CNAME @` → مقدار دادهشده توسط Railway.
3. برای سرویس `meili` هم یک دامنه بگیر (Generate Domain) — همان میشود `SEARCH_HOST`.

## مرحله ۵: Build و Start

Build Command ها از `railway.toml` میآیند — نیازی به تنظیم دستی نیست:
- `web` → `npx prisma generate && npm run build` سپس `npm start`
- `worker` → فقط `npx prisma generate` سپس `npm run worker:email`
- healthcheck ی `web` روی `/api/health` و healthcheck ی `meili` روی `/health` است.

## مرحله ۶: Migration و Seed جستجو

بعد از اولین deploy، migration ها را اعمال کن — در Railway → سرویس `web`
→ Deploy → **Run Command** (یا محلی: `railway run --service web npx prisma migrate deploy`):

```bash
npx prisma migrate deploy
npm run db:seed          # فقط اگر دادهی نمونه میخواهی
```

سپس جستجو را ایندکس کنید (وقتی meili بالا آمد):

```bash
npm run seed:search
```

یا از داخل ادمین: `POST /api/admin/search-sync`.

## مشکلات رایج

**Build failed?**
- همه متغیرهای محیطی تنظیم شده باشند؛ لاگها را بررسی کنید.
- `next build` به `NEXT_PUBLIC_*` در زمان build نیاز دارد — آنها را قبل از اولین build ست کنید.

**worker در startup کرش میکند؟**
- `JWT_SECRET` و `PAYMENT_SIGNATURE_SECRET` را در سرویس worker ست کنید
  (شرط سخت `env.ts` در production — رجوع به مرحله ۳).

**Database connection failed?**
- `DATABASE_URL` و `sslmode=require` را بررسی کنید.

**502 در web اما worker سالم؟**
- Start command و Healthcheck `/api/health` را بررسی کنید.

**جستجو جواب نمیدهد؟**
- `SEARCH_HOST`/`SEARCH_API_KEY` در web با `MEILI_MASTER_KEY` در meili یکی باشد.
- `npm run verify:search:index` را روی پروژه محلی اجرا کنید تا ایندکس سالم باشد.

**ایمیل ارسال نمیشود؟**
- `RESEND_API_KEY` در worker تنظیم باشد؛ لاگهای worker را ببینید.
- Rows ی `processing` گیرکرده بعد از ۱۰ دقیقه خودکار به `pending` برمیگردند.
