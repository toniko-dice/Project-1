---
paths:
  - "src/lib/revalidate.ts"
  - "src/lib/urls.ts"
  - "src/lib/payload.ts"
  - "src/lib/search.ts"
  - "src/lib/title.ts"
  - "src/middleware.ts"
  - "src/app/(frontend)/api/kanon/**"
  - "src/collections/Redirects.ts"
---

# Кеш, адреси, пренасочвания, търсене

Подробно — `docs/funkcii/resheniya.md` (т. 14, 19, 20, 21), `tarsene-i-abonati.md`.

- **Кешът на четенията** (`unstable_cache` с тагове в `src/lib/payload.ts`): изтичането е **незабавно** — `revalidateTag(tag, { expire: 0 })`, не `'max'` (иначе първото зареждане след „Публикувай" показва старото). Таговете се чистят ПРЕДИ пътищата. Таговете са нарочно едри (`TAGS`).
- **`payload run` не опреснява нищо** — промяна за сайта минава през админа или REST, или после `POST /api/products/revalidate` с `x-revalidate-key`.
- **Билдът чете `.next/cache/fetch-cache`** — затова `prebuild` го трие (за `NEXT_DIST_DIR`). Не го махай.
- **2 MB таван на `unstable_cache`** — списъците четат само полетата на картата (`cardSelect` от `defaultPopulate`), дълбочина 1.
- **Адресите — само през `src/lib/urls.ts`** (`categoryPath`, `categoryUrl`, `productPath`, `productUrl`, `accessoriesPath`). Категория `/kategorii/<slug>`; подсерия — раздел `?sub=`; продукт `/kategorii/<серия>/<slug>`, серията е второто ниво (от виртуалните `categorySlug…`). `aksesoari` е запазен адрес на продукт.
- **Заглавието без наставка** — `pageTitle()` / `finalTitle` (`src/lib/title.ts`); „— EcoFlow България" само ако се събира в 60 знака.
- **Смяна на категория/slug → ред в „Пренасочвания"** (куките в `revalidate.ts`); middleware ги прилага с **301** (не 308) чрез `/api/kanon` (кеш 5 мин., таг `redirects`). Живият адрес никога не е `from` (`освободиАдреса`), освен при скрита категория. Без вериги и цикли.
- **Middleware, не `next.config`** — списъкът се мени, докато сайтът върви. Черта накрая и главни букви → 301 (`skipTrailingSlashRedirect`); `/api` с черта → 308. Адрес на категория с параметри → `X-Robots-Tag: noindex, follow`. Адрес с един сегмент също пита „Пренасочвания".
- **`/api/zaklyuchvane` и `/api/kanon` се прескачат в началото на middleware-а** (иначе се питат сами — кръг) и се питат на `INTERNAL_SERVER_URL`, не на адреса от заглавията.
- **Търсенето гледа едно скрито поле `searchText`** (малки букви, сглобено в JavaScript — `LIKE`/`lower()` на SQLite знаят само латиница). Ново поле за търсене → `SEARCH_FIELDS` + еднократно попълване. Резултатите се вадят до 100 и ПОСЛЕ се подреждат по точност.
- **Скритите категории** — `БЕЗ_СКРИТИ` във всяко четене на категории тук.
