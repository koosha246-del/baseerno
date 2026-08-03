# مرجع API

فهرست کامل endpoint های HTTP پروژه (۳۸ route). قرارداد کلی:

- همه پاسخها JSON هستند؛ `Content-Type: application/json`.
- خطاها: `{ "error": "پیام فارسی" }` + کد وضعیت مناسب (400/401/403/404/409/429/500).
- احراز هویت: هدر `Authorization: Bearer <jwt>` یا کوکی سشن (بسته به `getCurrentUser`).
- همه mutation ها (POST/PATCH/DELETE) نیازمند CSRF توکن (هدر `x-csrf-token`) هستند.
- Rate limit: با preset های `AUTH` / `API` / `READ` / `SENSITIVE` از `src/lib/rate-limit.ts`.

## احراز هویت (`/api/auth`)

| متد | مسیر | توضیح | نقش | Rate limit |
|---|---|---|---|---|
| POST | `/auth/register` | ثبتنام کاربر | عمومی | AUTH |
| POST | `/auth/login` | ورود (JWT + سشن) | عمومی | AUTH |
| POST | `/auth/logout` | خروج و ابطال سشن | کاربر | API |
| GET | `/auth/me` | پروفایل کاربر جاری | کاربر | READ |
| POST | `/auth/forgot-password` | ارسال ایمیل بازنشانی | عمومی | AUTH |
| POST | `/auth/reset-password` | بازنشانی رمز با توکن | عمومی | AUTH |

## کاربر (`/api/user`)

| متد | مسیر | توضیح | نقش | Rate limit |
|---|---|---|---|---|
| PATCH | `/user/profile` | بهروزرسانی پروفایل | کاربر | API |
| POST | `/user/password` | تغییر رمز (نیاز به رمز فعلی) | کاربر | AUTH |
| POST | `/user/2fa` | فعالسازی TOTP (گام ۱: دریافت راز) | کاربر | SENSITIVE |
| PUT | `/user/2fa` | تأیید و فعالسازی TOTP با کد | کاربر | SENSITIVE |
| DELETE | `/user/2fa` | غیرفعالسازی TOTP (نیاز به رمز فعلی) | کاربر | SENSITIVE |

## دورهها (`/api/courses`)

| متد | مسیر | توضیح | نقش | Rate limit |
|---|---|---|---|---|
| GET | `/courses` | فهرست دورههای منتشرشده (کششده) | عمومی | READ |
| GET | `/courses/[id]` | جزئیات دوره | عمومی | READ |
| GET | `/courses/[id]/lessons` | درسهای دوره | عمومی | READ |
| POST | `/courses` | ساخت دوره | مدرس/ادمین | API |

## درسها (`/api/lessons`)

| متد | مسیر | توضیح | نقش | Rate limit |
|---|---|---|---|---|
| POST | `/lessons` | ساخت درس | مدرس/ادمین | API |

## ثبتنام و پرداخت (`/api/checkout`)

| متد | مسیر | توضیح | نقش | Rate limit |
|---|---|---|---|---|
| POST | `/checkout` | ساخت پرداخت + رفتن به درگاه | کاربر | SENSITIVE |
| GET | `/checkout/callback` | بازگشت از درگاه (نتیجه پرداخت) | عمومی | API |

## گواهی (`/api/certificates`)

| متد | مسیر | توضیح | نقش | Rate limit |
|---|---|---|---|---|
| GET | `/certificates/[id]/data` | داده گواهی (JSON) | دارنده/ادمین | READ |
| GET | `/certificates/[id]/pdf` | دانلود PDF گواهی | دارنده/ادمین | READ |

## پیامها (`/api/messages`)

| متد | مسیر | توضیح | نقش | Rate limit |
|---|---|---|---|---|
| GET | `/messages` | گفتگوها | کاربر | READ |
| POST | `/messages` | ارسال پیام | کاربر | API |
| POST | `/messages/[id]/read` | علامتگذاری خواندهشده | کاربر | API |

## نمرات (`/api/grades`)

| متد | مسیر | توضیح | نقش | Rate limit |
|---|---|---|---|---|
| POST | `/grades` | ثبت نمره | مدرس/ادمین | API |

## نوتیفیکیشن (`/api/notifications`)

| متد | مسیر | توضیح | نقش | Rate limit |
|---|---|---|---|---|
| GET | `/notifications` | فهرست اعلانها | کاربر | READ |
| POST | `/notifications/read-all` | خواندن همه | کاربر | API |
| POST | `/notifications/[id]/read` | خواندن یک اعلان | کاربر | API |
| GET | `/notifications/stream` | استریم SSE بلادرنگ | کاربر | — |

## دستیار AI (`/api/ai`)

| متد | مسیر | توضیح | نقش | Rate limit |
|---|---|---|---|---|
| POST | `/ai/conversations` | شروع گفتگو (courseId اختیاری) | کاربر | SENSITIVE |
| POST | `/ai/conversations/[id]/messages` | ارسال پیام (سقف ۲۰۰ توکن پاسخ) | کاربر | SENSITIVE |

## جستجو (`/api/search`)

| متد | مسیر | توضیح | نقش | Rate limit |
|---|---|---|---|---|
| GET | `/search?q=...` | جستجوی دوره/پیام/کاربر (کاربران: ادمین) | عمومی | API |

## کتابخانه (`/api/library`)

| متد | مسیر | توضیح | نقش | Rate limit |
|---|---|---|---|---|
| GET | `/library/[id]/download` | دانلود منبع با توکن امضاشده | کاربر | READ |

## آپلود (`/api/upload`)

| متد | مسیر | توضیح | نقش | Rate limit |
|---|---|---|---|---|
| POST | `/upload` | آپلود به Cloudinary | مدرس/ادمین | API |

## تماس (`/api/contact`)

| متد | مسیر | توضیح | نقش | Rate limit |
|---|---|---|---|---|
| POST | `/contact` | فرم تماس | عمومی | API |

## ادمین (`/api/admin`)

| متد | مسیر | توضیح | نقش | Rate limit |
|---|---|---|---|---|
| POST | `/admin/certificates` | صدور گواهی (publish رویداد certificate:issued) | ادمین | API |
| POST | `/admin/courses/[id]/moderate` | تأیید/رد دوره | ادمین | API |
| POST | `/admin/lessons` | ساخت درس | ادمین | API |
| PATCH | `/admin/lessons/[id]` | ویرایش درس | ادمین | API |
| DELETE | `/admin/lessons/[id]` | حذف درس | ادمین | API |
| POST | `/admin/search-sync` | همگامسازی دستی ایندکس جستجو | ادمین | API |

## سیستم و عملیات

| متد | مسیر | توضیح | نقش | Rate limit |
|---|---|---|---|---|
| GET | `/health` | بررسی سلامت (DB + Redis + جستجو + صف ایمیل) | عمومی (برای load balancer) | — |
| GET | `/metrics` | متریک تجاری (snapshot + reset) | ادمین | API |
| POST | `/cron/email` | کرون Vercel برای پردازش صف ایمیل (هدر `x-cron-secret`) | سیستم | — |

## الگوی invalidation (قرارداد مهم)

همه mutation ها بعد از تغییر، کش را از یک مسیر یکپارچه invalidate میکنند:

```ts
await invalidateCache(publishedCoursesCacheKeys(), [
  CACHE_TAGS.lessons,
  CACHE_TAGS.course(existing.courseId),
  CACHE_TAGS.courses,
]);
```

و side-effect ها (نوتیفیکیشن، ایمیل، جستجو، AuditLog، SSE) را **دستی صدا نمیزنند** —
رویداد publish میکنند:

```ts
await publish({ type: "certificate:issued", userId, courseName });
```

هیچ route ای بیش از ۳۰ خط نیست و هیچ route ای مستقیم repository صدا نمیزند.
