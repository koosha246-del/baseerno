# طراحی پنل کاربری چندنقشی — بصیر نو

**تاریخ:** 2026-06-28
**وضعیت:** تأییدشده توسط کاربر

## هدف

ساخت پنل کاربری (Dashboard) چندنقشی برای ۳ نقش: دانش‌آموز (Student)، معلم (Teacher)، مدیر (Admin). منوها و محتوای هر بخش بر اساس نقش کاربر تغییر می‌کند. مطابق تصویر مرجع (داشبورد تیره با سایدبار چپ و کارت‌های آماری).

## تصمیمات فناوری

| حوزه | فناوری |
|------|--------|
| فریم‌ورک | Next.js 15 (App Router) — موجود |
| دیتابیس | PostgreSQL + Prisma ORM |
| احراز هویت | JWT + bcrypt (دستی، بدون NextAuth) |
| session | httpOnly cookie |
| UI | کامپوننت‌های موجود + تم تیره برای پنل |

## معماری

```
src/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (auth)/register/page.tsx
│   ├── (dashboard)/layout.tsx          ← محافظت‌شده
│   └── (dashboard)/dashboard/*         ← صفحات بر اساس نقش
├── lib/auth/                            ← jwt, password, session, middleware
├── lib/db/prisma.ts
├── app/api/auth/                        ← register, login, logout, me
├── prisma/schema.prisma
└── features/dashboard/                  ← کامپوننت‌های داشبورد
```

## Schema دیتابیس

- **User**: id, name, email (unique), passwordHash, role (STUDENT|TEACHER|ADMIN), avatar, createdAt
- **Course**: id, title, subtitle, description, mentorId (FK User), price, originalPrice, level, category, durationHours, lessons, rating, glyph, accent, published, createdAt
- **Enrollment**: id, userId, courseId, progress, status, enrolledAt, completedAt
- **Grade**: id, enrollmentId, userId, courseId, score, feedback, gradedAt, teacherId
- **Certificate**: id, userId, courseId, enrollmentId, certificateNumber, issueDate
- **Payment**: id, userId, courseId, amount, status (PENDING|PAID|FAILED), method, paidAt, createdAt
- **Message**: id, senderId, receiverId, body, read, sentAt

## نقشه منو بر اساس نقش

| # | دانش‌آموز | معلم | مدیر |
|---|-----------|------|------|
| ۱ | داشبورد | داشبورد | داشبورد |
| ۲ | دوره‌های من | کلاس‌های من | مدیریت کاربران |
| ۳ | نمرات | مدیریت نمرات | مدیریت دوره‌ها |
| ۴ | گواهی‌نامه‌ها | محتوا/درس‌ها | مالی/درآمد کل |
| ۵ | پرداخت‌ها | درآمد | گزارش‌ها |
| ۶ | پیام‌ها | پیام‌ها | تنظیمات |
| ۷ | تنظیمات | تنظیمات | — |

## احراز هویت

- **register**: POST /api/auth/register → ایجاد کاربر + هش bcrypt + توکن JWT در cookie
- **login**: POST /api/auth/login → بررسی ایمیل/پسورد + توکن JWT در cookie
- **logout**: POST /api/auth/logout → پاک کردن cookie
- **me**: GET /api/auth/me → اطلاعات کاربر فعلی
- **middleware**: محافظت `/dashboard/*` و `/api` (در صورت نیاز)، هدایت به `/login` اگه توکن نباشد

## امنیت

- bcrypt با ۱۲ راند برای هش پسورد
- JWT با HS256 و secret از env
- httpOnly + secure + sameSite cookie
- انقضای توکن: ۷ روز
- separation of concerns: نقش‌ها در سطح API و UI بررسی می‌شوند

## داده‌های اولیه (seed)

سه کاربر نمونه برای هر نقش با پسورد `123456`:
- student@baseerno.ir / 123456
- teacher@baseerno.ir / 123456
- admin@baseerno.ir / 123456

به‌علاوه دوره‌ها، ثبت‌نام‌ها، نمرات، پرداخت‌ها و گواهی‌نامه‌های نمونه.

## طراحی بصری پنل

- تم تیره (separate from light public site)
- سایدبار چپ، قابل جمع‌شدن در موبایل (Sheet)
- نوار بالا: آواتار، نام، badge نقش، دکمه خروج
- کارت‌های آماری با گرادینت برند
- responsive و RTL-first
