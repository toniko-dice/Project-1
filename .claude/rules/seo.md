---
paths:
  - "src/lib/seo.ts"
  - "src/lib/site-url.ts"
  - "src/lib/organization.ts"
  - "src/lib/title.ts"
  - "src/app/(frontend)/sitemap.ts"
  - "src/app/robots.ts"
  - "src/seo-check.ts"
  - "src/import-seo.ts"
  - "src/fields/seo.ts"
---

# Техническо SEO

Подробно — `docs/funkcii/seo.md`, `stranici.md`.

- **Адресът на сайта е ЕДНА настройка** — `NEXT_PUBLIC_SITE_URL`, четена само в `src/lib/site-url.ts` (`SITE_URL`, `absoluteUrl`).
- **robots.txt:** `Allow: /api/media/` ПРЕДИ `Disallow: /api/` — иначе Google не вижда снимките. При заключен сайт или `SITE_NOINDEX` — `Disallow: /`.
- **Празна категория** (без публикуван продукт в разклонението) → `noindex, follow` и извън sitemap, автоматично (`isEmptyCategory`, `categoryNoindex`).
- **Мета заглавие:** наставката само ако се събира в 60 знака (`finalTitle`); еднакви имена на категории получават родителя.
- **Мета описание на категория** при празно поле — автоматично, до 155 знака.
- **H1 на началната** — „Общи настройки", не страницата; заглавието на главния банер е H2.
- **Product JSON-LD:** `seller: dice.bg`, `gtin13` само с вярна контролна цифра; БЕЗ `aggregateRating`/`review` без истински отзиви. Една `Organization` (`src/lib/organization.ts`, `@id …/#organization`).
- **Sitemap:** до 10 снимки на продукт (`large`); страниците — от видимите секции; скритите и празните категории — извън.
- **`/tarsene` е `noindex`**, не е забранен в robots (иначе `noindex` не се чете).
- `npm run seo:check` — нищо не пише; иска работещ сървър.
