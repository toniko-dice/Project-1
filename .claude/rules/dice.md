---
paths:
  - "src/lib/dice/**"
  - "src/globals/DiceSync.ts"
  - "src/jobs/**"
  - "src/collections/DiceSyncs.ts"
  - "src/collections/PriceApprovals.ts"
  - "src/collections/PriceHistory.ts"
  - "src/dice-sync-test.ts"
  - "scripts/dice-parse-test.ts"
---

# Връзка с dice.bg (XML)

Подробно — `docs/funkcii/dice.md`. Файлът: `https://dice.bg/xtento_exports/Ecoflow-XML.xml`.

- **Полетата на XML-а — ТОЧНИТЕ имена, без догадки** (`src/lib/dice/parse.ts`): `Identifier` → SKU (после `ProductNumber`); `ean`; `Name`; `Manufacturer`; **`Price` — редовната; `SpecialPrice` — намалената**; `quantity` — брой (само той); `stock` (`in stock` / `out of stock`; друго → грешка; празно → по броя).
- **Цена и зачертана — `finalPrice`, едно място:** `SpecialPrice` > 0 и < `Price` → цена `SpecialPrice`, зачертана `Price`; празна/0 → `Price` без зачертана; ≥ `Price` → `Price` + предупреждение; негодна `Price` → продуктът се пропуска.
- **Съвпадение** (`src/lib/dice/match.ts`): първо `Identifier` = SKU за всички редове, после EAN (8–14 цифри; наставки `…-1` не се търсят по EAN); по име — никога.
- **Пипа само** `price`, `compareAtPrice`, `availability`, `stockQty`; „Не синхронизирай" (`noSync`) пропуска. Чернова остава чернова.
- **Режими:** „Тестов" (цените → „Цени за одобрение", без график) и „Автоматичен" (всеки ден в часа, всичко направо, пакет `С-…` за връщане). Решението на собственика (13.10.2026): **автоматично, без одобрение** — включва го той в админа.
- **Предпазители:** файлът не се тегли (3 опита по график); празен XML; съвпаднали < 50 % от предния път (само за адреса); > 30 % с промяна над 40 % → спира без запис + имейл.
- **Транзакцията НЕ връща записаното при грешка** (SQLite `delete` режим) — отвън (`payload run`) само с `busy_timeout`; при грешка → „Версии" на засегнатия продукт.
- **Графикът:** задача `diceSync` всеки час (`jobs.autoRun` на 5 мин.), сама проверява режим/адрес/час (Europe/Sofia)/„още не днес"; само на продукция. Проверка без чакане — `npm run na-sarvara dice:test-po-grafik` (`forceMode`, не пипа настройката и `lastAutoDate`).
- **„Последна бройка"** — `lastPiece`, пресметнато при запис (`fillLastPiece`); смяна на прага → `recomputeLastPiece`.
- **„История на цените"** — куката `recordPriceHistory` при всяка смяна на публикувана цена; източникът — `req.context.priceChange`.
- Локално `DICE_SYNC_DISABLED=true` — главната база е на сървъра. Тест на парсера — `npm run test:dice`.
