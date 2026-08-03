# معماری: مونولیت ماژولار

این سند نقشه معماری «بصیر نو» را در سطح مقیاس L توصیف میکند: مرزهای ماژول، پترن
UseCase + Event Bus، قرارداد مسیرهای API و نقشه جداسازی به میکروسرویس.

## ۱. لایهها و مرزهای import

مرزهای زیر با `npm run check:boundaries` (اسکریپت `scripts/check-boundaries.mjs`)
بهصورت مکانیکی اجرا میشوند — هر تخلف، CI را قرمز میکند.

| از ↓ به ← | `src/app` | `src/features` | `src/lib` | `src/components` |
|---|---|---|---|---|
| `src/app` | ✅ | ❌ | ✅ | ✅ |
| `src/features` | ❌ | ❌ (فقط از طریق پروتکل/رویداد) | ✅ | ✅ |
| `src/lib` | ❌ | ❌ | ✅ | ❌ |
| `src/components` | ✅ (نقطه ورود) | ❌ | ✅ | ✅ |

قواعد کلیدی:

1. **`src/app` (لایه تحویل)** — صفحات و route handler ها. صفحات composition را خودشان
   انجام میدهند؛ هرگز از `src/features` import نمیکنند (داده از طریق props/useCase میآید).
2. **`src/features` (ماژولهای UI)** — هر ماژول (courses، dashboard، ai، ...) کاملاً مستقل
   است و نباید به داخل ماژول *دیگر* import بزند؛ ارتباط بین ماژولها فقط از طریق
   `src/lib` (useCase/رویداد) است. (import داخل خودِ یک ماژول — مثلاً `components/` به
   `constants/` — آزاد است و اسکریپت آن را نقض محسوب نمیکند.)
3. **`src/lib` (هسته)** — تمام منطق تجاری (useCases)، Event Bus، repository ها و ابزارها.
   هرگز از `app` یا `features` import نمیکند — این تضمین میکند هسته قابل تست و
   قابل جداسازی است.
4. **`src/components` (UI اشتراکی)** — فقط کامپوننتهای خنثی؛ وابستگی به features ندارند.

## ۲. الگوی route handler

هر route API از یک قالب ثابت پیروی میکند (اکثر route ها زیر ۳۰ خط):

```
CSRF check → parse (await req.json()) → validate (zod) → useCase → useCaseToResponse
```

- Route ها **هرگز مستقیم repository صدا نمیزنند** — فقط از طریق useCase.
- Side-effect ها (نوتیفیکیشن، ایمیل، invalidation کش، جستجو) را useCase صدا نمیزند؛
  **رویداد publish میکند** و Event Bus انجام میدهد.

## ۳. Event Bus (`src/lib/events.ts`)

مسیر یکپارچه همه side-effect ها. رویدادهای فعلی:

- `user:registered`, `user:login`, `user:password-reset`, `user:profile-updated`
- `enrollment:completed`, `enrollment:free`
- `grade:posted`, `message:sent`, `certificate:issued`, `payment:created`
- `course:updated`, `course:lessons-changed`
- `search:needs-sync`

Handler های داخلی: invalidation کش (`revalidateTag` + Redis)، نوتیفیکیشن، ایمیل،
استریم real-time (SSE)، ثبت AuditLog، همگامسازی جستجو.

قانون: **Event Bus هرگز useCase را import نمیکند** — فقط رویدادها و side-effect ها.

## ۴. ساختار دامنهها (`src/lib/db/domains/`)

هر دامنه یک repository مستقل دارد: `users`, `courses`, `enrollments`, `payments`,
`messages`, `notifications`, `grades`, `search`, `ai`, `audit` (+ `replica` و `queries`).

## ۵. قرارداد مسیرهای API

نسخهبندی فعلی route های بدون پیشوند `/api/v1` هستند (نسخه ۱ ضمنی). برای سازگاری
آینده، همه endpoint های جدید باید فقط **افزوده** شوند نه تغییر. فهرست کامل در
`docs/api.md`.

## ۶. نقشه جداسازی به میکروسرویس

هر ماژول زیر با برداشتن وابستگیهای مستقیم قابل جداسازی است (مرزهای فعلی از قبل
انتخاب محل برش را نشان میدهند):

| سرویس پیشنهادی | ماژول فعلی | وابستگی به هسته |
|---|---|---|
| **auth** | `src/lib/useCases/auth` + `src/lib/auth` | none — کاملاً مستقل |
| **catalog** | `src/lib/db/domains/courses` + `search` | Event Bus (رویداد course:updated) |
| **billing** | `enrollments` + `payments` + `payment-signature` | none — webhook محور |
| **messaging** | `messages` + `notifications` | Event Bus + realtime |
| **ai-assistant** | `src/lib/useCases/ai` + `src/lib/ai` | none — HTTP به LLM |
| **email** | `src/lib/email-queue` + `worker/` | فقط جدول EmailOutbox (Postgres مشترک یا queue جدا) |
| **search** | `src/lib/search` + `src/lib/db/domains/search` | رویداد search:needs-sync |

نکته: همه اینها در حال حاضر در یک مونولیت با مرزهای سخت زندگی میکنند — جداسازی
بعداً «بریدن» است نه «بازنویسی».

## ۷. تصمیمهای معماری ثبتشده

- **Cache**: دو لایه — Redis (`getOrSet` با TTL) + کش Next.js (`unstable_cache` با تگ).
  همه mutation ها از `invalidateCache(publishedCoursesCacheKeys(), tags)` استفاده میکنند.
- **Real-time**: SSE از طریق `src/lib/realtime.ts` با fallback به polling در کلاینت.
- **Observability**: لاگ ساختاریافته (`src/lib/log.ts`) + متریک (`src/lib/metrics.ts`)
  + `/api/health` و `/api/metrics` (Admin-only).
- **هویت ۲ لایه**: JWT + TOTP اختیاری برای ADMIN (`src/lib/security/totp.ts`).
- **امنیت**: CSP با nonce، CSRF برای همه mutation ها، rate limit با preset ها، AuditLog.
