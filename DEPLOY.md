# راهنمای Deploy سایت بصیر نو

## ۱. تنظیم API Keys

### Cloudinary (آپلود فایل)
1. به https://cloudinary.com بروید
2. ثبت‌نام کنید
3. از Dashboard، مقادیر زیر رو کپی کنید:
   - Cloud Name
   - API Key
   - API Secret

### Resend (ایمیل)
1. به https://resend.com بروید
2. ثبت‌نام کنید
3. از API Keys، یک key جدید بسازید

### PostgreSQL (دیتابیس)
گزینه‌ها:
- **Neon** (رایگان): https://neon.tech
- **Supabase** (رایگان): https://supabase.com
- **Railway**: https://railway.app

## ۲. Deploy به Vercel

```bash
# نصب Vercel CLI
npm i -g vercel

# لاگین
vercel login

# Deploy
vercel

# تنظیم متغیرهای محیطی
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add CLOUDINARY_CLOUD_NAME
vercel env add CLOUDINARY_API_KEY
vercel env add CLOUDINARY_API_SECRET
vercel env add RESEND_API_KEY
vercel env add PAYMENT_SIGNATURE_SECRET

# Deploy نهایی
vercel --prod
```

## ۳. تنظیم دامنه

```bash
vercel domains add baseerno.ir
```

## ۴. Migration دیتابیس

بعد از تنظیم DATABASE_URL:

```bash
npx prisma migrate deploy
npx prisma db seed
```

## ۵. متغیرهای محیطی مورد نیاز

| متغیر | توضیح |
|-------|-------|
| `DATABASE_URL` | رشته اتصال PostgreSQL |
| `JWT_SECRET` | رشته تصادفی 32+ کاراکتر |
| `CLOUDINARY_CLOUD_NAME` | نام ابر Cloudinary |
| `CLOUDINARY_API_KEY` | کلید API Cloudinary |
| `CLOUDINARY_API_SECRET` | رمز API Cloudinary |
| `RESEND_API_KEY` | کلید API Resend |
| `PAYMENT_SIGNATURE_SECRET` | رشته تصادفی برای امضای پرداخت |
