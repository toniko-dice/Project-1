---
name: nov-dokument
description: Нов или обновен документ на EcoFlow (ръководство, кратко ръководство, инструкции за безопасност, монтаж) в раздел „Документи" — опис, сваляне, официален BG или превод, внос на сървъра. Ползвай при „добави документ", „ново ръководство", „преведи документ", „обнови документите".
---

# Нов документ

Подробно — `docs/funkcii/dokumenti.md`, `.claude/rules/dokumenti.md`.

1. `git status`.
2. **Опис:** нов ред в `content/dokumenti/raw.tsv` (заглавие, дата, pdf/online, адрес) или нов продукт в `produkti-sarvar.tsv`; връзката с продукта — правило в `PRAVILA` (`scripts/dokumenti/opis.py`); официален BG на manuals.ecoflow.com → `BG_OFICIALNI`; скриване по решение → `SKRITI_RESHENIE`. После `python scripts/dokumenti/opis.py` и преглед на разликата в `opis.csv`.
3. **Сваляне:** `python scripts/dokumenti/svali.py` (само новите; дубли по SHA-256 → един файл).
4. **Официален BG:** `node scripts/dokumenti/bg-pdf.mjs content/dokumenti <slug>` (Chrome); провери PDF-а — бележката за източника горе, без менюта.
5. **Превод** (няма официален BG):
   - `python scripts/dokumenti/izvleci.py` → `prevodi/spisak.json` и английският текст;
   - `<id>.en.md` (английският, който се превежда) + `<id>.md` (преводът) по `prevodi/FORMAT.md` и `rechnik.md`;
   - фигурите: `python scripts/dokumenti/figuri.py kandidati <id>` → `figuri/<id>/pregled-p<N>.png`; всяка схема/снимка/QR/знак → `:::figure p<стр> x0,y0,x1,y1` с подпис и легенда на отпечатаното; останалите области → `<!-- bez-figura … -->` с причината; светлосивите рисунки детекторът не ги вижда — гледай страниците;
   - `node scripts/dokumenti/prevod-pdf.mjs <id>` — проверка + PDF; при „✗" не се внася — оправи или запиши в отчета.
6. **Внос:** `npm run import:dokumenti:server` (архив, наваксващо качване, опресняване).
7. **Проверка:** продуктовата страница (раздел „Документи") и `/dokumenti`; PDF — GET 200 `application/pdf`.
8. ZIP при нужда: `python scripts/dokumenti/opis.py` (колоните с файловете) → `python scripts/dokumenti/zip.py`.
9. commit + push (`opis.*`, `prevodi/*.md`, `spisak.json`, скриптовете). PDF-ите не са в git.
