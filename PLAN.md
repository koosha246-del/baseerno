# Plan: Phase 2 — Full Site Completion

## User Choices
- **Database**: Local PostgreSQL
- **Payment**: Simulate (no real gateway, full checkout flow with mock)
- **File Upload**: Cloudinary
- **Email**: Resend

---

## Task 1: Prisma + PostgreSQL (3-4h)

**Goal**: Replace in-memory store with real PostgreSQL database.

### 1a. Schema Definition
**File**: `prisma/schema.prisma`
- Define 8 models: User, Course, Enrollment, Grade, Certificate, Payment, Message, PasswordReset
- Add relations, indexes, enums (Role, EnrollmentStatus, PaymentStatus, CourseLevel)
- Add `url = env("DATABASE_URL")` to datasource

### 1b. Migration & Seed
- Run `npx prisma migrate dev --name init`
- Create `prisma/seed.ts` — port seed data from `inMemoryStore.ts`
- Add `prisma.seed` to `package.json`

### 1c. Repository Swap
**File**: `src/lib/db/repository.ts`
- Replace in-memory operations with `@prisma/client` calls
- Keep the same `repository` export interface — all callers unchanged
- Delete `src/lib/db/inMemoryStore.ts` after swap

### 1d. Env Update
**File**: `.env`
- Update `DATABASE_URL` to point to local PostgreSQL (user: postgres, db: baseerno)

**Verification**: `npx prisma migrate dev`, `npm run typecheck`, `npm test`

---

## Task 2: Cloudinary Upload (2-3h)

**Goal**: File upload for avatars, course images, lesson videos.

### 2a. Install & Configure
- Install `cloudinary` SDK
- Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` to `.env`

### 2b. Upload API
**New file**: `src/app/api/upload/route.ts`
- POST: accept multipart file, upload to Cloudinary, return URL
- Auth required, max 10MB, accept image/video types

### 2c. Upload Component
**New file**: `src/components/shared/FileUpload.tsx`
- Drag & drop or click-to-upload
- Preview for images, progress bar
- Reusable: avatar upload, course cover, lesson video

### 2d. Wire Into Existing Pages
- `src/app/(dashboard)/dashboard/settings/SettingsForm.tsx` — add avatar upload
- `src/app/(dashboard)/dashboard/content/page.tsx` — add lesson file upload

**Verification**: Upload test image via settings page, verify Cloudinary URL stored

---

## Task 3: Payment Simulation + Checkout Flow (3-4h)

**Goal**: Complete checkout flow with simulated payment gateway.

### 3a. Enrollment API
**New file**: `src/app/api/checkout/route.ts`
- POST: { courseId, studentInfo }
- For paid courses: create Payment record (status: PENDING), simulate gateway redirect
- For free courses: create Enrollment directly

### 3b. Payment Callback
**New file**: `src/app/api/checkout/callback/route.ts`
- GET: simulate payment confirmation (always success for demo)
- Update Payment status to PAID, create Enrollment
- Redirect to dashboard with success message

### 3c. CheckoutForm Update
**File**: `src/features/course-detail/components/CheckoutForm.tsx`
- Replace `console.log` stub with real `fetch("/api/checkout")` call
- Handle redirect to callback URL

**Verification**: Register new student, enroll in free course, enroll in paid course (simulated)

---

## Task 4: Email with Resend (2-3h)

**Goal**: Transactional emails for key events.

### 4a. Install & Configure
- Install `resend`
- Add `RESEND_API_KEY` to `.env`
- Create `src/lib/email.ts` — Resend client wrapper

### 4b. Email Templates
**New file**: `src/lib/email-templates.ts`
- `welcomeEmail(name)` — after registration
- `paymentConfirmation(name, course, amount)` — after payment
- `passwordResetLink(name, resetUrl)` — for forgot password

### 4c. Wire Into Existing Flows
- `src/app/api/auth/register/route.ts` — send welcome email
- `src/app/api/checkout/callback/route.ts` — send payment confirmation
- `src/app/api/auth/forgot-password/route.ts` — send real email

**Verification**: Check Resend dashboard for sent emails after registration

---

## Task 5: Course Management (2h)

**Goal**: Admin/teacher can manage courses from dashboard.

### 5a. Course CRUD API
**New files**: `src/app/api/courses/route.ts`, `src/app/api/courses/[id]/route.ts`
- GET/POST/PATCH/DELETE with role-based auth

### 5b. Course Form
**New file**: `src/app/(dashboard)/dashboard/content/CourseForm.tsx`
- Create/edit form with all course fields + image upload

### 5c. Content Page Update
**File**: `src/app/(dashboard)/dashboard/content/page.tsx`
- Fetch real courses, add/edit/delete buttons

**Verification**: Create new course from dashboard, see it on public course list

---

## Task 6: Search (1h)

**Goal**: Course search on homepage and message search in dashboard.

### 6a. Course Search
**File**: `src/features/courses/components/PopularCoursesSection.tsx`
- Add search input, filter client-side by title/subtitle

### 6b. Message Search
**File**: `src/app/(dashboard)/dashboard/messages/page.tsx`
- Add search input, filter by body content

---

## Task 7: OG Images & PWA Assets (30min)

**Goal**: Generate missing SEO/social assets.

- `public/og/default.png` — 1200x630 branded image (imagegen skill)
- `public/apple-icon.png` — 180x180 icon

---

## Task 8: E2E Test Scenarios (2h)

**Goal**: End-to-end tests for critical flows.

- Install `@playwright/test`
- `e2e/auth.spec.ts` — Register → Login → Dashboard
- `e2e/checkout.spec.ts` — Browse → Select → Checkout → Enrollment

---

## Execution Order
1. **Prisma + PostgreSQL** (Task 1) — foundation
2. **Cloudinary Upload** (Task 2) — needed for courses
3. **Payment Simulation** (Task 3) — core business
4. **Course Management** (Task 5) — uses DB + upload
5. **Email with Resend** (Task 4) — notifications
6. **Search** (Task 6) — UX
7. **OG Images** (Task 7) — quick win
8. **E2E Tests** (Task 8) — QA

## Final Verification
- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm test` ✅
- `npm run build` ✅
- Manual test: full user journey from registration to course completion
