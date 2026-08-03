# Observability — بصیر نو

این سند توضیح می‌دهد چه چیزی کجا ثبت می‌شود: لاگ‌ها، health check، متریک‌ها و tracing.

## ۱. لاگ ساختاریافته (`src/lib/log.ts`)

- بدون وابستگی خارجی؛ هر خط JSON روی stdout/stderr چاپ می‌شود (سازگار با Vercel Logs / Axiom / Grafana).
- فیلدها: `time`, `level` (debug|info|warn|error), `message`, `requestId`, + فیلدهای دلخواه.
- **Redaction خودکار:** کلیدهای `password`, `token`, `authorization`, `cookie`, `secret`, `apiKey`, `sig`, `jwt`, `email` هرگز در لاگ نمی‌آیند (جایگزین `[REDACTED]` می‌شوند).
- **requestId:** در `src/lib/api-middleware.ts` (با `withRateLimit`) از هدر `x-request-id` یا `crypto.randomUUID()` ساخته می‌شود و به‌عنوان هدر پاسخ هم برمی‌گردد. همه لاگ‌های همان درخواست با آن همبسته می‌شوند.
- حریم خصوصی: محتوای چت AI هرگز لاگ نمی‌شود (`src/lib/ai/llm.ts`).

استفاده:
```ts
import { log } from "@/lib/log";
log.info("payment marked paid", { paymentId, userId });
log.error("LLM request failed", { httpStatus: 429 });
```

## ۲. Health check (`GET /api/health`)

- بدون نیاز به auth — برای healthcheck پلتفرم‌های دپلوی (Vercel/Railway/k8s).
- بررسی‌ها: DB (`SELECT 1`)، Redis (ping)، search index (configured یا نه)، backlog صف ایمیل.
- کد ۲۰۰ وقتی DB سالم است؛ ۵۰۳ وقتی DB پایین است. Redis/Search «degraded» حساب می‌شوند ولی کل health را fail نمی‌کنند.

## ۳. متریک‌ها (`src/lib/metrics.ts` + `GET /api/metrics`)

- شمارنده‌های درون‌فرآیندی سبک (صفر latency). نام‌ها: `auth:login`, `payment:success`, `enrollment:free`, `search:query`, `ai:message`, `api:error`, `prisma:<Model>.<op>` (duration).
- **حافظه محدود:** MAX_ENTRIES=500 با eviction بر اساس آخرین به‌روزرسانی؛ `GET /api/metrics` (فقط ADMIN) بعد از snapshot شمارنده‌ها را ریست می‌کند.
- Histogram فقط میانگین/تقریب p95/ماکزیمم نگه می‌دارد (باندل صفر-وابستگی) — در داشبورد به‌عنوان روند بخوانید نه درصدیل دقیق.

## ۴. Tracing (duration کوئری‌ها)

- در `src/lib/db/prisma-client.ts` همه `find*` و `count` با `performance.now()` زمان‌سنجی می‌شوند و به متریک `prisma:<Model>.<op>` می‌روند — بدون تغییر رفتار soft-delete.
- درخواست‌های LLM هم duration دارند (از طریق متریک‌ها).

## ۵. Sentry

- client/server/edge به‌هم متصل‌اند؛ release در دپلوی (`deploy.yml`) ثبت می‌شود.

## نقشه: چه چیزی کجا

| داده | مقصد |
|---|---|
| خطاها | لاگ + Sentry |
| requestId | هدر پاسخ + لاگ |
| متریک تجاری/فنی | /api/metrics |
| health | /api/health |
| duration کوئری | متریک `prisma:*` |
