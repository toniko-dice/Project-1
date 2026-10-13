---
paths:
  - "src/collections/**"
  - "src/globals/**"
  - "src/fields/**"
  - "src/blocks/**"
  - "src/lib/relations.ts"
  - "src/lib/availability.ts"
  - "src/payload.config.ts"
---

# Колекции, глобали, блокове (Payload)

Подробно и с историята — `docs/funkcii/resheniya.md`, `produkti-i-karti.md`,
`kategorii-i-menyu.md`, `aksesoari-i-filtri.md`.

## Не се връщат назад
- **`getPage` филтрира `_status: 'published'`** (`src/lib/payload.ts`) — иначе черновите излизат на сайта. Нова страница не се вижда, докато не е публикувана: при „страницата изчезна" първо статуса.
- **`categoryName` в `Products` е ВИРТУАЛНО** (`virtual: 'category.title'`) — колоната в списъка; истинско поле би остаряло при преименуване. `category` е с `disableListColumn`.
- **`RowLabel`** (`src/components/admin/RowLabel.tsx`) в масивите на `Header`, `Products`, панелите — иначе „Точка 01". След промяна в `admin.components` → `npm run generate:importmap`.
- **`orderable: true` + `defaultSort: '_order'`** (pages, products, categories, menu-panels, testimonials, awards, attributes) — без числови полета „Подредба". `_order` не се попълва за стари записи → `npm run backfill:order`. `orderable` е `@experimental`.
- **В блоковете НЯМА `required: true`** — `validate: requiredUnlessHidden` (`src/blocks/shared.ts`, гледа `blockData`). Едно празно задължително поле в скрит блок отказваше запис на цялата страница.
- **`defaultPopulate` на продукта** — само полетата за карта. Продукт, който сочи себе си (сравнителна таблица), увисва при `depth ≥ 2` без грешка. Нова карта, която чете поле от свързан продукт → полето в `defaultPopulate`, не по-голяма дълбочина. Запис на продукт от скрипт/REST → `depth: 0`.
- **`defaultPopulate` съдържа `category: true` изрично** — иначе `sanitizeSelect` го дописва в споделения обект, ключовете в зареждача се разминават и връзките остават номера (празна начална при първото попълване в процеса).
- **`resolvedRelations` / `publishedRelation`** (`src/lib/relations.ts`) — блоковете не показват чернова и не изхвърлят мълчаливо: незаредена връзка се пише в лога.

## Полета, които изглеждат излишни, но не са
- **„Скрит" на всеки блок** и **„Надпис в лентата с котви"** се слагат централно (`withHidden` в `Pages.ts` / `pageLayout.ts`), не във всеки блок.
- **Продуктът — едно поле „Категории"** (`categories`, първата е основната → адрес, трохи). `category` е скрито копие на първата (`syncPrimaryCategory`, `beforeValidate`) — адресът, виртуалните `categorySlug`/`categoryParentSlug`/`categoryGrandparentSlug` и `defaultPopulate` четат него.
- **Наличност — 3 стойности, едно място:** `src/lib/availability.ts` (опции, ред под цената, Schema.org, надпис на бутона `button`). Вносът спира непозната стойност.
- **`ean2`** — втори баркод на комплект; в Schema.org влиза само първият. Групата „Идентификация" в спецификациите се сглобява от SKU и баркодовете.
- **`tabbedShowcase`** — редовете със стойности НЕ се трият при смяна на подредбата. `layout` е текстова колона: нова стойност не иска миграция.
- **Категориите** — 3 нива (главна → серия → подсерия); `fullTitle` е `useAsTitle` (сглобява се, каскадира). **„Скрита"** (`hidden`) — изключена от всички четения (`БЕЗ_СКРИТИ` в `src/lib/payload.ts`); пренасочването от адреса ѝ не се трие при запис.
- **Атрибути** — slug-ът е само за четене след създаване (параметър в адреса на филтъра); връзката в продукта е с `validate: () => true`; числата се пазят с точка.
- **Панелите в менюто** — редове „продукт + полета", без режими; цената не се копира; ред без продукт отпада при запис; празен раздел „Аксесоари" се пълни сам. Подробно — `.claude/rules/frontend.md`.
- **`Users`:** 5 грешни пароли → 15 мин. заключване (`maxLoginAttempts`, `lockTime`); `payload-token` `Secure` на продукция; последният администратор не се сваля/трие.
- **Лексикален текст от Markdown** — `convertMarkdownToLexical` (вносът на SEO и страници).
- `push: false` в конфигурацията — схемата се мени само с миграции (`.claude/rules/migracii-i-baza.md`).
- След промяна в полета → `npm run generate:types`; в `admin.components` → `npm run generate:importmap`.
