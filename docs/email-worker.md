# 📧 راهاندازی Worker ایمیل (Email Outbox)

> تاریخ: ۱۴۰۵/۰۵/۰۲

## خلاصه معماری

ایمیلهای تراکنشی (خوشآمد، تأیید پرداخت، بازیابی رمز، فرم تماس) بهجای ارسال
همزمان در طول ریکوئست، ابتدا در جدول `EmailOutbox` در PostgreSQL ذخیره میشوند
(`status = pending`) و بعد توسط یک **worker** ارسال میشوند.

- صف: `src/lib/email-queue.ts` — `enqueueEmail()`, `processEmailQueue()`, `cleanEmailQueue()`
- Worker بلندمدت: `worker/email-worker.ts` (poll هر ۱۰ ثانیه)
- Cron endpoint: `src/app/api/cron/email/route.ts`
- Retry: حداکثر ۳ بار با exponential backoff (۳۰ ثانیه → ۲ دقیقه → ۸ دقیقه)

## گزینه ۱: Vercel (پیشنهادی — بدون سرور جدا)

### 1. Cron Job

در `vercel.json` این را اضافه کنید:

```json
{
  "crons": [
    { "path": "/api/cron/email", "schedule": "*/5 * * * *" }
  ]
}
```

> در پلن Hobby، Vercel هر روز یک cron اجازه میدهد (حداکثر ۲ بار در روز).
> برای اجرای هر ۵ دقیقه، پلن Pro لازم است.

### 2. Secret

متغیر محیطی `CRON_SECRET` را در Vercel بسازید (یک رشته تصادفی):

```bash
openssl rand -base64 32
```

در Dashboard پروژه → Settings → Environment Variables اضافه کنید.

### 3. محافظت endpoint

برای تست دستی، هدر `x-cron-secret` را بفرستید:

```bash
curl -X GET https://your-site.vercel.app/api/cron/email \
  -H "x-cron-secret: <CRON_SECRET>"
```

### 4. محدودیت

در پلن Hobby، حداکثر **۱ cron در روز** و **حداکثر ۱۰۰ ایمیل در روز** توسط Resend
(پلن رایگان). اگر ایمیل روزانه > ۱۰۰ است، گزینه ۲ (VPS) را انتخاب کنید.

## گزینه ۲: VPS (Worker جدا — برای مقیاس بزرگتر)

### 2.1 با Procfile (اگر با Heroku/Railway دیپلوی میکنید)

```yaml
web: npm start
worker: npx tsx worker/email-worker.ts
```

Railway: `railway.json` را بهروز کنید:

```json
{
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "numReplicas": 1,
    "startCommand": "npm start"
  }
}
```

و یک سرویس جدا برای worker بسازید (`railway up` با `worker` شروع کنید).

### 2.2 با systemd (اگر روی VPS مستقیم هستید)

فایل `/etc/systemd/system/baseerno-worker.service`:

```ini
[Unit]
Description=Baseer No Email Worker
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/baseerno
ExecStart=/usr/bin/npm run worker:email
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/var/www/baseerno/.env

[Install]
WantedBy=multi-user.target
```

فعالسازی:

```bash
sudo systemctl daemon-reload
sudo systemctl enable baseerno-worker
sudo systemctl start baseerno-worker
sudo systemctl status baseerno-worker
```

### 2.3 با docker-compose (اگر Docker دارید)

```yaml
services:
  app:
    build: .
    command: npm start
    # ... (بقیه تنظیمات مثل قبل)
  worker:
    build: .
    command: npx tsx worker/email-worker.ts
    restart: unless-stopped
    environment:
      DATABASE_URL: ${DATABASE_URL}
      RESEND_API_KEY: ${RESEND_API_KEY}
      NEXT_PUBLIC_SITE_URL: ${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}
```

## جدول مقایسه گزینهها

| معیار | Vercel Cron | VPS + systemd | docker-compose |
|---|---|---|---|
| هزینه | رایگان (Hobby: 1/day) | $10–15/ماه | $10–15/ماه |
| تأخیر | تا ۵ دقیقه (بسته به schedule) | ~۱۰ ثانیه | ~۱۰ ثانیه |
| پیچیدگی | کم | متوسط | متوسط |
| مقیاس | ۱۰۰ ایمیل/روز (Resend free) | نامحدود (با Resend paid) | نامحدود |

## عیبیابی

| مشکل | علت | راهحل |
|---|---|---|
| ایمیلها در صف میمانند (`status: pending`) | `RESEND_API_KEY` ست نیست | کلید را در env ست کنید؛ worker دفعه بعد میفرستد |
| `RESEND_API_KEY not set — skipping queue run` | خطای لاگ worker | کلید Resend را تنظیم کنید |
| ایمیلها `status: failed` با `lastError: Resend 429` | نرخ محدودیت Resend | backoff خودکار (۳۰s→۲min→۸min)؛ حجم را کم کنید |
| رکوردهای قدیمی جمع میشوند | cleanup خودکار | `cleanEmailQueue(30)` هر ۲۴ ساعت اجرا میشود |

## تست دستی صف

```bash
# 1. یک ایمیل به صف اضافه کنید (via API یا اسکریپت)
npx tsx -e "
import { enqueueEmail } from './src/lib/email-queue';
enqueueEmail({ to: 'you@example.com', subject: 'Test', html: '<p>hi</p>' });
"

# 2. worker را اجرا کنید
npm run worker:email

# 3. در دیتابیس بررسی کنید
npx prisma studio  # → جدول EmailOutbox → status باید sent شود
```