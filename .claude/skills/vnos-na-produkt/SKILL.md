---
name: vnos-na-produkt
description: Внос на нов или обновен продукт на истинския сайт (сървъра) от content/<slug>/sadarzhanie.json — проверка на EAN и данните, import:product:server, проверка на страницата, commit. Ползвай при „внеси продукт", „добави продукт", „обнови продукта от JSON".
---

# Внос на продукт на сървъра

Правилата за вноса — `.claude/rules/vnos.md`; подробно — `docs/funkcii/vnos-i-raboten-red.md`.

1. `git status` — при незаписано питай, преди да пипаш.
2. **Данните:** `content/<slug>/sadarzhanie.json` — `produkt` (името — официалното; `categories` — първата е основната; `externalUrl` към dice.bg; `availability` — една от трите стойности в `src/lib/availability.ts`), секциите, `_svali_snimki` `[{url, file}]`.
   - Спецификации — само от EcoFlow / dice (при аксесоари dice има предимство); нищо не се измисля.
   - **EAN — първо провери за дубли** в базата на сървъра (`sqlite3 -readonly ecoflow.db "select slug, ean, ean2 from products where ean='…' or ean2='…'"`). EAN с наставка (`-1`) е отделен артикул.
   - slug — латиница; не сменяй slug на съществуващ продукт.
3. **Проба локално** (по желание): `npm run import:product <slug> -- --dry-run` — локалната база, нищо не пише.
4. **Внос на сървъра:** `npm run import:product:server <slug>` (качва `content/<slug>/` и `content/snimki/`, архив преди това, внос с `CONTENT_ROOT=content-server`). Флаговете — след `--`.
5. **Обобщението:** „създаден и публикуван" / „обновен (остава чернова)"; липсващи файлове; „не е добавен в панел" (менюто — от админа); колони в сравнителната таблица, които чакат продукт.
6. **Проверка на страницата** на https://91.212.13.155 (влязъл): адрес `/kategorii/<серия>/<slug>`, трохи, галерия, цена и бутон, „Съвместим с".
7. Ако е пипан `content/` — commit + push (`content/<slug>/` е в git, снимките — не).
