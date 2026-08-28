# معماری — بصیر نو (Baseer No)

مستند فنی برای توسعه‌دهندگان. اگر برای اولین بار کدبیس را بررسی می‌کنید، ابتدا [`README.md`](../README.md) را بخوانید — این مستند جزئیات معماری عمیق را پوشش می‌دهد.

---

## 1. استراتژی کش (Cache Strategy)

کش دو لایه‌ای: **Redis** (اشتراکی بین اینستنس‌ها) + **`unstable_cache`** Next.js (فول‌بک پینستنس). در عمل، کوئری‌ها از `getOrSet` استفاده می‌کنند:

```ts
import { getOrSet } from "@/lib/cache";
import { CACHE_KEYS, CACHE_TAGS } from "@/lib/cache-tags";

const courses = await getOrSet(
  CACHE_KEYS.publishedCoursesTake(8),
  300,  // TTL ثانیه
  async () => repository.listCourses({ publishedOnly: true, take: 8 }),
  [CACHE_TAGS.courses],  // برای revalidateTag
);
```

**چرخه حیات:**
1. خواندن → Redis hit؟ → برگرد JSON. نه → `unstable_cache` hit؟ → برگرد. نه → اجرای factory → ذخیره در هر دو.
2. نوشتن → `invalidateCache(keys, tags)` → حذف Redis + `revalidateTag` در Next.js.

**انواع کش:**
| لایه | کلید | TTL | الگوی انتقال |
|---|---|---|---|
| Redis | `cache:courses:published:8` | 300s | `getOrSet` + `invalidateCache` |
| Next.js `unstable_cache` | خودکار | 300s | `revalidateTag(tag)` |
| Edge CDN | HTTP `Cache-Control` | 300s | `publicPageCacheControl` در middleware |
| ISR | صفحه | 300s | `export const revalidate = 300` |

**نکته مهم:** کلیدهای Redis با پیشوند `cache:` ذخیره می‌شوند (داخل `getOrSet` اضافه می‌شود). تگ‌های Next.js با `CACHE_TAGS` ثابت هستند. لیست کامل در [`src/lib/cache-tags.ts`](../src/lib/cache-tags.ts).

**نام‌گذاری کلیدها:**
- `courses:published` — همه دوره‌های منتشر شده (بدون `take`)
- `courses:published:{n}` — n دوره اخیر
- `search:courses:*` — جستجوی دوره‌ها (با wildcard، توسط `invalidateSearchCourseCache` با `SCAN` پاک می‌شود)

---

## 2. الگوی سافت‌دلیت (Soft Delete)

هر مدلی که دارای `deletedAt DateTime?` است، توسط اکستنشن Prisma به‌صورت شفاف فیلتر می‌شود:

```ts
// src/lib/db/prisma-client.ts — اکستنشن $extends
export const prisma = extendWithSoftDelete(prismaRaw);
```

**رفتار:**
- `findMany` / `findFirst` / `count` → `deletedAt: null` به `where` اضافه می‌شود (مگر اینکه کاربر صراحتاً `deletedAt` را در `where` آورده باشد)
- `findUnique` / `findUniqueOrThrow` → فیلتر سمت کلاینت (چون Prisma اجازه اضافه کردن `where` سفارشی در `findUnique` را نمی‌دهد)
- `aggregate` / `groupBy` → فیلتر روی `where` + بازنویسی نتیجه
- مدل‌هایی بدون `deletedAt` (`EmailOutbox`, `CourseSearch`) بدون تغییر عبور می‌کنند

**دسترسی به رکوردهای حذف‌شده:**
```ts
// برای بازیابی یا کارهای ادمینی
const deleted = await prismaRaw.user.findMany({ where: { deletedAt: { not: null } } });
```

**مدل‌های پوشش‌داده شده:**
`User`, `Course`, `Enrollment`, `Grade`, `Certificate`, `Payment`, `Message`, `PasswordReset`, `Notification`, `Lesson`, `Conversation`, `ChatMessage`

**کار با ریپلیکا:** `extendWithSoftDelete` در [`src/lib/db/replica.ts`](../src/lib/db/replica.ts) روی کلاینت ریپلیکا هم اعمال می‌شود، تا خواندن‌های ریپلیکا دقیقاً مثل اصلی رفتار کنند.

---

## 3. ریپلیکای خواندنی (Read Replica)

```ts
// src/lib/db/replica.ts
import { runOnReplica } from "@/lib/db/replica";

const stats = await runOnReplica((db) => db.course.count());
```

**الگوی فول‌بک:**
1. `REPLICA_URL` تنظیم شده؟ → ساخت کلاینت (یکبار، کش شده در حافظه)
2. کوئری روی ریپلیکا → موفق؟ → برگرد نتیجه
3. خطا؟ → لاگ warning + اجرای مجدد روی `prisma` (اصلی)

**محدودیت‌ها:**
- فقط خواندن — هیچ write از این مسیر
- تأخیر همگام‌سازی چند ثانیه‌ای — داده‌های تازه نوشته شده کاربر را از اصلی بخوانید
- سشن UTC اعمال می‌شود (مثل اصلی) تا خواندن تایم‌استمپ بین ریپلیکا و اصلی همخوانی داشته باشد

**تزریق خطا در CI:** اسکریپت [`scripts/fault-inject-replica.ts`](../scripts/fault-inject-replica.ts) با `REPLICA_URL` مرده فول‌بک را تأیید می‌کند.

---

## 4. امنیت چندلایه

### 4.1 Content Security Policy (CSP)
```ts
// src/lib/security/csp.ts
// هر درخواست → nonce تازه → هدر CSP + فوروارد به `x-nonce`
// Next.js خودش nonce را به اسکریپت‌های اینلاین اعمال می‌کند
```
- **تولید:** `'self' 'nonce-<n>' 'strict-dynamic'` — بدون `'unsafe-inline'`
- **توسعه:** `'self' 'unsafe-inline' 'unsafe-eval'` (HMR و DevTools)
- میدلویر در [`src/middleware.ts`](../src/middleware.ts) هدر را ست می‌کند

### 4.2 CSRF
```ts
// src/lib/csrf.ts
// تولید: Origin/Referer را با ALLOWED_HOSTS مقایسه می‌کند
// توسعه: همه چیز pass-through
```

### 4.3 محدودیت نرخ (Rate Limiting)
```ts
// src/lib/rate-limit.ts — حافظه (توسعه/تک‌اینستنس)
// src/lib/rate-limit-redis.ts — Redis (تولید/چنداینستنس)
// Presets: AUTH, API, READ, SENSITIVE
```

### 4.4 سایر اقدامات
| لایه | پیاده‌سازی |
|---|---|
| JWT | `jsonwebtoken` + سکریت ≥ 32 کاراکتر در تولید |
| کوکی | `httpOnly`, `sameSite: lax`, `secure` در تولید |
| هش رمز | `bcryptjs` |
| 2FA | `TOTP` (بیس۳۲ secret + کد ۶ رقمی) |
| Audit Log | هر عمل حساس → `AuditLog` model (login, payment, cert, admin) |

---

## 5. الگوی Repository

```ts
// src/lib/db/repository.ts — ریپازیتوری پایه با فیلتر سافت‌دلیت
// src/lib/db/domains/*.repo.ts — ریپازیتوری‌های دامنه‌ای
// src/lib/db/queries/*.queries.ts — کوئری‌های کش‌شده
// src/lib/useCases/* — لایه استفاده (سرور اکشن‌ها + route handlers)
```

**از بیرون به داخل:**
```
Route Handler / Server Action
  → UseCase (lib/useCases/*)
    → Query (lib/db/queries/*)
      → Repository (lib/db/domains/*.repo.ts)
        → Prisma (extendWithSoftDelete)
          → PostgreSQL
```

---

## 6. کنترل دسترسی (RBAC)

نقش‌ها: `STUDENT`, `TEACHER`, `ADMIN`

| نقش | دسترسی |
|---|---|
| STUDENT | دوره‌های خود، پیام‌های خود، داشبورد محدود |
| TEACHER | + مدیریت محتوا (`/dashboardcontent`) |
| ADMIN | + گزارشات، کاربران (`/dashboard/reports`, `/dashboard/users`) |

**گیت‌ها:**
- **Edge** ([`src/middleware.ts`](../src/middleware.ts)): دکد JWT بدون وریفای → مسیرهای ADMIN/TEACHER مسدود
- **Server**: وریفای JWT + چک نقش در route handlers و use cases

---

## 7. لایه داده (Data Layer)

### Prisma Client
```ts
// src/lib/db/prisma-client.ts
export const prisma;      // با فیلتر سافت‌دلیت
export const prismaRaw;    // خام، فقط برای ادمین/مایگریشن
```

### Connection Management
- **Adapter:** `PrismaPg` (از `@prisma/adapter-pg`) برای اتصال مستقیم به PostgreSQL
- **Connection Pooling:** سازگار با Supabase/Neon از طریق `DATABASE_URL` (pooled)
- **Direct URL:** `DIRECT_URL` برای مایگریشن‌های بلوکی (نیاز به اتصال غیرپول‌شده)
- **UTC Session:** `withUtcSession` در [`src/lib/db/conn.ts`](../src/lib/db/conn.ts) — ستون `TimeZone` را روی UTC اعمال می‌کند تا خواندن تایم‌استمپ بین پرایمری و ریپلیکا همخوانی داشته باشد

---

## 8. جستجو (Search)

**دوموتور با فول‌بک:**

| موتور | اولویت | استفاده |
|---|---|---|
| Meilisearch | اول | `SEARCH_HOST` + `SEARCH_API_KEY` تنظیم شده |
| PostgreSQL FTS | دوم | `CourseSearch` مدل با `tsvector` column + GIN index |

**همگام‌سازی:**
- `npm run seed:search` — ایندکس اولیه Meilisearch
- `npm run verify:search:index` — تأیید صحت ایندکس
- `npm run verify:search:fallback` — تأیید فول‌بک FTS

**انقضای کش جستجو:** `invalidateSearchCourseCache` با `SCAN` کلیدهای `cache:search:courses:*` را پاک می‌کند.

---

## 9. ایمیل (Email)

**الگوی Outbox:**
1. ایمیل در جدول `EmailOutbox` ذخیره می‌شود (status: `pending`)
2. ورکر ([`worker/email-worker.ts`](../worker/email-worker.ts)) → هر ۳۰ ثانیه poll → ارسال با Resend
3. بک‌اف експوننشیال: `nextAttemptAt = createdAt + 2^retries * baseDelay`

**انواع ایمیل:**
- خوشامدگویی
- بازیابی رمز عبور
- تأیید پرداخت
- فرم تماس
- اعلان‌های سیستمی

---

## 10. سیستم رویداد (Event Bus)

```ts
// src/lib/events.ts — انتشار رویداد بدون اتصال مستقیم
// AuditLog model → هر عمل حساس → رکورد حسابرسی
// Notification model → رویدادهای کاربری → اعلان درون‌برنامه‌ای
```

**رویدادهای ردیابی شده:** login, password_change, payment_success, payment_failure, enrollment_success, grade_posted, certificate_issued, message_received, admin_action

---

## 11. مانیتورینگ و مشاهده‌پذیری

| ابزار | کاربرد |
|---|---|
| Sentry (`@sentry/nextjs`) | Error tracking + performance |
| `metrics.ts` | متریک‌های سفارشی (latency, cache hit ratio) |
| `log.ts` | لاگ ساختاریافته |
| `health.ts` | Endpoint سلامت (`/api/health`) |
| `slo.ts` | SLI/SLO tracking |
| `load-alerts.ts` | هشدار رگرسیون تست بار |

---

## 12. تست (Testing)

| نوع | ابزار | الگوی نام‌گذاری |
|---|---|---|
| واحد | Vitest | `src/**/*.test.ts(x)` |
| یکپارچه | Vitest + Postgres/Redis واقعی | `src/lib/__tests__/**integration/*.integration.test.ts` |
| E2E | Playwright | `e2e/**/*.spec.ts` |

**پوشش کد (Coverage):**
- Lines: ≥ 70%
- Functions: ≥ 75%
- Branches: ≥ 70%
- Statements: ≥ 70%

**تست‌های یکپارچه:** اگر `DATABASE_URL` موجود نباشد → self-skip (توسعه محلی). در CI → سرویس Postgres واقعی.

---

## 13. CI/CD

**GitHub Actions** (`.github/workflows/ci.yml`):
1. Lint → TypeCheck → Unit Tests → Integration Tests (Redis) → Replica Drill → Coverage Gate → Build
2. E2E (Playwright) — بعد از موفقیت Quality job

**اسکریپت‌های تولید (`package.json`):**
- `npm run build` — خروجی Standalone (برای Docker)
- `npm run db:migrate:deploy` — مایگریشن تولید
- `npm run worker:email` — ورکر ایمیل
- `npm run test:load` — تست بار k6

---

## 14. استقرار (Deployment)

| روش | فایل پیکربندی |
|---|---|
| Vercel | `vercel.json` + `.github/workflows/deploy.yml` |
| Railway | `railway.json` + `Procfile` |
| Docker | `Dockerfile` + `docker-compose.yml` |
| VPS | PM2 + `npm start` |

**ساختار Docker:**
- Multi-stage build (base → deps → builder → runner)
- Standalone output (`.next/standalone`)
- Worker: `Dockerfile.worker` (برای ایمیل)

---

## ۱۵. قواعد توسعه

1. **هیچ `process.env` مستقیم در کد سرور** — از `env` از `@/lib/env` استفاده کنید
2. **هیچ write از ریپلیکا** — فقط خواندن
3. **پس از هر mutation** — `invalidateCache` فراخوانی شود
4. **سافت‌دلیت** — `prisma` برای اپلیکیشن، `prismaRaw` فقط برای ادمین/مایگریشن
5. **CSP** — هیچ inline script بدون nonce در تولید
6. **Auth** — JWT از طریق cookie از `bn_session` خوانده می‌شود
7. **Rate Limit** — برای مسیرهای حساس `RATE_LIMIT_PRESETS.AUTH` یا `SENSITIVE`

---

## ۱۶. سؤالات رایج

**چرا `prisma-client.ts` در استارتاپ پرتاب می‌کند؟**
`DATABASE_URL` الزامی است. اگر نباشد، ارور شفاف در استارتاپ — نه یک ۵۰۰ مبهم در میانه درخواست.

**صفحه خانه بدون DB کار می‌کند؟**
بله. import پویا در `src/app/page.tsx` — اگر DB در دسترس نباشد، بخش دوره‌ها با empty state رندر می‌شود.

**چطور مایگریشن جدید بسازم؟**
```bash
npm run db:migrate -- --name <migration_name>
# تولید:
npm run db:migrate:deploy
```

**چطور سکریت JWT را بچرخانم؟**
1. `JWT_SECRET_OLD` = مقدار فعلی
2. `JWT_SECRET` = مقدار جدید
3. بعد از چند روز (پس از انقضای توکن‌های قدیمی)، `JWT_SECRET_OLD` را حذف کنید

---

## ۱۷. ساختار کلی دایرکتوری (Quick Reference)

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # ریشه (metadata, LD+JSON, providers)
│   ├── page.tsx            # صفحه خانه (ISR revalidate=300)
│   ├── globals.css         # متغیرهای CSS + RTL
│   ├── [page]/page.tsx     # صفحات استاتیک
│   └── api/                # Route Handlers
├── components/
│   ├── ui/                 # کامپوننت‌های پایه (shadcn/ui)
│   ├── shared/             # کامپوننت‌های مشترک
│   └── certificates/       # گواهینامه PDF
├── features/               # فیچرهای مستقل
│   ├── header/             # هدر سایت
│   ├── hero/               # قهرمان (صفحه خانه)
│   ├── courses/            # دوره‌ها
│   ├── dashboard/          # داشبورد
│   └── ...
├── hooks/                  # React hooks
├── lib/
│   ├── env.ts              # اعتبارسنجی محیط (Zod)
│   ├── cache.ts            # کش Redis + unstable_cache
│   ├── cache-tags.ts       # تگ‌های کش
│   ├── cache-control.ts    # سیاست کش Edge
│   ├── auth/               # JWT, session, password, CSRF
│   ├── db/                 # Prisma client, queries, repositories
│   ├── security/           # CSP, TOTP
│   ├── rate-limit*.ts      # محدودیت نرخ
│   ├── payment/            # پرداخت (زرین‌پال)
│   ├── monitoring/         # Sentry
│   └── seo.ts              # ابزارهای SEO
├── providers/              # ThemeProvider و ...
├── types/                  # Shared TS types
└── constants/              # ARIA labels, URLs
```

---

برای مطالعه بیشتر: [`README.md`](../README.md) · [`PLAN.md`](../PLAN.md) · [`DEPLOY.md`](../DEPLOY.md)
