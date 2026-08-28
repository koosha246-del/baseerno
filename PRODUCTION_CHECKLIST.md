# ✅ چک‌لیست Production — بصیر نو

میزبان انتخابی: **Railway (Docker)** · برند رسمی: **بصیر نو**

---

## ۱) Secrets و Environment Variables

تولید خودکار:

```bash
node scripts/generate-secrets.mjs   # خروجی → ترمینال + .env.secrets
```

در Railway برای سرویس `app` و `worker` این متغیرها را ست کن:

| متغیر | الزام | توضیح |
|-------|-------|-------|
| `JWT_SECRET` | 🔴 اجباری | ≥32 کاراکتر — از اسکریپت بالا |
| `PAYMENT_SIGNATURE_SECRET` | 🔴 اجباری | ≥16 کاراکتر — امضای callback درگاه |
| `CRON_SECRET` | 🔴 اجباری | توکن Bearer برای `/api/cron/*` |
| `DATABASE_URL` | 🔴 اجباری | از پلاگین Postgres Railway (اگر pooled بود، `DIRECT_URL` جدا بده) |
| `NEXT_PUBLIC_SITE_URL` | 🔴 اجباری | مثلا `https://baseerno.ir` |
| `RESEND_API_KEY` | 🟡 مهم | بدون آن ایمیل صف می‌شود ولی ارسال نمی‌شود |
| `ZARINPAL_MERCHANT_ID` | 🟡 پرداخت | بدون آن checkout فقط حالت شبیه‌سازی dev |
| `ZARINPAL_SANDBOX=false` | 🟡 پرداخت واقعی | |
| `SENTRY_DSN` | 🟢 مانیتورینگ | بخش ۵ |
| `REDIS_URL` | 🟢 پیشنهادی | rate-limit و کش بین دو instance |
| `SEARCH_HOST` / `SEARCH_API_KEY` | 🟢 اختیاری | اگر Meilisearch اضافه کردی |
| `AI_API_KEY` / `AI_MODEL` | 🟢 اختیاری | تور هوش مصنوعی واقعی |
| `EMAIL_FROM` | 🟢 اختیاری | پیش‌فرض: `بصیر نو <noreply@baseerno.ir>` |

> هرگز `DEMO_MODE=true` در production — گارد env جلوی آن را می‌گیرد ولی مطمئن شو.

---

## ۲) دیپلوی روی Railway

سرویس‌ها (به همین ترتیب):

1. **Postgres** — پلاگین Railway؛ نسخه ۱۶+
2. **App** — Deploy from GitHub repo → Dockerfile detected خودکار
   - Healthcheck path: `/` (فایل railway.json موجود)
   - بعد از اولین deploy یک‌بار: `npx prisma migrate deploy && npx prisma db seed` (از Railway shell)
3. **Worker** — همان ریپو با `Dockerfile.worker`
   - Start command: `npm run worker:email`
   - همان `DATABASE_URL`, `JWT_SECRET`, `PAYMENT_SIGNATURE_SECRET`, `RESEND_API_KEY`
4. **(اختیاری) Meilisearch** — Docker image `getmeili/meilisearch:v1.13` + `MEILI_MASTER_KEY`
5. **Cron** — چون Railway cron مدیریت‌شده ندارد، از cron-job.org یا GitHub Actions schedule:
   ```
   */5 * * * *  →  curl -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/email
   0 */6 * * *  →  curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/search-sync
   ```

دامنه: Settings → Networking → Custom Domain → رکورد CNAME نزد ثبت‌کننده دامنه.

---

## ۳) ایمیل (Resend)

1. حساب Resend → Domains → Add `baseerno.ir`
2. این رکوردهای DNS را نزد ثبت‌کننده اضافه کن (مقادیر را Resend می‌دهد):
   - `TXT` SPF: `v=spf1 include:resend.com ~all` (یا merge با SPF موجود)
   - سه رکورد `CNAME` DKIM
   - `TXT` DMARC پیشنهادی: `v=DMARC1; p=none; rua=mailto:you@baseerno.ir`
3. صبر تا Verified شدن → `RESEND_API_KEY` (api key production) را در Railway بگذار
4. تست: فراموشی رمز → ایمیل برسد و در Inbox نه Spam

---

## ۴) محتوای واقعی

- [ ] ورود با اکانت ADMIN → `/dashboard/content` → ساخت دوره‌های واقعی + درس‌ها با **لینک ویدیوی معتبر** (Aparat embed یا https مستقیم)
- [ ] حذف/ویرایش دوره‌های seed پس از ورود محتوای اصلی (`prisma/seed.ts`)
- [ ] کتابخانه: فعلاً دانلود = اسکن JPG موجود در `public/library/*.jpg` ✓ کار می‌کند؛ وقتی PDF نهایی آماه شد فایل را جایگزین کن و مسیر `file` را به `.pdf` تغییر بده (route از قبل PDF را با content-type درست سرو می‌کند)
- [ ] متن صفحه terms/privacy را بازخوانی کن

---

## ۵) مانیتورینگ

1. Sentry.io → پروژه Next.js بساز → DSN کپی → `SENTRY_DSN` در Railway
2. UptimeRobot (رایگان) → monitor روی `https://<domain>/api/health` هر ۵ دقیقه
3. بعد از چند روز: `/dashboard/ops` را چک کن (SLO، کندترین کوئری‌ها، صف ایمیل)

---

## ۶) پرداخت واقعی (Zarinpal)

1. پنل زرین‌پال → درخواست مرچنت IPG/ZarinGate
2. `ZARINPAL_MERCHANT_ID` را ست کن، `ZARINPAL_SANDBOX=false`
3. تست end-to-end با مبلغ کم:
   - checkout → درگاه → برگشت به `/api/checkout/callback` → redirect به `/dashboard/courses?enrolled=true`
   - بررسی: نوتیفیکیشن «پرداخت موفق» + ایمیل تأیید + ردیف در finance

---

## ۷) چک‌لیست Smoke پس از دیپلوی

```bash
# سلامت
curl https://<domain>/api/health

# Cron (باید {"ok":true} بدهد نه 401)
curl -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/email

# ثبت‌نام لندینگ → زنگ ادمین باید نوتیفیکیشن بگیرد
# ورود demo نیست! با اکانت واقعی admin وارد شو
```

- [ ] لاگین/ثبت‌نام واقعی + تغییر رمز
- [ ] خرید آزمایشی زرین‌پال (بند ۶)
- [ ] دانلود یک کتاب کتابخانه با توکن
- [ ] چت AI (mock یا واقعی)
- [ ] موبایل: منو، شروع دوره، پخش ویدیو

---

## ۸) نگهداری هفتگی

- [ ] `scripts/backup-db.sh` را با Railway cron یا GitHub Action روزانه اجرا کن و خروجی را در S3/Drive بریز
- [ ] ماهانه یکبار `drill-backup-restore.sh` (تست بازگردانی واقعی)
- [ ] قبل از کمپین‌ها: `npx k6 run scripts/load/k6-script.js`
