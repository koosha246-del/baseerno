# 🔒 Security Gaps Report

> تاریخ: ۱۴۰۵/۰۵/۰۲
> وضعیت: Draft — بر اساس audit کد, ۳۰ API endpoint

---

## ۱. Rate Limit Coverage

**معیار:** هر endpoint که state را تغییر می‌دهد (POST, PATCH, DELETE, PUT) باید `withRateLimit` داشته باشد.
GET endpoints نیاز ندارند مگر search (که می‌تواند expensive باشد).

### ✅ Rate Limited (17 endpoint)

| # | Method | Path | Preset | Status |
|---|--------|------|--------|--------|
| 1 | POST | /api/auth/register | AUTH (5/min) | ✅ |
| 2 | POST | /api/auth/login | AUTH (5/min) | ✅ |
| 3 | POST | /api/auth/forgot-password | AUTH (5/min) | ✅ |
| 4 | POST | /api/contact | API (20/min) | ✅ |
| 5 | POST | /api/checkout | SENSITIVE (3/2min) | ✅ |
| 6 | POST | /api/courses | API (20/min) | ✅ |
| 7 | PATCH | /api/courses/[id] | API (20/min) | ✅ |
| 8 | GET | /api/courses | READ (60/min) | ✅ |
| 9 | POST | /api/admin/lessons | API (20/min) | ✅ |
| 10 | PATCH | /api/admin/lessons/[id] | API (20/min) | ✅ |
| 11 | POST | /api/admin/lessons/[id] | API (20/min) | ✅ |
| 12 | POST | /api/admin/courses/[id]/moderate | API (20/min) | ✅ |
| 13 | POST | /api/admin/certificates | API (20/min) | ✅ |
| 14 | POST | /api/grades | API (20/min) | ✅ |
| 15 | POST | /api/messages | API (20/min) | ✅ |
| 16 | PATCH | /api/messages/[id]/read | API (20/min) | ✅ |
| 17 | PATCH | /api/notifications/[id]/read | API (20/min) | ✅ |

### ❌ Rate Limit Gap (0 endpoint — همه بسته شدند ✅)

> ⚠️ **اصلاح نهایی:** `PATCH /api/user/profile` و `POST /api/notifications` (ایجاد نوتیفیکیشن ادمین) هم rate limit + CSRF گرفتند که در گزارش اول جا افتاده بودند.

| # | Method | Path | Severity | وضعیت |
|---|--------|------|----------|--------|
| 1 | POST | /api/user/password | 🔴 CRITICAL | ✅ بسته شد |
| 2 | POST | /api/user/profile | 🟠 HIGH | ✅ بسته شد |
| 3 | POST | /api/upload | 🟠 HIGH | ✅ بسته شد |
| 4 | PATCH | /api/notifications/read-all | 🟡 MEDIUM | ✅ بسته شد |
| 5 | POST | /api/auth/logout | 🟡 MEDIUM | ✅ بسته شد |
| 6 | POST | /api/auth/reset-password | 🟠 HIGH | ✅ بسته شد |
| 7 | POST | /api/library/[id]/download | 🟠 HIGH | ✅ بسته شد |
| 8 | POST | /api/lessons | 🟡 MEDIUM | ✅ بسته شد |
| 9 | GET | /api/search | 🟢 LOW | ✅ بسته شد |
| 10 | GET | /api/courses/[id]/lessons | 🟢 LOW | ✅ بسته شد |

**✅ همه ۲۷ endpoint (GETهای عمومی به‌جز search/library) اکنون rate limited هستند.**

### اولویت رفع

1. 🔴 **POST /api/user/password** — ۵ req/min (آخرین خط دفاعی رمز)
2. 🟠 **POST /api/upload** — ۱۰ req/min (محدودیت مصرف Cloudinary)
3. 🟠 **POST /api/auth/reset-password** — ۵ req/min (جلوگیری از brute force توکن)
4. 🟠 **POST /api/library/[id]/download** — ۱۰ req/min
5. 🟠 **POST /api/user/profile** — ۲۰ req/min
6. 🟡 بقیه — ۲۰-۶۰ req/min

---

## ۲. CSRF Coverage

**معیار:** هر endpoint که state را تغییر می‌دهد و از cookie برای احراز هویت استفاده می‌کند باید `isSameOriginRequest` چک کند.

### ✅ CSRF Protected (17 endpoint)

| # | Method | Path | Status |
|---|--------|------|--------|
| 1 | POST | /api/auth/register | ✅ |
| 2 | POST | /api/auth/login | ✅ |
| 3 | POST | /api/auth/logout | ✅ |
| 4 | POST | /api/auth/forgot-password | ✅ |
| 5 | POST | /api/auth/reset-password | ✅ |
| 6 | POST | /api/contact | ✅ |
| 7 | POST | /api/checkout | ✅ |
| 8 | POST | /api/upload | ✅ |
| 9 | POST | /api/grades | ✅ |
| 10 | POST | /api/messages | ✅ |
| 11 | PATCH | /api/user/password | ✅ |
| 12 | PATCH | /api/user/profile | ✅ |
| 13 | POST | /api/courses | ✅ |
| 14 | PATCH | /api/courses/[id] | ✅ |
| 15 | POST | /api/admin/courses/[id]/moderate | ✅ |
| 16 | POST | /api/admin/certificates | ✅ |
| 17 | PATCH | /api/admin/lessons/[id] | ✅ |

### ❌ CSRF Gap (0 endpoint — همه بسته شدند ✅)

| # | Method | Path | Severity | وضعیت |
|---|--------|------|----------|--------|
| 1 | POST | /api/lessons | 🟠 HIGH | ✅ بسته شد (rate limit هم اضافه شد) |
| 2 | PATCH | /api/notifications/[id]/read | 🟡 MEDIUM | ✅ بسته شد |
| 3 | PATCH | /api/notifications/read-all | 🟢 LOW | ✅ بسته شد |
| 4 | PATCH | /api/messages/[id]/read | 🟢 LOW | ✅ بسته شد |
| 5 | GET | /api/library/[id]/download | 🟢 LOW | ✅ rate limited شد (GET است — CSRF لازم ندارد) |

**✅ همه endpointهای state-changing اکنون CSRF protected هستند.**

**نکته:** ۸ endpoint باقیمانده GET-only هستند و نیازی به CSRF ندارند (GETها state را تغییر نمی‌دهند).

### اولویت رفع

1. 🟠 **POST /api/lessons** — نیاز فوری به CSRF دارد
2. 🟡 بقیه — کم خطر، در صورت نیاز

---

## ۳. Security Headers

### وضعیت فعلی (در `next.config.mjs`)

| Header | مقدار | وضعیت |
|--------|-------|--------|
| `X-Frame-Options` | DENY | ✅ |
| `X-Content-Type-Options` | nosniff | ✅ |
| `Referrer-Policy` | strict-origin-when-cross-origin | ✅ |
| `X-XSS-Protection` | 1; mode=block | ✅ |
| `Permissions-Policy` | camera=(), microphone=(), geolocation=() | ✅ |

### موارد گمشده

| Header | پیشنهاد | Severity |
|--------|---------|----------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | ✅ **انجام شد** |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline' ...` | ✅ **انجام شد** |
| `Cross-Origin-Embedder-Policy` | `require-corp` | 🟢 LOW — برای آینده |

---

## ۴. Authentication Gaps

| # | Endpoint | نیاز به auth | وضعیت فعلی | Severity |
|---|----------|-------------|------------|----------|
| 1 | POST /api/lessons | TEACHER/ADMIN | ✅ دارد | — |
| 2 | POST /api/grades | TEACHER | ✅ دارد | — |
| 3 | PATCH /api/notifications/[id]/read | OWNER | ✅ (با findFirst) | — |
| 4 | PATCH /api/notifications/read-all | OWNER | ✅ | — |
| 5 | GET /api/notifications | OWNER | ✅ | — |
| 6 | POST /api/notifications | ADMIN | ✅ | — |
| 7 | POST /api/admin/* | ADMIN | ✅ | — |
| 8 | POST /api/upload | any authenticated | ✅ | — |

---

## ۵. خلاصه و اولویت‌بندی اقدامات

| Priority | Gap | Effort | Impact |
|----------|-----|--------|--------|
| 🔴 ۱ | Rate limit روی POST /api/user/password | ۱۵ دقیقه | جلوگیری از brute force رمز |
| 🔴 ۲ | Rate limit روی POST /api/auth/reset-password | ۱۵ دقیقه | جلوگیری از brute force توکن |
| 🟠 ۳ | Rate limit روی POST /api/upload | ۱۵ دقیقه | محافظت از مصرف Cloudinary |
| 🟠 ۴ | CSRF روی POST /api/lessons | ۱۵ دقیقه | جلوگیری از سوءاستفاده از سشن معلم |
| 🟠 ۵ | HSTS header | ۱۰ دقیقه | امنیت HTTPS |
| 🟠 ۶ | CSP header | ۳۰ دقیقه | جلوگیری از XSS |
| 🟡 ۷ | Rate limit روی ۴ endpoint دیگر | ۳۰ دقیقه | تکمیل پوشش |
| 🟢 ۸ | CSRF روی ۳ endpoint کم‌خطر | ۲۰ دقیقه | تکمیل پوشش |

**مجموع تلاش مورد نیاز:** ~۲.۵ ساعت برای همه gaps
**اولویت فوری (قابل انجام در ۳۰ دقیقه):**

1. 🔴 Rate limit روی POST /api/user/password — ✅ **انجام شد**
2. 🔴 Rate limit روی POST /api/auth/reset-password — ✅ **انجام شد**
3. 🟠 Rate limit روی POST /api/upload — ✅ **انجام شد**
4. 🟠 Rate limit روی POST /api/lessons — ✅ **انجام شد** (CSRF از قبل بود)