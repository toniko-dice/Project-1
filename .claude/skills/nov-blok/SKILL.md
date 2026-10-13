---
name: nov-blok
description: Добавяне на нов блок (секция) за страниците, продуктите или категориите в Payload — полета, миграция, типове, importmap, компонент, внос. Ползвай при „нов блок", „нова секция в админа".
---

# Нов блок в Payload

Правилата — `.claude/rules/payload-kolekcii.md`, `.claude/rules/frontend.md`.

1. `git status`.
2. **Конфигурация** — `src/blocks/<Име>.ts` (или `src/blocks/guide/`, `about/`, `product/`):
   - БЕЗ `required: true` — `validate: requiredUnlessHidden` (`src/blocks/shared.ts`);
   - етикети на български; описания, които казват на собственика какво прави полето;
   - снимка — `upload` към `media`; продукти — връзка, данните идват от продукта (`productCardData`), не се копират.
3. Регистрирай блока в колекцията (`Pages.ts` / `pageLayout.ts`, `Products.ts`, `Categories.ts`). „Скрит" и „Надпис в лентата с котви" се добавят централно — не ги пиши в блока.
4. `npm run generate:types`.
5. Ако има `admin.components` → `npm run generate:importmap`.
6. **Миграция** — skill `migraciya`.
7. **Рендер** — компонент в `src/components/blocks/…` + `case` в `src/components/RenderBlocks.tsx`. Връзки — през `resolvedRelations` (без чернови). Снимки на секции — `SectionImage`; карти — `CardImage`; хоризонтални ленти — `ScrollRow`.
8. **Вносът** (`src/import-page.ts` / `import-product-core.ts`) — ако блокът ще идва от JSON.
9. Проверка: `build:local` + `next start` върху копие на базата; телефон 375 px и компютър.
10. commit + push → skill `deploy` (миграцията се пуска там).
