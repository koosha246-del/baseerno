# پرامپت‌های ارتقای «بصیر نو» به مقیاس L (بزرگ)

> **نحوه استفاده:** هر پرامپت کاملاً مستقل است و وابستگی به پرامپت‌های دیگر ندارد.
> هر کدام را جداگانه به یک AI / مهندس بدهید تا به‌صورت موازی اجرا شود.
> همه دستورات را از ریشه ریپو اجرا کنید.
>
> **پشته مشترک:** Next.js 15 (App Router) + TypeScript strict + Prisma 7 + PostgreSQL +
> Redis (کش و rate limit) + Resend (ایمیل) + Tailwind. خطاها فارسی.
> **قبل از شروع:** فایل‌های ذکر شده را بخوان و وضعیت فعلی را تأیید کن (دوباره نساز).

---

## پرامپت ۱ — سرویس ایمیل مستقل (Worker جدا + صف چند-نمونه‌ای)

شما یک مهندس ارشد Backend/DevOps هستید که روی پروژه «بصیر نو» کار می‌کنید — پلتفرم آموزش آنلاین فارسی.

## وضعیت فعلی (بررسی کن، دوباره نساز):
✅ `prisma/schema.prisma` — مدل `EmailOutbox` (id, to, subject, html, status pending/sent/failed, retries, maxRetries=3, lastError, nextAttemptAt, createdAt, sentAt, updatedAt, index(status,createdAt))
✅ `src/lib/email-queue.ts` — `enqueueEmail()` + `processEmailQueue(batchSize)` با exponential backoff (60s→2min→4min، سقف ۲۴h)
✅ `src/lib/email.ts` — `sendEmail()` غیرهمزمان: مستقیم Resend + fallback به outbox
✅ `worker/email-worker.ts` — حلقه ۱۰ ثانیه‌ای با graceful shutdown (SIGTERM/SIGINT)
✅ `src/app/api/cron/email/route.ts` — Vercel Cron با محافظت `x-cron-secret`
✅ `Procfile` فقط `web: npm start` دارد — worker در جای دیگری دپلوی نمی‌شود
⚠️ worker یک اسکریپت `tsx` است نه سرویس جدا؛ در چند نمونه، دو worker می‌توانند یک ردیف را همزمان بردارند (بدون lock)

## وظایف:
1. **دپلوی جدا برای worker**: یک Dockerfile-worker یا کامند جدا بساز تا `worker/email-worker.ts` به‌صورت سرویس مستقل deploy شود (در railway.json / docker-compose.yml / Procfile سرویس `worker` اضافه کن)
2. **Claim-based locking**: `processEmailQueue` را طوری تغییر بده که ردیف‌ها را «رزرو» کند تا چند نمونه همزمان هر ردیف را حداکثر یک‌بار بفرستند. دو گزینه:
   - `SELECT ... FOR UPDATE SKIP LOCKED` (نیاز به transaction)
   - یا افزودن وضعیت جدید `processing` به ستون status — توجه: این ستون در schema الان فقط `pending | sent | failed` را مستند کرده، پس افزودن `processing` یعنی تغییر کامنت ستون + migration (expand/contract) + به‌روزرسانی همه‌ی جاهایی که status را می‌خوانند (worker، cron، تست‌ها). اگر این مسیر را انتخاب کردی، کل زنجیره را یکپارچه به‌روز کن
3. **سقف نرخ ارسال**: محدودکننده ساده (مثلاً حداکثر N ایمیل در ثانیه) اضافه کن تا Resend را rate-limit نزنی
4. **بازیابی ردیف‌های processing**: اگر worker وسط کار بمیرد، ردیف‌های `processing` بعد از timeout مشخص دوباره به `pending` برگردند (همان polling بعدی)
5. **متریک حداقلی**: شمارنده‌های درون‌فرآیندی (sent/failed/backlog) + لاگ ساختاریافته با تعداد صف
6. مستندات راه‌اندازی در README/docs: Vercel (cron + secret) و VPS/Railway (سرویس جدا)

## محدودیت‌ها:
- `sendEmail` در request نباید هرگز روی SMTP صبر کند (فعلاً همین رفتار را حفظ کن)
- ایمیل‌های fail حداکثر ۳ بار retry (maxRetries ردیف را احترام بگذار)
- بدون تغییر در API مسیرهای موجود؛ فقط بهبود داخلی + دپلوی

## معیار پذیرش:
- `npm run typecheck` بدون خطا؛ `npm test` پاس (تست‌های `email-queue` و integration موجود نشکنند)
- تست جدید: دو worker همزمان (mock) هر ردیف را یک‌بار می‌فرستند
- worker به‌عنوان سرویس جدا قابل deploy است (کامند/سرویس جدید در فایل‌های دپلوی)

---

## پرامپت ۲ — جستجوی اختصاصی با Meilisearch/Typesense

شما یک مهندس ارشد Search هستید که روی پروژه «بصیر نو» کار می‌کنید.

## وضعیت فعلی (بررسی کن، دوباره نساز):
✅ `src/lib/db/domains/search.repo.ts` — `searchCourses` با FTS روی جدول `CourseSearch` (tsvector + plainto_tsquery) + fallback LIKE؛ `searchMessages` و `searchUsers` با `to_tsvector`
✅ `prisma/migrations/..._add_course_search/migration.sql` — جدول `CourseSearch` + GIN index
✅ `src/app/api/search/route.ts` — جستجوی ترکیبی (courses + messages + users، users فقط ADMIN) با rate limit اختصاصی
✅ `src/app/api/admin/search-sync/route.ts` — sync همه/یک دوره
✅ `src/lib/events.ts` — رویداد `search:needs-sync` که `syncCourseSearch` را صدا می‌زند
⚠️ جستجو روی Postgres است — با رشد داده و نیاز به غلط‌یابی/فیلتر، به یک ایندکس تخصصی نیاز است

## وظایف:
1. **راه‌اندازی Meilisearch** (ترجیح) یا Typesense: سرویس در docker-compose.yml + کلاینت در `src/lib/search/` (خالی از وابستگی به Prisma)
2. **ایندکس‌ها**: دوره‌ها (title/subtitle/category/level/price)، پیام‌ها (body)، کاربران (name/email) — هر کدام با تنظیمات فارسی (`language: fa`، typo tolerance، stop-words)
3. **استراتژی sync**: بذر اولیه (اسکریپت) + sync افزایشی — در رویداد `search:needs-sync`، ایندکس را هم به‌روز کن؛ `search.repo.ts` را طوری بازنویسی کن که وقتی کلید search تنظیم نیست، دقیقاً به مسیر قبلی Postgres برنگردد (fallback کامل)
4. **`/api/search` بدون تغییر قرارداد**: خروجی قبلی حفظ شود + فیلد‌های جدید (highlight، facet دسته‌بندی/سطح) به‌عنوان اضافه
5. **نمره‌دهی و مرتب‌سازی**: ranking با relevancy خود Meilisearch + boost برای دوره‌های منتشرشده
6. **تست**: unit با mock کلاینت search (hit و miss) + integration (اگر سرویس در CI در دسترس است) + fallback وقتی سرویس down است

## محدودیت‌ها:
- `SEARCH_HOST` / `SEARCH_API_KEY` در `src/lib/env.ts` اختیاری — بدون آن کل سیستم با Postgres FTS قبلی کار کند (خاموشی بدون فاجعه)
- هیچ محتوای پیام کاربر در لاگ‌ها
- قرارداد پاسخ `/api/search` برای کلاینت‌های موجود (dashboard SearchResults) نشکند

## معیار پذیرش:
- `npm run typecheck` + `npm test` پاس
- جستجوی فارسی با غلط‌تایپی کوچک جواب می‌دهد (typo tolerance)
- بدون سرویس search، همه چیز مثل قبل کار می‌کند (fallback)
- مستندات راه‌اندازی + docker-compose سرویس جدید

---

## پرامپت ۳ — Real-time با SSE برای نوتیفیکیشن و چت AI

شما یک مهندس ارشد Frontend/Real-time هستید که روی پروژه «بصیر نو» کار می‌کنید.

## وضعیت فعلی (بررسی کن، دوباره نساز):
✅ نوتیفیکیشن با polling: `src/features/dashboard/components/NotificationDropdown.tsx` (fetch دوره‌ای)
✅ چت AI با polling ساده: `src/features/ai/ChatWidget.tsx` → `POST /api/ai/conversations/[id]/messages`
✅ احراز هویت JWT: `src/lib/auth/session.ts` → `getCurrentUser()` (کوکی)
✅ Event Bus تایپ‌شده: `src/lib/events.ts` — رویدادها: `message:sent`، `grade:posted`، `enrollment:*`، `certificate:issued`
⚠️ هیچ SSE/WebSocket وجود ندارد — همه‌چیز polling است

## وظایف:
1. **SSE route**: `GET /api/notifications/stream` — اتصال با کوکی احراز هویت؛ برای هر کاربر یک صف رویداد در حافظه (Map<userId, Set<ReadableStream>>)
2. **اتصال Event Bus به SSE**: در `events.ts` (یا یک ماژول جدید `src/lib/realtime.ts`) — وقتی رویدادِ دارای recipient منتشر می‌شود (message:sent, grade:posted, enrollment, certificate)، به اتصال بازِ همان کاربر push کن
3. **heartbeat + cleanup**: پینگ هر ۲۵ ثانیه، بستن اتصال‌های قطع‌شده، سقف تعداد اتصال‌های همزمان هر کاربر
4. **کلاینت نوتیفیکیشن**: `NotificationDropdown` با `EventSource` (اتصال خودکار با کوکی) + **fallback به polling قبلی** وقتی SSE fail/بسته است + آپدیت نشانگر خوانده‌نشده
5. **چت AI**: پاسخ را با SSE stream کن (استریم تکه‌به‌تکه از LLM — یا حداقل یک رویداد «پاسخ آماده شد» به‌جای polling). اگر LLM استریم نمی‌دهد، mock هم کافی است
6. **تست**: unit برای نگاشت رویداد→recipient و cleanup؛ تست کامپوننت برای fallback

## محدودیت‌ها:
- روی Next.js route handler (بدون سرویس جدا — همان سرور)؛ اگر محدودیت platform (Vercel) اجازه نداد، مستند کن و با polling+long-poll بمان
- احراز هویت اجباری روی استریم (۴۰۱ برای بدون کوکی)
- با `revalidate`/ISR صفحه‌های موجود تداخل نکند

## معیار پذیرش:
- نوتیفیکیشن جدید بدون رفرش/پولینگ ظاهر می‌شود (وقتی اتصال باز است)
- وقتی SSE قطع است، fallback به polling قبلی کار می‌کند
- `npm run typecheck` + `npm test` پاس؛ تست امنیت: استریم بدون کوکی ۴۰۱ می‌دهد

---

## پرامپت ۴ — Observability (لاگ ساختاریافته + متریک + tracing)

شما یک مهندس SRE/Observability هستید که روی پروژه «بصیر نو» کار می‌کنید.

## وضعیت فعلی (بررسی کن، دوباره نساز):
✅ Sentry: `sentry.client.config.ts` / `sentry.server.config.ts` / `sentry.edge.config.ts` + release در `deploy.yml`
✅ `src/lib/monitoring/sentry-server.ts` — wrapper
✅ لاگ‌ها با `console.*` پراکنده (بدون request-id، بدون سطح)
⚠️ هیچ متریک تجاری/فنی منظمی نیست؛ هیچ /api/health نیست؛ هیچ tracing برای کوئری‌های DB نیست

## وظایف:
1. **لاگ ساختاریافته**: یک ماژول `src/lib/log.ts` (با `pino` یا بدون وابستگی — `console` با JSON) — سطح‌ها (info/warn/error)، فیلد `requestId` که از هدر/متادیتای هر request گرفته می‌شود، redact برای فیلدهای حساس (password, token, cookie)
2. **`GET /api/health`**: وضعیت DB (ping)، Redis (`getRedisClient().ping()`)، صف ایمیل (count pending)، search index (اگر هست) — پاسخ JSON با `status: ok|degraded` و کد 200/503؛ بدون نیاز به auth (برای healthcheck دپلوی)
3. **متریک‌های تجاری**: شمارنده‌های سبک در حافظه (ثبت‌نام، پرداخت موفق/ناموفق، enrollment، جستجو، پیام AI، خطاهای API) — در `src/lib/metrics.ts` + endpoint `GET /api/metrics` (فقط ADMIN) یا اتصال به سرویس متریک ابری؛ سقف حافظه و ریست دوره‌ای
4. **tracing حداقلی**: duration هر کوئری Prisma (با `$extends` در `src/lib/db/prisma-client.ts` بدون شکستن soft-delete) + duration درخواست‌های LLM — ارسال به Sentry performance یا لاگ
5. مستندات: چه چیزی کجا می‌رود (log/metric/trace) در `docs/observability.md`

## محدودیت‌ها:
- حریم خصوصی: محتوای چت AI هرگز در لاگ‌ها (قبلاً در `src/lib/ai/llm.ts` رعایت شده — حفظش کن)
- افزودن متریک نباید latency request را محسوس کند (همه غیرهمزمان/سبک)
- تست‌ها نشکنند؛ `src/lib/__tests__/api-middleware.test.ts` رفتار rate limit را دارد — به آن دست نزن

## معیار پذیرش:
- `npm run typecheck` + `npm test` پاس؛ تست unit برای log redact و health (mock کردن redis/prisma)
- `curl /api/health` وقتی DB down است 503 برمی‌گرداند
- لاگ‌های خطا شامل requestId هستند

---

## پرامپت ۵ — مقیاس دیتابیس (pooling + replica + partition + ایندکس)

شما یک مهندس ارشد دیتابیس هستید که روی پروژه «بصیر نو» کار می‌کنید.

## وضعیت فعلی (بررسی کن، دوباره نساز):
✅ Prisma 7 با `@prisma/adapter-pg` (PrismaPg) در `src/lib/db/prisma-client.ts` — اتصال مستقیم به DATABASE_URL
✅ ۱۴ مدل با ایندکس‌های خوب + soft delete (filtrable) + FTS (CourseSearch + GIN)
✅ `scripts/backup-db.sh` — pg_dump روزانه با retention ۳۰ روز
✅ جداول پررشد: `Message`، `Notification`، `ChatMessage`، `EmailOutbox`، `Payment` — همه با createdAt
⚠️ بدون connection pooling، بدون read replica، بدون partition، ایندکس کامل نیست (EXPLAIN نشده)

## وظایف:
1. **Connection pooling**: پشتیبانی از `DATABASE_URL` (مستقیم) + `DIRECT_URL` (pooled) در `src/lib/env.ts` و prisma-client — طبق الگوی Supabase/Neon (pool در connectionString، direct در query)؛ مستند کن هر کدام کجا استفاده شود
2. **Read replica (اگر میزبان اجازه داد)**: یک `REPLICA_URL` اختیاری — کوئری‌های dashboard/reports (فقط خواندن) به replica بروند؛ fallback به primary وقتی خالی است؛ با Prisma client دوم
3. **Partition کردن جداول بزرگ** (Message, Notification, ChatMessage, EmailOutbox) بر اساس `createdAt` (بازه ماهانه) — migration دستی SQL + نگهداری (create partition جدید، drop قدیمی) + تست جابه‌جایی کوئری‌ها روی partition
4. **EXPLAIN و ایندکس‌های گمشده**: برای کوئری‌های پرتکرار (findMany درس‌های دوره، نوتیفیکیشن‌های کاربر، پیام‌های بین دو کاربر، گزارش‌ها) — ایندکس‌های composite لازم را به schema + migration اضافه کن
5. **VACUUM/ANALYZE و نگهداری**: اسکریپت + مستندات زمان‌بندی (cron)
6. **بازیابی از backup**: تست restore واقعی مستند شده (متنی) — چه چیزی نیاز است، چگونه انجام می‌شود، RPO/RTO هدف

## محدودیت‌ها:
- سازگار با Prisma 7 + adapter-pg (ایندکس‌ها و Unsupported در schema درست بمانند؛ FTS نشکند)
- همه migration ها expand/contract باشند (بدون downtime برای deploy) — برای partition، جدول جدید بساز و کوپی کن، نه ALTER سنگین
- تست‌های integration موجود (`search.repo`، `email-queue`) نشکنند

## معیار پذیرش:
- `npm run typecheck` + `npm test` پاس
- بدون `REPLICA_URL`/پارتیشن، همه‌چیز مثل قبل کار می‌کند (اختیاری بودن کامل)
- مستندات pooling/replica/partition/backup در `docs/database-scaling.md`

---

## پرامپت ۶ — CI/CD در مقیاس (coverage gate + E2E در CI + load test + preview)

شما یک مهندس DevOps/QA هستید که روی پروژه «بصیر نو» کار می‌کنید.

## وضعیت فعلی (بررسی کن، دوباره نساز):
✅ `.github/workflows/ci.yml` — lint, typecheck, unit (vitest), build با سرویس Postgres 16 + `migrate deploy`
✅ `.github/workflows/deploy.yml` — دپلوی Vercel + ارسال release به Sentry
✅ `vitest.config.ts` — coverage با provider v8 و thresholds (lines 70, functions 75, branches 60, statements 70)
✅ ۶ تست E2E در `e2e/` (auth, catalog, checkout, dashboard, learning, signup) — اما در CI اجرا نمی‌شوند!
⚠️ بدون gate در CI روی coverage، بدون E2E در CI، بدون load test، بدون preview برای PR

## وظایف:
1. **Coverage gate در CI**: مرحله جدید در ci.yml که `npx vitest run --coverage` اجرا می‌کند و threshold را fail می‌کند (همان مقادیر vitest.config)
2. **E2E در CI**: job جدید Playwright با سرویس Postgres + seed + `next build && next start` (یا preview URL) — هر ۶ spec اجرا شوند؛ بدون نصب مرورگر اضافه (رودخانه نصب خودکار Playwright)
3. **Preview environment**: برای هر PR یک دپلوی Vercel preview + اجرای E2E روی آن (اختیاری اگر توکن فراهم است؛ وگرنه روی build محلی)
4. **Load test با k6**: اسکریپت `scripts/load/k6-script.js` — سناریوها: صفحه اصلی، کاتالوگ، جستجو، login، checkout — با آستانه (threshold) مثل `p95 < 500ms` و نرخ خطا < 1%؛ دستور npm `test:load`
5. **Migration safety**: در CI تأیید کن `prisma migrate deploy` روی دیتابیس خالی جواب می‌دهد و schema با migration ها drift ندارد (`prisma migrate diff` یا validate)
6. مستندات: `docs/ci-cd.md` — نقشه کل pipeline + rollback runbook

## محدودیت‌ها:
- زمان CI معقول بماند (cache برای npm، اجرای موازی job ها)
- secrets جدید فقط در GitHub Settings اضافه شوند (ننویس)
- تست‌های واحد نادیده گرفته نشوند (همه همچنان اجرا شوند)

## معیار پذیرش:
- CI سبز با: lint + typecheck + unit + coverage gate + build + (E2E)
- `npm run test:load` با k6 خروجی آمار می‌دهد
- مستندات pipeline و rollback کامل است

---

## پرامپت ۷ — مونولیت ماژولار → پکیج‌های مستقل + نسخه‌بندی API

شما یک معمار نرم‌افزار هستید که روی پروژه «بصیر نو» کار می‌کنید.

## وضعیت فعلی (بررسی کن، دوباره نساز):
✅ پترن UseCase + Event Bus + repository: `src/lib/useCases/*`، `src/lib/events.ts`، `src/lib/db/repository.ts` + domain ها در `src/lib/db/domains/*`
✅ `src/features/*` — ۲۰ ماژول UI با constants/types
✅ Route ها نازک: CSRF → parse → validate → useCase → useCaseToResponse
⚠️ همه‌چیز در یک اپ Next.js است؛ import ها با `@/` (src/) — آماده برای استخراج ماژول‌های مستقل نیست

## وظایف:
1. **پکیج‌های داخلی (بدون مونوریپو سنگین)**: دایرکتوری `src/packages/` یا ساختار `packages/` با tsconfig pathها — `@baseerno/core` (domain ها + useCases + events + repository) را به‌عنوان مرز صریح جدا کن؛ UI و app فقط از این import کنند (نه برعکس)
2. **قانون مرز (boundary enforcement)**: ESLint rule یا ساختار دایرکتوری که استفاده‌های اشتباه را fail کند: app → core مجاز؛ core → app ممنوع؛ features → core مجاز؛ features → features دیگر ممنوع
3. **نسخه‌بندی API عمومی**: برای endpoint های عمومی (courses, search, auth) مسیر `/api/v1/...` با رسیدگی backward-compat به مسیرهای قدیمی (redirect یا alias)؛ مستندات قرارداد در `docs/api.md`
4. **آمادگی microservice**: برای هر domain (auth, catalog, enrollment, ai, notifications) یک «مرز» مستند — چه چیزهایی باید جدا شوند، وابستگی‌های بین‌دامنه کدام‌اند (در docs/architecture.md)
5. **typecheck/test برای هر پکیج** (اسکریپت جدا) + تستی که import های غیرمجاز را fail می‌کند

## محدودیت‌ها:
- مهاجرت تدریجی — بدون بازنویسی کل کد؛ در یک جلسه فقط مرزها و پکیج core ساخته می‌شود
- همه تست‌های موجود پاس بمانند (behavior تغییر نکند)
- الگوی naming فایل‌های همسایه رعایت شود

## معیار پذیرش:
- `npm run typecheck` + `npm test` پاس
- یک تست (یا lint) که import از core → app را fail می‌کند وجود دارد
- `docs/architecture.md` و `docs/api.md` نوشته شده‌اند

---

## پرامپت ۸ — امنیت در مقیاس (audit log + چرخش کلید + 2FA/SSO)

شما یک مهندس امنیت Web هستید که روی پروژه «بصیر نو» کار می‌کنید.

## وضعیت فعلی (بررسی کن، دوباره نساز):
✅ CSP با nonce: `src/lib/security/csp.ts` + `src/middleware.ts` (بدون unsafe-inline در prod)
✅ Rate limit با presets: `src/lib/rate-limit.ts` (AUTH/API/READ/SENSITIVE) روی همه route های اصلی
✅ CSRF (same-origin): `src/lib/csrf.ts`؛ JWT: `src/lib/auth/jwt.ts`؛ zod validation
✅ soft delete + `SOFT_DELETE_MODELS`
⚠️ بدون audit log برای عمل‌های حساس؛ بدون مکانیزم چرخش کلید (JWT_SECRET / PAYMENT_SIGNATURE_SECRET یک‌باره خوانده می‌شوند)؛ بدون 2FA؛ چند route بدون rate limit (POST /api/lessons، upload)

## وظایف:
1. **Audit log**: مدل Prisma `AuditLog` (id, actorId, action, targetType, targetId, meta Json, ip, createdAt) + نوشتن از طریق Event Bus — رویدادهای جدید: `auth:login`, `auth:logout`, `user:password-changed`, `course:published/unpublished`, `certificate:issued`, `payment:failed`, `admin:*` — فقط رویدادهای حساس، نه همه‌چیز (جلوگیری از رشد بی‌معنی)
2. **چرخش کلید**: پشتیبانی از `JWT_SECRET` + `JWT_SECRET_OLD` — هنگام verify، هر دو امتحان شوند (توکن‌های قدیمی تا انقضا معتبر بمانند)؛ همین الگو برای `PAYMENT_SIGNATURE_SECRET`؛ مستندات: چگونه بدون downtime عوض کنیم
3. **2FA برای ADMIN**: TOTP (کتابخانه otplib یا معادل) — ثبت دستگاه در تنظیمات + الزام در login برای ADMIN؛ fallback recovery codes؛ همه پیام‌ها فارسی
4. **Rate limit های جاافتاده**: POST /api/lessons، POST /api/upload (مصرف Cloudinary)، /api/contact — با preset مناسب
5. **تست امنیت**: unit برای چرخش کلید (توکن با کلید قدیمی در دوره انتقال valid است) + audit log نوشته می‌شود + rate limit روی endpoint جدید

## محدودیت‌ها:
- backward compat: با `JWT_SECRET_OLD` خالی، رفتار کاملاً مثل قبل
- حریم خصوصی: در AuditLog هیچ password/token/محتوا ذخیره نشود (فقط meta غیرحساس)
- تست‌های موجود (auth, csrf, rate-limit, payment-signature) نشکنند

## معیار پذیرش:
- `npm run typecheck` + `npm test` پاس؛ تست‌های جدید امنیتی سبز
- چرخش JWT_SECRET بدون invalid شدن توکن‌های فعالِ پیش از چرخش
- ورود ADMIN بدون 2FA (وقتی فعال شده) رد می‌شود
- audit log برای login و payment:failed نوشته می‌شود
