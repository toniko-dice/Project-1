# Разни

<!-- Пренесено дословно от CLAUDE.md на 13.10.2026 (task-claude-md-prenarezhdane.md). -->

Иконата (favicon), WAVE 2 Add-On Battery.

### Иконата и WAVE 2 Add-On Battery (`task-favicon-i-wave-baterija.md`, 12 октомври 2026)

- **Иконата „EF" като на eu.ecoflow.com** — по конвенцията на Next в
  `src/app/` (корена, не в `(frontend)`): `favicon.ico` (16/32/48),
  `icon.svg`, `apple-icon.png` (180, без прозрачност). Next ги слага в
  `<head>` на всяка страница — и на `/vhod`, и в админа. Манифестът —
  `src/app/manifest.ts` (`/manifest.webmanifest`, иконите 192/512 са в
  `public/`). Изходните файлове — `content/favicon/`; старата иконка от
  шаблона — `content/favicon/staro/`. `theme-color` няма и не е добавян.
- **Админът:** `admin.meta.icons` в `payload.config.ts` — SVG-то и иконата
  за iPhone; `favicon.ico` НЕ е в списъка, защото Next го дава и там (иначе
  излиза два пъти).
- **Заключеният сайт пуска иконите и манифеста** (`ОТВОРЕНИ` в
  `src/lib/gate.ts`) — иначе екранът за вход е без иконка.
- **WAVE 2 Add-On Battery** (`npm run wave-2:bateriya`, еднократно,
  повторяемо, архив № 153): „Категории" = Допълнителни батерии (както WAVE 3
  батерията), „Съвместим с" остава Wave климатици (WAVE 2 го няма на сайта).
  Махната от горния ред на панел „Wave климатици" (№ 27) — в „Аксесоари" е
  сама; добавена накрая в „Допълнителни батерии" (№ 31). Адресът —
  `/kategorii/dopalnitelni-baterii/wave-2-add-on-battery`; старият под
  `wave-klimatici` дава 301 (записа го куката на продукта). `categorySlug` в
  `sadarzhanie.json` — също.
