---
paths:
  - "src/lib/media.ts"
  - "src/collections/Media.ts"
  - "src/snimki-*.ts"
  - "src/media-regenerate.ts"
  - "src/lib/trim-image.ts"
  - "src/repair-case-collisions.ts"
  - "src/components/SectionImage.tsx"
  - "src/components/CardImage.tsx"
  - "src/components/ImagePlaceholder.tsx"
---

# Снимки и Медия

Подробно — `docs/funkcii/snimki.md`, `produkti-i-karti.md` (trimmed), `vnos-i-raboten-red.md` (вносът, имената).

- **Оригиналът се пази байт по байт** — в `Media.ts` няма `formatOptions`. „PNG стана webp" идва от CDN-а на EcoFlow (WebP под име .jpg); Payload именува по съдържанието. Payload прекодира WebP/AVIF/GIF безусловно → вносът връща оригиналните байтове.
- **Размери:** `mobile` 828, `content` 1600, `large` 2000, `full` (ширината на оригинала) — без увеличаване; `wide`/`banner` се увеличават (банерите не ги ползват). Нов размер → `npm run media:regenerate` (`--force` пресъздава).
- **`trimmed`** — само за изрези с алфа (≥ 5 % прозрачни), по рамката на алфа канала (не `sharp().trim()`), webp до 900 px + `trimmed.small` 240 px; правилото — `src/lib/trim-image.ts`; пише го `fillTrimmed`, подмяната и `media:regenerate`.
- **Подмяна на снимка — `replaceMediaContent`**, не `payload.update` с файл (той слага наставка `-1` и подмяната става дублиране); чисти размерите, които не прави наново.
- **Имена, различни само по регистъра** → наставка `caseSafeStem` (хеш); Windows не различава `3_1_img` от `3_1_IMG` и размерите се презаписваха.
- **Двойна точка в края на името** — `bareStem` (иначе всеки внос качва копие).
- **Смислени имена** (`src/snimki-imena-core.ts`): `<slug>-1`, секции по надписа; „ц" → „c" само тук. Снимка, ползвана от страница, НЕ се преименува никога; внос с `--only` преименува само снимките на внасяните продукти.
- В базата снимките се сочат САМО по номер — преименуването пипа файла, размерите и `filename`.
