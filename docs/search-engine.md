# موتور جستجوی اختصاصی (Meilisearch)

جستجوی دورهها یک fallback سه لایه دارد (کد: `src/lib/db/domains/search.repo.ts`):

1. **Meilisearch** — وقتی `SEARCH_HOST` + `SEARCH_API_KEY` تنظیم شدهاند (بهترین relevance)
2. **Postgres FTS** — جدول `CourseSearch` با tsvector (ایندکس GIN)
3. **LIKE scan** — همیشه کار میکند (آخرین چاره)

اگر موتور اختصاصی پیکربندی نشده باشد یا down باشد، سیستم خودکار به لایههای بعدی میرود.

## راهاندازی محلی

```bash
# ۱. بالا آوردن Meilisearch (پورت 7700)
npm run search:up

# ۲. تنظیم env (از قبل در .env.example فعال است)
#    SEARCH_HOST=http://localhost:7700
#    SEARCH_API_KEY=baseerno-dev-master-key

# ۳. ایندکس کردن دورهها با تنظیمات فارسی (غلطیابی، stop words)
npm run seed:search
```

`seed:search` (اسکریپت `prisma/seed-meilisearch.ts`) این کارها را انجام میدهد:

- ایندکس `courses` را با تنظیمات فارسی پیکربندی میکند (`PATCH /indexes/courses/settings`):
  - `searchableAttributes`: title اولویت دارد
  - `filterableAttributes`: فیلتر سمت سرور `published = true`
  - `stopWords`: کلمات پرتکرار فارسی (و، در، به، از، ...)
  - `typoTolerance` با آستانه پایینتر (oneTypo: 4 بهجای 5) چون کلمات فارسی کوتاهترند
- ایندکس را پاک و از نو میسازد (دورههای unpublished حذف میشوند)
- **خود-تأیید میکند**: جستجوی دقیق + جستجوی غلط املایی روی یک دوره واقعی
  (مثلاً «مکالمه» ← «مکلمه») و در صورت نرسیدن hit با خطا خارج میشود

## تأیید end-to-end

```bash
# حالت ایندکس: جستجو باید از Meilisearch برگردد (نیاز به SEARCH + DB)
npm run verify:search:index

# حالت fallback: SEARCH_* از env حذف میشود و باید FTS/LIKE جواب دهد (فقط DB)
npm run verify:search:fallback

# هر دو پشت سر هم
npm run verify:search
```

## عملیات (Operations)

| کار | دستور |
|---|---|
| دیدن سلامت موتور | `curl http://localhost:7700/health` |
| سلامت از داخل برنامه | `GET /api/health` → `checks.search: "ok"` |
| همگامسازی دستی | `POST /api/admin/search-sync` (ادمین) |
| همگامسازی خودکار | رویداد `search:needs-sync` → `syncCourseSearch` (هم FTS هم ایندکس) |

## نکتهها

- کلید master حداقل ۱۶ کاراکتر باید باشد؛ در docker-compose پیشفرض
  `baseerno-dev-master-key` است — برای production حتماً تغییرش بده.
- دیتای ایندکس در volume ی `meili_data` ذخیره میشود.
- کلاینت بدون هیچ وابستگی SDK با REST مستقیم کار میکند
  (`src/lib/search/client.ts`) — اگر Typesense بخواهی فقط همین یک فایل عوض میشود.
