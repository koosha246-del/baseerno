# راهنمای Deploy به Railway

## مرحله ۱: Push به GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## مرحله ۲: Deploy در Railway

1. به https://railway.app بروید
2. با GitHub لاگین کنید
3. **New Project** → **Deploy from GitHub repo**
4. ریپازیتوری رو انتخاب کنید
5. Railway خودش Next.js رو تشخیص میده

## مرحله ۳: تنظیم متغیرهای محیطی

در Railway → Variables، این متغیرها رو اضافه کنید:

```
DATABASE_URL=postgresql://neondb_owner:npg_YS1BPt6WUlEc@ep-sparkling-cake-asht2ae2.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require

JWT_SECRET=یک-رشته-تصادفی-طولانی-اینجا-بنویسید-حداقل-32-کاراکتر

CLOUDINARY_CLOUD_NAME=yllr9quk
CLOUDINARY_API_KEY=689794323417558
CLOUDINARY_API_SECRET=r1TNSe9BCHTYcfqgJ4sfN7S2ssc

RESEND_API_KEY=re_JxNC4zUe_PSNhzCte7fMoYbEzVQEtg5AL

PAYMENT_SIGNATURE_SECRET=یک-رشته-تصادفی-دیگر-اینجا-بنویسید

SENTRY_DSN=https://5d340222c406560247c4ba36c29bd950@o4511717107433472.ingest.us.sentry.io/4511717116936192

NEXT_PUBLIC_GA_ID=G-QR2KE4HB3F
```

## مرحله ۴: تنظیم دامنه

1. در Railway → Settings → Domains
2. **Custom Domain** → `baseerno.ir`
3. DNS رو تنظیم کنید:
   - Type: CNAME
   - Name: @
   - Value: Railway بهتون میده

## مرحله ۵: Build Command

در Railway → Settings → Build:
```
npx prisma generate && npm run build
```

## مرحله ۶: Start Command

در Railway → Settings → Deploy:
```
npm start
```

## مرحله ۷: Migration

بعد از اولین deploy، در Railway → Settings → Deploy → Run Command:
```
npx prisma db push
```

## مشکلات رایج

**Build failed?**
- مطمئن بشید تمام متغیرهای محیطی تنظیم شدن
- لاگ‌ها رو بررسی کنید

**Database connection failed?**
- DATABASE_URL رو بررسی کنید
- sslmode=require باشه

**502 Error?**
- PORT تنظیم نشده (Railway خودش تنظیم می‌کنه)
- Start command اشتباهه
