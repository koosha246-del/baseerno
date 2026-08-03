# CI/CD — بصیر نو

## Pipeline فعلی (GitHub Actions)

### ۱. `quality` job (روی push به main/develop و هر PR)

| مرحله | دستور |
|---|---|
| Install + Prisma generate | `npm ci` → `npx prisma generate` |
| Migration safety | `npx prisma migrate deploy` روی Postgres سرویس خالی (تأیید سالم‌بودن migration ها) |
| Lint | `npm run lint` |
| Type check | `npm run typecheck` |
| Unit tests | `npm test` |
| **Coverage gate** | `npx vitest run --coverage` — شکست اگر زیر thresholds (lines 70 / functions 75 / branches 60 / statements 70) |
| Build | `npm run build` |

سرویس: Postgres 16 (healthcheck). env ها: `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_NAME`.

### ۲. `e2e` job (Playwright، بعد از quality)

- Postgres سرویس + `prisma migrate deploy` + `npx playwright install --with-deps chromium`
- `npm run build` سپس `npx playwright test` — سرور را خودِ Playwright از `webServer` در `playwright.config.ts` بالا می‌آورد (`npm start` در CI).
- همه ۶ spec در `e2e/` اجرا می‌شوند: auth, catalog, checkout, dashboard, learning, signup.

### ۳. `deploy.yml` (روی push به main)

1. دپلوی Vercel (prebuilt)
2. ثبت release در Sentry

## افزودن تست‌ها

- واحد: `src/**/*.test.ts` → `npm test`
- integration (Postgres واقعی): `src/lib/__tests__/integration/*` — خودکار skip وقتی `DATABASE_URL` نیست؛ در CI روی سرویس Postgres اجرا می‌شوند.
- E2E: `e2e/*.spec.ts` → `npx playwright test`
- Load: `npm run test:load` (k6 — نیاز به نصب k6 محلی)

## Runbook: Rollback

### Vercel
1. در داشبورد Vercel → پروژه → Deployments → آخرین دپلوی سبز قبلی → `Promote to Production`.
2. تأیید: `curl -I https://baseerno.ir` (200) + `/api/health` (200/ok).

### Railway
1. `railway up` یا revert در داشبورد به commit قبلی.
2. worker ایمیل: اگر باگ در `email-queue` بود، سرویس `worker` را pause کن تا fix دپلوی شود.

### دیتابیس
- migration های expand/contract طراحی شده‌اند؛ در rollback دیتابیس را migrate-deploy نکن (نسخه قبلی app با schema جدید سازگار است).
- اگر migration واقعاً شکست: `scripts/backup-db.sh` → restore از آخرین backup (RPO ≤ ۲۴h).

### Decision tree
```
Health 503?           → DB down? → restore/backup
                        → Redis down? → فنی نیست (fallback فعال است)
E2E red?              → regression → revert آخرین دپلوی app
Emails گیر کرده؟      → سرویس worker را چک کن (لاگ + backlog در /api/health)
```

## Secrects موردنیاز GitHub

`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` — همگی در GitHub Settings → Secrets.

## ابزارها

- k6: `npm run test:load` (اسکریپت: `scripts/load/k6-script.js`)
- Coverage: `npm run test:coverage`
- مرزهای معماری: `npm run check:boundaries`
