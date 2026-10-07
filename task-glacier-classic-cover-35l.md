# Задача: нови продукти — EcoFlow GLACIER Classic Protective Cover (35L, 45L, 55L)

Първо `git status`. Ако има нещо незаписано — питай ме, преди да правиш `reset`, `checkout` или каквото и да е, което трие промени.

Три отделни продукта — чантите за трите размера на GLACIER Classic. Съдържанието е в:
- `content/glacier-classic-protective-cover-35l/sadarzhanie.json` — 109 €, налично на склад;
- `content/glacier-classic-protective-cover-45l/sadarzhanie.json` — 119 €, **по заявка**;
- `content/glacier-classic-protective-cover-55l/sadarzhanie.json` — 129 €, **по заявка**.

EAN-ите (4895251639880, 4895251639897, 4895251639903) са проверени — няма ги в базата.

1. **Внос:** пусни `npm run import:product <slug>` за трите. И трите да са **публикувани**.
2. **Категория:** `chanti-i-kalafi`.
3. **„Съвместим с“** — всяка чанта само със своя хладилник:
   - 35L → `glacier-classic-35l`;
   - 45L → `glacier-classic-45l`;
   - 55L → `glacier-classic-55l`.
4. **Атрибут:** „Вид“ = „Чанта“ (полето `atributi`). Ако вносът не го чете, добави трите в `content/atributi.json` и пусни `npm run import:attributes`.
5. **Проверка:**
   - Всяка чанта е:
     - в „Чанти и калъфи“;
     - в „Съвместими аксесоари“ на своя хладилник (и само там);
     - в аксесоарите на серията GLACIER.
   - 45L и 55L показват „по заявка“ и бутон „Заяви в dice.bg“.
   - Снимките са с прозрачен фон, с имена `glacier-classic-protective-cover-<размер>-1…5.png`.
   - JSON-LD: `gtin13` е верният за всяка чанта.
   - `npm run seo:check` минава.

Git: commit + push.
