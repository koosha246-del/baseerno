# راهنمای Deploy به Railway

پروژه با **یک سرویس Docker** روی Railway اجرا میشود (تعریفشده در
`railway.json`):

| سرویس | نقش | Start Command |
|---|---|---|
| `web` | برنامه Next.js (Standalone) | `node server.js` (از داخل Dockerfile) |

> ⚠️ پیکربندی از `railway.json` خوانده میشود و builder آن `DOCKERFILE` است.
> فایل `railway.toml` (چند-سرویسه قدیمی) حذف شد چون نام سرویسهای آن
> (`web`/`worker`/`meili`) با سرویس واقعی پروژه در Railway یکی نبود و
> Railway تنظیمات را روی سرویس اصلی اعمال نمیکرد.

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
3. Railway با خواندن `railway.json` و `Dockerfile` یک سرویس `web` میسازد.
   (سرویسهای `worker` و `meili` فعلاً غیرفعال هستند؛ در صورت نیاز جداگانه
   اضافه میشوند.)

## مرحله ۳: تنظیم متغیرهای محیطی

در سرویس `web` → Variables:

```
DATABASE_URL=postgresql://...?sslmode=require
# برای جدا کردن کوئریهای سنگین از دیتابیس اصلی (اختیاری):
REPLICA_URL=postgresql://...?sslmode=require

JWT_SECRET=یک-رشته-تصادفی-طولانی-حداقل-32-کاراکتر
PAYMENT_SIGNATURE_SECRET=یک-رشته-تصادفی-دیگر

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

RESEND_API_KEY=...
SENTRY_DSN=...
NEXT_PUBLIC_GA_ID=...
NEXT_PUBLIC_SITE_URL=https://baseerno.ir

# جستجو (اختیاری):
SEARCH_HOST=https://<meili-service>.up.railway.app
SEARCH_API_KEY=<همان MEILI_MASTER_KEY>
```

> **مهم — متغیرهای build-time:** Railway متغیرهای سرویس را در زمان build فقط
> وقتی به Dockerfile تزریق میکند که با `ARG` اعلان شده باشند. چون `next build`
> هنگام «Collecting page data» ماژولهای route را اجرا میکند و `env.ts` در
> production روی `DATABASE_URL`، `JWT_SECRET` و `PAYMENT_SIGNATURE_SECRET`
> fail-fast است، این سه (بهعلاوه `NEXT_PUBLIC_SITE_URL` که در client bundle
> درونریزی میشود) باید در Dockerfile به صورت `ARG`/`ENV` اعلان شده باشند —
> الان این کار در Dockerfile انجام شده، پس فقط کافی است مقادیر در Variables
> ست باشند.

## مرحله ۴: دامنه

1. Railway → سرویس `web` → Settings → Domains → **Custom Domain** → `baseerno.ir`
2. DNS: `CNAME @` → مقدار دادهشده توسط Railway.

## مرحله ۵: Build و Start

Build به صورت خودکار با `Dockerfile` انجام میشود:

```
# داخل Dockerfile (نیازی به تنظیم دستی نیست)
npm ci && npx prisma generate && npm run build
```

Start Command از CMD داخل Dockerfile میآید:
```
node server.js
```

Healthcheck سرویس روی `/` است.

## مرحله ۶: Migration

بعد از اولین deploy، Migration را **از روی سیستم خودتان** با Railway CLI اجرا کنید
(در داخل کانتینر تصویر standalone ابزار prisma CLI وجود ندارد):

```bash
railway run npx prisma db push
```

یا با `npx prisma migrate deploy` از روی پروژه محلی که `DATABASE_URL` تنظیم شده.

## مشکلات رایج

**Build failed?**
- همه متغیرهای محیطی ست شده باشند؛ لاگها را بررسی کنید (`railway logs --service baseerno`).
- اگر خطای «Invalid production environment» در build دیدید: متغیرها در
  Variables ست شدهاند ولی احتمالاً مشکل build-time بوده — Dockerfile را با
  بخش `ARG` مقایسه کنید.
- اگر خطای «Cannot find module» / «Type error» در build دیدید: نوع خطا از
  پکیجهای جاافتاده است (مثل `jest-axe` که `@types/jest-axe` میخواهد).

**Database connection failed?**
- `DATABASE_URL` و `sslmode=require` را بررسی کنید.

**502 در web؟**
- Start command و Healthcheck `/` را بررسی کنید.

**ایمیل ارسال نمیشود؟**
- `RESEND_API_KEY` در سرویس تنظیم باشد؛ لاگها را ببینید.
- Rows ی `processing` گیرکرده بعد از ۱۰ دقیقه خودکار به `pending` برمیگردند.

> اگر بعداً سرویس `worker` را اضافه کردید: `env.ts` در حالت production
> علاوه بر `DATABASE_URL` و `RESEND_API_KEY` به `JWT_SECRET` و
> `PAYMENT_SIGNATURE_SECRET` هم نیاز دارد؛ بدون آنها worker هنگام شروع
> crash-loop میکند.
