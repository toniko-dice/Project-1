---
name: vnos-na-stranica
description: Внос или обновяване на страница (ръководство, правна, „За …") на сървъра от content/stranici/<slug>/sadarzhanie.json — import:page:server и защитите на редактираните и правните страници. Ползвай при „внеси страница", „обнови страницата от JSON".
---

# Внос на страница на сървъра

Подробно — `docs/funkcii/stranici.md`, `.claude/rules/vnos.md`.

1. `git status`.
2. **Файлът:** `content/stranici/<slug>/sadarzhanie.json` — `stranica` (`title`, `slug`, мета, `pravna`, `noindex`, `biskvitkiTablica`), `sekcii`, `_svali_snimki`. Продуктите — по slug; колона без продукт отпада.
3. **Защитата:** страница, редактирана в админа (запис > 10 s след `importedAt`) или без `importedAt`, се ПРОПУСКА („редактирана в админа — пропусната"). Замяна само с `--force` — и само ако собственикът изрично го иска (иначе губи своите редакции).
4. **Правна страница** (`"pravna": true`): дата на актуализация и съдържание от H2; `noindex`, докато текстът е временен; на `/biskvitki` — `"biskvitkiTablica": true`.
5. Проба: `npm run import:page <slug> -- --dry-run` (локално).
6. Внос: `npm run import:page:server <slug>`. Излиза публикувана; ако публикуването не мине — чернова с причината.
7. Проверка на https://91.212.13.155/<slug> (влязъл): H1, блоковете, снимките, SEO.
8. Снимки, ползвани от страница, НЕ се преименуват — името в JSON-а трябва да съвпада с Медия.
9. commit + push на `content/stranici/<slug>/`.
