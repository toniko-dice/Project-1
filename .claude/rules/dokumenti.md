---
paths:
  - "src/collections/Documents.ts"
  - "src/lib/documents.ts"
  - "src/components/DocumentList.tsx"
  - "src/components/DocumentsExplorer.tsx"
  - "src/app/(frontend)/dokumenti/**"
  - "src/import-dokumenti.ts"
  - "src/futar-dokumenti.ts"
  - "scripts/dokumenti/**"
  - "content/dokumenti/**"
---

# Документи (ръководства, инструкции, PDF)

Подробно — `docs/funkcii/dokumenti.md`. Нов документ — skill `nov-dokument`.

- **Колекция `documents`** (upload, само PDF) — файловете в `media/dokumenti` (влизат в архивите и в `db:svali`). Адрес: `/api/documents/file/<име>.pdf` (HEAD дава 404 — нормално, GET е 200).
- **Ред: официален BG > превод > оригинал** (`sortDocuments`). „Скрит" — не се вижда на сайта, остава в админа. Документ за продукт, който го няма (или е скрит) → скрит.
- **Показва се:** раздел „Документи" на продуктовата страница (последен) и `/dokumenti` (филтри категория/серия/вид, търсене; в sitemap). Линкът във футъра — „Поддръжка → Документи".
- **nginx:** `/api/documents/file/` — без `X-Robots-Tag: noindex` (PDF-ите се индексират) и без общия лимит; качване през админа до 50 MB само за `/api/documents` (Payload — също 50 MB, `payload.config.ts`).
- **Пътищата** (PDF-ите не са в git; описът и скриптовете — да):
  - `content/dokumenti/opis.json|csv` — описът (`scripts/dokumenti/opis.py`; ръчните решения — `PRAVILA`, `BG_OFICIALNI`, `SKRITI_RESHENIE`);
  - `content/dokumenti/originali/<продукт|bez-produkt>/`, `svaleni.json` — `svali.py` (по SHA-256, без дубли);
  - `content/dokumenti/bg-oficialni/<slug>.pdf` — `bg-pdf.mjs` (manuals.ecoflow.com на bg_BG; `--en` → английските онлайн ръководства);
  - `content/dokumenti/prevodi/` — `spisak.json` (`izvleci.py`), `FORMAT.md`, преводите `<id>.md` (в git); `rechnik.md` — речникът;
  - `content/dokumenti/izvlecheni/`, `prevodi-en/<id>.en.md` — помощни, не са в git;
  - `content/dokumenti/bg-prevodi/<продукт>/<id>-bg.pdf`, `prevodi-gotovi.json` — `prevod-pdf.mjs` (само минали проверката).
  - `content/dokumenti/bg-izvadki.json` (в git) → `bg-oficialni/izvadki/<id>-bg-oficialen.pdf` — `bg-izvadki.py`: българската част на многоезичен оригинал (страниците на EcoFlow без промяна) = официален BG; кои оригинали имат такава — `bg-stranici.py`.
- **Вносът:** `npm run import:dokumenti:server` — качва липсващите PDF-и (наваксващо) и внася; повторяем (ключ: SHA-256 / адрес на източника / „bg-prevod" + оригинал); архив преди записа. Ръчни промени в админа по заглавие/продукти/„Скрит" се презаписват при следващ внос → трайното решение — в `opis.py`.
- **Преводът не се внася, ако проверката не мине** (числа, брой предупреждения, останал английски, покритие, PDF с кирилица).
- **ZIP за собственика:** `python scripts/dokumenti/zip.py` → `content/dokumenti/EcoFlow-dokumenti-<дата>.zip`; `opis.csv` има „файл" и „файл на български" (пътищата в ZIP-а, `opis.py`).
- **Имената на документите:** „<вид> — <име от EcoFlow>"; общ файл за няколко продукта → всички в името („EcoFlow 160W/220W/400W …").
