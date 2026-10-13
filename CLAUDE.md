@AGENTS.md

# EcoFlow България

Витрина на продуктовата гама на EcoFlow за българския пазар; фирмата (ДИ СИ
2008 ООД) е официален дистрибутор. **Покупката е в dice.bg** — сайтът няма
кошница, поръчки и плащания; бутонът води към продукта в dice.bg.
**Собственикът управлява всичко от админа** (продукти, категории, менюта,
банери, страници, SEO) — нова функция се прави редактируема, не зашита в
кода. Визията следва 1:1 eu.ecoflow.com, с текст на естествен български.

**Технологии:** Next.js 16 (Turbopack) · Payload CMS 3.88 · SQLite · Tailwind 4 · TypeScript · Sharp. Админът е на български.

<!-- Пренаредено на 13.10.2026 (task-claude-md-prenarezhdane.md): старият файл (3182 реда) е в docs/arhiv/CLAUDE-2026-10-13.md; разделите — в docs/funkcii/; правилата по части от кода — в .claude/rules/; процедурите — в .claude/skills/. -->

## Главната база е на сървъра

- Сайтът: **https://91.212.13.155** — заключен (`/vhod`), не се индексира (`SITE_NOINDEX=true`). Домейнът ecoflow.bg идва после.
- Истинските данни са на сървъра; локалната база е **само за тест на код**.
- **Внос за истинския сайт — само с `:server`** (`import:product:server`, `import:page:server`, `faq:dobavi:server`, `na-sarvara <скрипт>`). Без `:server` пише в локалната база.
- Нов код → `npm run deploy` (skill `deploy`).
- **НИКОГА `db:kachi-na-sarvara`** — би затрил редакциите на сървъра.
- SSH тунелът (`scripts\otvori-sayta.bat` → http://localhost:8080) е резервният вход.

## Работен ред — твърдите правила

- **Първо `git status`.** Питай, преди `reset`, `checkout --`, `clean`, `stash` или каквото и да е, което трие незаписани промени.
- **Всяка задача завършва с commit + push** (в worktree → `merge --ff-only` в `main` → `git push origin main`). Отчетът към собственика — на български.
- **Cowork и Code не пишат едновременно в едни и същи файлове.** `task-*.md` в главната папка са задачи от собственика/Cowork.
- **EAN — първо провери за дубли** в базата, преди да го запишеш.
- **Спецификации — само от EcoFlow или dice.bg**; нищо не се измисля; при аксесоари dice има предимство.
- **Официалните имена** на продуктите. **Скривай, не трий** (продукти, категории, блокове — „Скрит"/„Скрита"/чернова). **Slug-ове и адреси не се сменят.**
- **Цените — от dice.bg** (синхронизацията), не на ръка.
- **Телефонът на фирмата не се показва никъде** — връзката е имейлът и формата на `/kontakti`.
- **Скрипт, чийто флаг не си проверил в кода, не се пуска върху истинската база** (и не „на сухо").
- **Запис в истинската база — само със скрипт**, който прави архив и сравнява преди/след. Тестове с писане — върху копие (`VACUUM INTO`); върху копие не се пуска нищо, което архивира.
- **Никога не въвеждай паролата на собственика** и не ползвай/създавай неговите сесии.
- Смислените имена на снимки — само за снимки на продукти; снимка, ползвана от страница, не се преименува.
- `npm run build:local` — САМО за проверка на локалната машина, никога за сървъра.
- Без обещания за срокове — нито в кода, нито в текстовете.
- Отзивите на eu.ecoflow.com не се копират; адресите в dice.bg се проверяват по заглавието на страницата, не по slug-а.

## Най-важните команди

```bash
npm run dev                         # разработка (Turbopack); резерва: npm run dev:webpack
npm run generate:types              # след промяна в полета
npm run generate:importmap          # след промяна в admin.components
npm run migrate:create -- <име>     # после преглед на SQL-а (skill migraciya)
npm run migrate                     # архив + снимка + миграция + снимка
npm run health                      # снимка на базата
npm run deploy                      # кодът → сървъра
npm run import:product:server <slug>
npm run import:page:server <slug>
npm run na-sarvara <npm скрипт>     # скрипт върху базата на сървъра, с архив
npm run db:svali-ot-sarvara         # данните от сървъра → локално, за тест
npm run razblokirai [-- <IP>]       # fail2ban: отблокиране
npm run build:local                 # само локална проверка
npm run test:dice                   # тестът на парсера на dice.bg
```

Всички команди — `package.json`; описание — README.

## Къде е останалото

- **`.claude/rules/`** — правилата по части от кода; зареждат се сами, когато се пипат съответните файлове:
  `payload-kolekcii` · `migracii-i-baza` · `frontend` · `kesh-i-adresi` · `snimki-i-media` · `vnos` · `dice` · `zaklyuchvane-i-sigurnost` · `server-i-deploy` · `oferti-i-zayavki` · `biskvitki` · `seo`; `obshti` (винаги).
- **`.claude/skills/`** — процедури стъпка по стъпка: `vnos-na-produkt`, `vnos-na-stranica`, `deploy`, `nov-blok`, `migraciya`.
- **`docs/funkcii/`** — подробните описания и историята на всяка функция (пренесени дословно от стария CLAUDE.md); `resheniya.md` — 23-те решения, които НЕ се връщат назад, с причините (кратко — в правилата по тема: `defaultPopulate`, черновите, `RowLabel`, `orderable`, `requiredUnlessHidden` → `payload-kolekcii`; миграциите, архивите, „database is locked" → `migracii-i-baza`; кешът, адресите, пренасочванията, търсенето → `kesh-i-adresi`; CSS, `ScrollRow`, шрифтът, лентата с икони → `frontend`).
- **`docs/ostava.md`** — какво остава; `docs/sigurnost-server.md` — сигурността на сървъра; `docs/biskvitki-inventar.md`.
- **`docs/arhiv/CLAUDE-2026-10-13.md`** — старият CLAUDE.md, цял, за справка.
- **README** — за собственика: стартиране, сървър, защити, архиви, имейли.
