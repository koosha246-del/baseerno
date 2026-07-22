# بصیر نو — Baseer No (بیان برتر)

> آکادمی مهارت‌های بیان و ارتباط مؤثر

A production-grade, RTL-first Persian educational platform built with Next.js 15, TypeScript, Prisma, and Framer Motion.

[![CI](https://img.shields.io/badge/CI-passing-brightgreen)](.github/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-Private-red)]()

---

## 🏗 Architecture

Feature-sliced, token-driven, enterprise-grade:

```
src/
├── app/              # Next.js App Router (layout, page, boundaries, SEO generators)
├── components/
│   ├── ui/           # shadcn/ui primitives (Button, Card, Accordion, Sheet…)
│   ├── shared/       # Cross-feature building blocks (Container, ScrollReveal, Marquee…)
│   └── certificates/ # Certificate print templates
├── features/         # 9 self-contained homepage sections + dashboard
├── providers/        # ThemeProvider
├── hooks/            # App-wide hooks
├── lib/              # Design tokens, motion, auth, db, email, pdf, monitoring
├── config/           # Site metadata, navigation
├── constants/        # Aria labels, external URLs
├── types/            # Shared TypeScript types
└── styles/           # RTL overrides
```

## ✨ Key Features

- **RTL-first** — `<html lang="fa" dir="rtl">`, logical properties, Vazirmatn font
- **Design system** — centralized tokens → Tailwind utilities, zero hardcoded values
- **Auth** — JWT + httpOnly cookies + CSRF + rate limiting + RBAC (STUDENT/TEACHER/ADMIN)
- **Database** — PostgreSQL via Prisma ORM (10 models, relations, indexes)
- **Payment** — Simulated gateway with HMAC-signed callbacks (Zarinpal-ready)
- **Email** — Resend transactional emails (welcome, reset, payment, contact)
- **Upload** — Cloudinary (avatars, course covers, lesson videos)
- **SEO** — metadata, Open Graph, JSON-LD (Organization/Course/FAQ/Breadcrumb), sitemap, robots
- **Accessibility** — WCAG AA+, skip link, ARIA, focus management
- **Forms** — React Hook Form + Zod with Persian validation
- **PWA** — Service worker for offline shell
- **Monitoring** — Sentry-ready with server-side capture helper
- **CI/CD** — GitHub Actions with Postgres service for tests
- **Container** — Multi-stage Dockerfile + docker-compose

### Dashboard (Role-aware: STUDENT / TEACHER / ADMIN)

- **Global Search** — TopBar fuzzy search across courses, messages (and users for ADMIN) with debounced live results
- **Notifications** — Bell-icon dropdown with unread badge, polling, mark-as-read, triggers on enrollment / payment / grade / message / certificate
- **Reports** — Recharts visualisations (enrollments, revenue, role distribution, top courses) backed by DB aggregations
- **Certificates** — Auto-issued on course completion; downloadable as real PDF via `@react-pdf/renderer`
- **Messages** — Threaded inbox with mark-as-read on view, batch "mark all read" per sender
- **Course Player** — `/courses/[id]/learn` page with sequential lessons, video player, free preview
- **Lesson Management** — Admin/Teacher CRUD via `/api/admin/lessons` with reorder & publish controls

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 20.9.0
- **PostgreSQL** ≥ 14 (or Docker)
- **npm** 10+

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in the required values. **Required:** `DATABASE_URL`, `JWT_SECRET`. **Optional** (the app falls back to mocks if absent): `RESEND_API_KEY`, `CLOUDINARY_*`, `SENTRY_DSN`, `REDIS_URL`.

Generate a strong `JWT_SECRET`:

```bash
openssl rand -base64 48
```

### 3. Initialize the database

```bash
npx prisma migrate dev --name init
npm run seed
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Student | student@baseerno.ir | 123456 |
| Teacher | teacher@baseerno.ir | 123456 |
| Admin | admin@baseerno.ir | 123456 |

## 🧪 Testing

```bash
npm run typecheck   # TypeScript strict mode
npm run lint        # ESLint
npm test            # Vitest unit tests
npm run test:e2e    # Playwright end-to-end
```

## 🐳 Docker

```bash
docker-compose up -d
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npm run seed
```

App will be at [http://localhost:3000](http://localhost:3000).

## 🚢 Production Deployment

### Option A: Vercel (Recommended)

1. Push your repo to GitHub
2. Import to [Vercel](https://vercel.com)
3. Add environment variables in the Vercel dashboard
4. Provision a managed Postgres:
   - [Supabase](https://supabase.com) (free tier works)
   - [Neon](https://neon.tech) (serverless Postgres)
   - [Railway](https://railway.app)
5. Update `DATABASE_URL` in Vercel
6. Deploy — Vercel auto-builds on push to `main`

The included `.github/workflows/deploy.yml` automates Vercel deployments.

### Option B: Self-Hosted with Docker

```bash
# On your server
git clone <your-repo>
cd <your-repo>
cp .env.example .env  # fill in production values
docker-compose -f docker-compose.yml up -d
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npm run seed
```

Use a reverse proxy (Caddy / Nginx / Traefik) to enable HTTPS.

### Option C: VPS (Manual)

```bash
# 1. Provision a Postgres database
# 2. Clone & install
git clone <repo> && cd <repo>
npm ci --omit=dev
npx prisma generate
npx prisma migrate deploy
npm run build

# 3. Run with PM2
npm install -g pm2
pm2 start npm --name "bayan" -- start
pm2 save && pm2 startup
```

## 🔒 Security Checklist

Before going to production:

- [ ] Generate a strong `JWT_SECRET` (≥ 32 random bytes)
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS / HSTS
- [ ] Set up database backups
- [ ] Configure `SENTRY_DSN` for error monitoring
- [ ] Verify email domain in Resend
- [ ] Switch payment simulation to real Zarinpal credentials
- [ ] Review `middleware.ts` rate limits
- [ ] Set up CSP headers (currently using Next.js defaults)

## 🧭 API Endpoints (Dashboard surface)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/search?q=` | any | TopBar global search |
| `GET` | `/api/notifications` | any | List current user's notifications |
| `POST` | `/api/notifications` | admin | Manually create a notification |
| `PATCH` | `/api/notifications/[id]/read` | owner | Mark single notification read |
| `PATCH` | `/api/notifications/read-all` | owner | Mark all notifications read |
| `PATCH` | `/api/messages/[id]/read` | owner | Mark message read |
| `GET` | `/api/courses/[id]/lessons` | any | List published lessons for a course |
| `POST` | `/api/admin/lessons` | admin/teacher | Create lesson |
| `PATCH` | `/api/admin/lessons/[id]` | admin/teacher | Update / reorder / publish lesson |
| `GET` | `/api/certificates/[id]/data` | owner / admin | Certificate data for PDF render |
| `GET` | `/api/certificates/[id]/pdf` | owner / admin | Download certificate PDF |

## ✅ Manual Test Checklist (Dashboard)

- [ ] TopBar search returns matching courses, messages (and users for ADMIN)
- [ ] Reports page renders 4 charts with real aggregated data
- [ ] Bell icon shows correct unread count; dropdown lists recent notifications
- [ ] Notifications are created on: enrollment success, payment success, grade posted, message received, certificate issued
- [ ] "Mark all as read" clears the badge
- [ ] Certificate page downloads a valid PDF
- [ ] Messages get marked read when opened
- [ ] Lesson CRUD works for ADMIN/TEACHER; STUDENT sees only published, ordered lessons

## 📊 Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3.4 |
| UI | shadcn/ui + Radix UI |
| Animation | Framer Motion 11 |
| Database | PostgreSQL + Prisma 7 |
| Auth | JWT (jose) + httpOnly cookies |
| Forms | React Hook Form + Zod |
| Email | Resend |
| Upload | Cloudinary |
| Icons | Lucide React |
| Font | Vazirmatn (next/font/google) |
| Testing | Vitest + Playwright |
| Monitoring | Sentry-ready |
| CI | GitHub Actions |
| Container | Docker + docker-compose |

## 📄 License

Private — All rights reserved.

---

## 🤝 Contributing

Internal project. Contact the maintainers for contribution guidelines.
