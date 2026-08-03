# 🗺️ Roadmap: ارتقای «بصیر نو» به Production-Ready

> بر اساس Audit جامع — هر فاز شامل: هدف، task‌ها، deliverable، معیار موفقیت، زمان تخمینی.
> زمان‌ها برای یک نفر با تمرکز کامل، روی یه دستگاه dev معمولی.

---

## 📊 وضعیت فعلی (اصلاح‌شده)

| دسته | نمره قبلی | نمره واقعی | دلیل |
|------|----------|----------|------|
| معماری | 9.0 | 9.0 | ✓ درست بود |
| امنیت | 9.5 | 9.0 | JWT_SECRET validation هست (fallback dev)، ولی env validation کلی نیست |
| TypeScript | 9.0 | 9.0 | ✓ درست بود |
| تست | 7.5 | 7.0 | ۱۱ تست DB وابسته در CI قابل پاس (postgres service) |
| عملکرد | 8.5 | 8.5 | ✓ درست بود |
| SEO | 8.0 | 8.0 | ✓ درست بود |
| a11y | 7.5 | 7.5 | ✓ درست بود |
| UI/UX | 9.0 | 9.0 | ✓ درست بود |
| Database | 8.0 | 7.5 | Migration history اصلاً commit نشده |
| DevOps | 7.5 | **8.5** | CI + Sentry + Dockerfile + Deploy workflow همه هست! |
| **میانگین** | 8.4 | **8.3** | |

---

## ✅ فازهای تکمیل‌شده (۱۴۰۵)

> این فازها قبلاً پیاده‌سازی شده‌اند — جزئیات در commit history و PR descriptionها.

### فاز ۰ — Quick Wins ✅
- حذف `console.log` از CorporateCtaForm و FooterNewsletter (PII)
- رفع ۹ ESLint warning (unused vars + missing dep)
- جایگزینی `<img>` با `<Image>` در FileUpload
- دانلود Vazirmatn به‌صورت local woff2 + `next/font/local`

### فاز ۱ — Database Hardening ✅
- `@updatedAt` و `deletedAt DateTime?` به همه ۱۰ models
- `@@index([deletedAt])` برای queryهای soft-delete
- migration اولیه `prisma/migrations/20260101000000_init/`
- `migration_lock.toml`
- `$extends` plugin در `prisma-client.ts` برای auto-filter `deletedAt: null`
- `prismaRaw` برای admin/repair queries (no soft-delete filter)

### فاز ۲ — Environment Validation ✅
- `src/lib/env.ts` با zod schema (pre-existed، fail-fast در production)
- مهاجرت ۲ API route به `env.isProduction`
- `.env.example` کامل
- `env.test.ts` با ۵ تست

### فاز ۳ — Cache Invalidation ✅
- `CACHE_TAGS` constants در `src/lib/cache-tags.ts` (pre-existed)
- `revalidateTag` به ۷ endpoint mutation اضافه شد
- مهاجرت string literal tags به `CACHE_TAGS` constants

### فاز ۴ — Testing Infrastructure ✅
- `@vitest/coverage-v8` با threshold 10% baseline
- `jest-axe` با ۶ تست a11y در `src/components/ui/__tests__/a11y.test.tsx`
- `test:integration` script برای ۱۲ تست repository
- `clearAllRateLimits()` در vitest.setup.ts
- ۳۳۶ تست passing در ۴۶ فایل

### فاز ۵ — Security Hardening ✅
- `withRateLimit` به ۱۴ API route اضافه شد
- Preset‌های AUTH, API, READ, SENSITIVE
- CSP, HSTS, Permissions-Policy در `next.config.mjs`
- defensive `getClientIdentifier(Request | undefined)`

### فاز ۶ — Performance Optimization ✅
- `loading.tsx` برای ۱۲ page جدید
- Prisma slow query log (100ms dev / 500ms prod)
- `@next/bundle-analyzer` با `npm run analyze`

### فاز ۷ — SEO Enrichment ✅
- Canonical URL به ۷ page
- `openGraph.type: "article"` در dynamic course page
- `buildBaseMetadata` با OG و Twitter card

### فاز ۸ — Accessibility ✅
- `lang="en" dir="ltr"` برای English book titles در library
- `role="alert" aria-live="assertive"` برای error messages
- `sr-only role="status" aria-live="polite"` برای success purchase messages
- ThemeToggle test (۳ تست) — dark mode verified

### فاز ۹ — UI/UX Polish ✅
- **Dark mode**: `next-themes` با `attribute="class"`، ThemeProvider + ThemeToggle
- **Storybook 10.5.5**: با `@storybook/nextjs-vite` + `@storybook/addon-docs` + `@storybook/addon-a11y` + `@storybook/addon-themes`
- **24 stories** در ۶ story file: Foundations (4), Button (7), Card (2), Badge (2), Skeleton (3), Separator (2), Accordion (2), ThemeToggle (2)
- Theme toolbar داخل Storybook برای preview در light/dark

---

## 🎯 فاز ۰ — Quick Wins (همین الان، ۲ ساعت)

**هدف:** تمیزکاری کوچک + حذف warning‌ها. بدون شکستن چیزی.

| # | تسک | فایل | زمان |
|---|------|------|------|
| 1 | حذف `console.log("Corporate form submitted", _data)` | `src/features/corporate/components/CorporateCtaForm.tsx:34` | ۲ دقیقه |
| 2 | حذف `console.log("Newsletter", _data)` | `src/features/footer/components/FooterNewsletter.tsx:34` | ۲ دقیقه |
| 3 | اصلاح ۹ ESLint warning (unused vars + missing dep) | متفرقه | ۱۵ دقیقه |
| 4 | جایگزینی ۱ `<img>` با `<Image>` | (پیدا کردنش در grep) | ۵ دقیقه |
| 5 | افزودن `preload={true}` verification برای Vazirmatn | `src/app/layout.tsx` | ۵ دقیقه |
| 6 | مستندسازی `npm run dev:db:seed` در `package.json` (اگه نیست) | `package.json` | ۵ دقیقه |

**معیار موفقیت:**
- `npx eslint src` → ۰ warning
- `npx tsc --noEmit` → ۰ error
- `grep -r "console\.log" src` → ۰ hit در production code

---

## 🗄️ فاز ۱ — Database Hardening (۶-۸ ساعت)

**هدف:** تبدیل `db push` به migration واقعی + soft delete + seed کامل.

### ۱.۱ Migration history
| تسک | جزئیات | زمان |
|------|--------|------|
| `npx prisma migrate dev --name init` | ساخت اولین migration از schema فعلی | ۱۰ دقیقه |
| commit کردن `prisma/migrations/` | الان اصلاً در repo نیست! | ۵ دقیقه |
| به‌روز کردن `Dockerfile` و `docker-compose.yml` برای `migrate deploy` به جای `db push` | docker-compose استفاده می‌کنه از migrations | ۱۰ دقیقه |
| اضافه کردن `prisma migrate deploy` در `ci.yml` قبل از test | قبل از `npm test` | ۵ دقیقه |
| **تست integration روی CI** | ۱۱ تست repository.test.ts در CI پاس بشن | ۱۵ دقیقه |

**معیار موفقیت:** `npx prisma migrate status` → "Database schema is up to date" در dev و prod

### ۱.۲ Soft Delete
| تسک | زمان |
|------|------|
| افزودن `deletedAt DateTime?` به همه ۱۰ models | ۱۵ دقیقه |
| migration `add_soft_delete` | ۵ دقیقه |
| به‌روز کردن Prisma extension برای auto-filter `deletedAt: null` در findMany/findFirst | ۳۰ دقیقه |
| استثناها (admin): `repository.findDeleted*` methods | ۱۵ دقیقه |
| دکمه "حذف" در admin UI → soft delete | ۱۵ دقیقه |

### ۱.۳ updatedAt automation
- Prisma `@updatedAt` به همه models که الان ندارن (User, Course, Enrollment, Message, Notification, PasswordReset)

### ۱.۴ Seed data
- بررسی `prisma/seed.ts` فعلی. اگه ناقصه: ۵ کاربر نمونه (هر role یکی)، ۱۰ دوره، ۲۰ lesson، ۵۰ enrollment، ۱۰۰ payment

**زمان کل فاز ۱: ۶-۸ ساعت**

---

## 🛡️ فاز ۲ — Environment Validation (۳-۴ ساعت)

**هدف:** همه env vars در startup validate بشن — اگه چیزی کمه fail-fast.

### ۲.۱ ساخت `src/lib/env.ts`
```ts
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  // اختیاری
  REDIS_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  RESEND_API_KEY: z.string().optional(),
  PAYMENT_WEBHOOK_SECRET: z.string().min(16).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  throw new Error("Invalid environment variables");
}
export const env = parsed.data;
```

| تسک | زمان |
|------|------|
| نوشتن `src/lib/env.ts` با zod schema | ۳۰ دقیقه |
| جایگزینی `process.env.X` در همه `src/lib/**/*.ts` با `env.X` (۱۲ فایل) | ۴۵ دقیقه |
| import `env` در `src/generated/prisma` (خروج از generated — در `prisma-client.ts`) | ۱۰ دقیقه |
| validation test (`src/lib/__tests__/env.test.ts`) | ۳۰ دقیقه |
| به‌روز کردن `.env.example` با همه varها + توضیح | ۱۵ دقیقه |
| به‌روز کردن `Dockerfile` و `docker-compose.yml` با `ENV` های لازم | ۱۰ دقیقه |

**معیار موفقیت:** اگه `JWT_SECRET` کمتر از ۳۲ char باشه، startup fail می‌کنه (نه در اولین request).

### ۲.۵ حذف fallback dev در `jwt.ts`
- الان: `return "dev-only-insecure-secret-do-not-use-in-production"` در dev
- بعد: hard fail در dev هم (حداقل zod schema validation می‌گه کمه)

---

## ♻️ فاز ۳ — Cache Invalidation (۴-۵ ساعت)

**هدف:** بعد از mutation، cache ها invalidate بشن. الان `revalidateTag` صفر بار استفاده شده.

### ۳.۱ Tag strategy (centralized)
ساخت `src/lib/cache-tags.ts`:
```ts
export const CACHE_TAGS = {
  users: "users",
  courses: "courses",
  payments: "payments",
  enrollments: "enrollments",
  grades: "grades",
  reports: "admin:reports",
  course: (id: string) => `course:${id}`,
  // ...
} as const;
```

### ۳.۲ اعمال revalidateTag در mutations
| Endpoint | Tag که باید invalidate بشه |
|----------|--------------------------|
| POST `/api/courses` | `["courses", "admin:reports"]` |
| POST `/api/courses/[id]/lessons` | `["course:${id}", "courses"]` |
| POST `/api/grades` | `["grades", "enrollments", "course:${courseId}", "admin:reports"]` |
| POST `/api/messages/[id]/read` | `["messages"]` |
| POST `/api/notifications/read-all` | `["notifications"]` |
| POST `/api/checkout/callback` (پرداخت موفق) | `["payments", "enrollments", "user", "admin:reports"]` |
| POST `/api/admin/certificates` | `["certificates", "user"]` |

**زمان کل فاز ۳: ۴-۵ ساعت** (بیشتر touch کردن endpointها + تست integration)

---

## 🧪 فاز ۴ — Testing Infrastructure (۶-۸ ساعت)

**هدف:** coverage threshold + e2e flow کامل + a11y tests + flake fixes.

### ۴.۱ Coverage
| تسک | زمان |
|------|------|
| نصب `@vitest/coverage-v8` | ۲ دقیقه |
| تنظیم `vitest.config.ts` با `coverage.thresholds` (lines: 70%, functions: 75%, branches: 60%) | ۱۰ دقیقه |
| اضافه کردن `npm run test:coverage` به `package.json` | ۲ دقیقه |
| اضافه کردن coverage upload به CI (codecov یا artifact) | ۱۵ دقیقه |

### ۴.۲ پاک کردن flake
- bcrypt test: افزایش timeout از ۵۰۰۰ms به ۱۰۰۰۰ms (یا use `vi.useFakeTimers`)
- ۱۵ دقیقه

### ۴.۳ E2E flows جدید
| Flow | فایل | زمان |
|------|------|------|
| **Library purchase**: ورود → library → کلیک خرید → callback mock → دانلود | `e2e/library.spec.ts` | ۱ ساعت |
| **Course learning**: ورود → courses → lesson → grade submission | `e2e/learning.spec.ts` | ۱ ساعت |
| **Admin reports**: ورود admin → reports → چارت‌ها render | `e2e/admin.spec.ts` | ۳۰ دقیقه |
| **Messages**: ارسال پیام → خواندن → mark as read | `e2e/messages.spec.ts` | ۳۰ دقیقه |

### ۴.۴ A11y automated tests
| تسک | زمان |
|------|------|
| نصب `axe-core` + `@axe-core/playwright` | ۵ دقیقه |
| ساخت `e2e/a11y.spec.ts` با scan همه pages | ۳۰ دقیقه |
| integration با CI (block merge if violations) | ۱۵ دقیقه |

### ۴.۵ Component test expansion
- هر feature module حداقل ۱ snapshot test + ۱ interaction test
- Container، Button، Card، Dialog: ۱۰ تست بیشتر (keyboard nav, focus trap, ARIA attrs)
- ۱ ساعت

**زمان کل فاز ۴: ۶-۸ ساعت**

---

## 🔒 فاز ۵ — Security Hardening (۳-۴ ساعت)

**هدف:** rate limit در همه mutating routes + middleware-level rate limit.

### ۵.۱ Rate limit gaps
الان ۶/۳۰ endpointهای mutating rate-limited هستن. لیست gap:
- `POST /api/admin/certificates` (حساس — صدور گواهی)
- `POST /api/admin/courses/[id]/moderate` (حساس — تأیید دوره)
- `POST /api/admin/lessons` (admin)
- `POST /api/admin/lessons/[id]` (admin)
- `POST /api/lessons` (معلم)
- `POST /api/grades` (معلم)
- `POST /api/messages` (هر کاربر)
- `POST /api/messages/[id]/read` (هر کاربر)
- `POST /api/notifications/[id]/read` (هر کاربر)
- `POST /api/notifications/read-all` (هر کاربر)
- `POST /api/user/password` (تغییر رمز — خیلی حساس!)
- `POST /api/user/profile` (هر کاربر)
- `POST /api/library/[id]/download` (خرید — خیلی حساس!)
- `POST /api/upload` (هر کاربر)
- `POST /api/search` (debatable — معمولاً rate limit نمی‌خواد)

| تسک | زمان |
|------|------|
| rate limit با preset مناسب (AUTH برای login، GENERAL برای rest) | ۴۵ دقیقه |
| `ADMIN_PRESET` با limit کمتر (۱۰ req/min) برای admin routes | ۱۵ دقیقه |
| تست integration برای rate limit | ۳۰ دقیقه |

### ۵.۲ Middleware-level IP rate limit
- یه IP نمی‌تونه بیشتر از ۲۰۰ req/min بزنه به سایت (DDoS basic)
- `src/middleware.ts` با sliding window در Redis (یا in-memory fallback)

### ۵.۳ Security headers audit
- ساخت `next.config.ts` با CSP، X-Frame-Options، Strict-Transport-Security، Permissions-Policy
- ۳۰ دقیقه

**زمان کل فاز ۵: ۳-۴ ساعت**

---

## 🚀 فاز ۶ — Performance Optimization (۵-۷ ساعت)

**هدف:** LCP < 2s، TTI < 3s، bundle size کمتر.

### ۶.۱ Image optimization
- کاور کتاب‌ها → WebP (با `next/image` + remote loader یا sharp)
- تصاویر جدید → `unoptimized: false` در `next.config`
- ۱ ساعت

### ۶.۲ Heavy components → dynamic
- `CourseCard` با hover effects → `next/dynamic` با `loading: skeleton`
- `BookCard` (در library)
- `VideoPlayer` (در courses/[id]/learn)
- `Dialog` content
- ۴۵ دقیقه

### ۶.۳ Loading skeletons
- `loading.tsx` برای هر route که الان نداره (۱۴ route)
- استفاده از `Skeleton` component مرکزی
- ۱ ساعت

### ۶.۴ Prisma query log در dev
- `src/lib/db/prisma-client.ts`:
  ```ts
  if (process.env.NODE_ENV === "development") {
    prisma.$on("query", (e) => {
      if (e.duration > 100) console.warn(`[SLOW QUERY] ${e.duration}ms: ${e.query}`);
    });
  }
  ```
- ۱۵ دقیقه

### ۶.۵ Bundle analysis
- نصب `@next/bundle-analyzer`
- `npm run analyze` script
- ۱۵ دقیقه

**زمان کل فاز ۶: ۵-۷ ساعت**

---

## 🔍 فاز ۷ — SEO Enrichment (۴-۶ ساعت)

**هدف:** همه صفحات indexable با rich metadata.

### ۷.۱ JSON-LD for content
- `Course` schema در `src/app/courses/[id]/page.tsx`
- `BreadcrumbList` در همه pages
- `FAQPage` در `/about` (اگه FAQ section داره)
- `Article` در بلاگ (اگه فعال بشه)
- `Product` در `/library/[id]` (قیمت + availability)
- ۲ ساعت

### ۷.۲ Canonical URLs
- افزودن `alternates: { canonical: ... }` به `buildBaseMetadata` یا per-page
- ۱۵ دقیقه

### ۷.۳ OpenGraph image generator
- `@vercel/og` (Edge runtime)
- `/api/og?title=...&subtitle=...` برای هر page
- ۱.۵ ساعت

### ۷.۴ hreflang
- اگه فارسی تنها زبانه، نیازی نیست. ولی اگه انگلیسی اضافه بشه:
- `<link rel="alternate" hreflang="fa" href="..." />` در layout
- ۱۵ دقیقه

### ۷.۵ SEO test
- `lighthouse --output=json` در CI
- SEO score > 95
- ۳۰ دقیقه

**زمان کل فاز ۷: ۴-۶ ساعت**

---

## ♿ فاز ۸ — Accessibility (۴-۶ ساعت)

**هدف:** WCAG 2.1 AA compliance.

### ۸.۱ ARIA live regions
- `Toast` component → `role="status" aria-live="polite"`
- `Notification` bell → `aria-live="polite"` برای unread count
- Error messages → `role="alert" aria-live="assertive"`
- ۱ ساعت

### ۸.۲ Keyboard nav
- Dialog: focus trap (Radix داره، verify)
- Dropdown menu: Escape, arrow keys
- Tab order در forms
- Skip link اضافه به همه pages (الان فقط layout)
- ۱ ساعت

### ۸.۳ Color contrast audit
- استفاده از `axe` برای detect
- Fix kid-palette pairs که contrast < 4.5:1
- ۱ ساعت

### ۸.۴ Screen reader test
- VoiceOver (macOS) یا NVDA (Windows) روی key pages
- Fix هر issue
- ۱.۵ ساعت

### ۸.۵ Reduced motion
- `prefers-reduced-motion: reduce` media query
- `motion.ts` token system با `useReducedMotion` check
- ۳۰ دقیقه

### ۸.ۄ Lang attributes per section
- اگه متن انگلیسی بین متن فارسی (book titles)، `lang="en"` wrapper
- ۱۵ دقیقه

**زمان کل فاز ۸: ۴-۶ ساعت**

---

## 🎨 فاز ۹ — UI/UX Polish ✅ (تکمیل‌شده)

### ۹.۱ Dark mode toggle ✅
- `next-themes` با `attribute="class"` (smooth transition، disable در حین تغییر)
- `ThemeProvider` در `src/providers/Providers.tsx` (defaultTheme="system" + enableSystem)
- `ThemeToggle` در header با sun/moon icon + rotate animation
- CSS variable override در `.dark` (نیازی به `dark:` Tailwind variants نیست)
- ThemeToggle test با ۳ تست passing

### ۹.۲ Storybook ✅
- Storybook 10.5.5 با `@storybook/nextjs-vite` (سریع‌تر از webpack)
- addons: docs, a11y, themes (theme toolbar داخل Storybook)
- ۲۴ story در ۶ فایل: Foundations (4), Button (7), Card (2), Badge (2), Skeleton (3), Separator (2), Accordion (2), ThemeToggle (2)
- هر story فارسی + RTL با token system
- `npm run storybook` برای dev، `npm run build-storybook` برای static build

### ۹.۳ Design tokens export ⏳ (deferred)
- Style Dictionary → JSON برای Figma
- بعداً، اولویت پایین

### ۹.۴ Form UX ⏳ (deferred)
- Loading state در همه submit buttons
- Optimistic updates در like/favorite
- Better error messages (نه generic)

---

## 📋 فاز ۱۰ — Documentation & Onboarding (۲-۳ ساعت)

### ۱۰.۱ README
- Setup instructions
- Architecture diagram
- Environment variables list
- Deployment guide
- ۱ ساعت

### ۱۰.۲ AGENTS.md (اگه نیست)
- ۱۵ دقیقه

### ۱۰.۳ API documentation
- OpenAPI/Swagger generator
- یا manual docs در `docs/api.md`
- ۱ ساعت

### ۱۰.۴ Component documentation
- JSDoc هر component
- مثال usage
- ۳۰ دقیقه

---

## 📅 جدول زمانی پیشنهادی

| هفته | فاز | هدف |
|------|-----|------|
| ۱ | فاز ۰ + ۱ + ۲ | تمیزکاری، migrations، env validation |
| ۲ | فاز ۳ + ۴ + ۵ | Cache, tests, security |
| ۳ | فاز ۶ + ۷ | Performance + SEO |
| ۴ | فاز ۸ + ۱۰ | a11y + docs |
| بعد | فاز ۹ (اختیاری) | Storybook, dark mode |

**مجموع حداقل (فاز ۰-۸ + ۱۰): ~۳۵-۵۰ ساعت**
**با فاز ۹: ~۴۵-۶۰ ساعت**

---

## 🎯 معیار موفقیت نهایی (هدف 9.5/10)

| دسته | الان | هدف |
|------|------|------|
| معماری | 9.0 | 9.5 |
| امنیت | 9.0 | 9.8 (rate limit + env validation) |
| TypeScript | 9.0 | 9.5 (zero warnings) |
| تست | 7.0 | 9.0 (coverage + e2e + a11y) |
| عملکرد | 8.5 | 9.0 (image opt + lazy) |
| SEO | 8.0 | 9.5 (JSON-LD per page + OG) |
| a11y | 7.5 | 9.0 (WCAG AA) |
| UI/UX | 9.0 | 9.5 (dark mode + Storybook) |
| Database | 7.5 | 9.0 (migrations + soft delete) |
| DevOps | 8.5 | 9.5 (CI + Sentry + Docker + env) |
| **میانگین** | **8.3** | **9.3** |

---

## 🚀 شروع سریع

اگه می‌خوای از همین الان شروع کنیم، پیشنهاد می‌کنم **فاز ۰** رو با هم انجام بدیم — ۱۰ دقیقه‌ای تموم میشه و code health رو بالا می‌بره. بعدش **فاز ۲ (env validation)** چون quick win بزرگه.

کدوم فاز رو شروع کنیم؟ یا می‌خوای فاز خاصی رو priority بالاتر ببرم؟

---

**تاریخ:** ۱۴۰۵/۰۵/۰۲
**تهیه‌کننده:** Mavis (audit agent)
**وضعیت:** Draft — منتظر تأیید
