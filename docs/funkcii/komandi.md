# Команди — пълният списък отпреди

<!-- Пренесено дословно от CLAUDE.md на 13.10.2026 (task-claude-md-prenarezhdane.md). -->

Актуалните — `package.json` и README. В CLAUDE.md са най-важните.

## Команди

```bash
npm run dev                  # разработка (Turbopack)
npm run dev:webpack          # резервен вариант при проблем с Payload
npm run build && npm start   # проверка на реалната скорост
npm run generate:types       # след промяна в полета на колекция или блок
npm run generate:importmap   # след промяна в admin.components
npm run migrate:create       # след промяна в схемата → преглед → migrate
npm run migrate              # архив + проверка + миграция + проверка
npm run health               # снимка на състоянието и разлика с предишната
npm run backfill:order       # след миграция с нова orderable колекция
npm run seed                 # само празна база; върху пълна отказва (--force)
npm run media:regenerate     # липсващите размери и изрязания вариант за картите на вече качените
npm run migrate:tree         # еднократно: дървото на три нива и адресите

npm run import:product <slug>    # един продукт от content/<slug>/
npm run import:all               # всички папки със sadarzhanie.json
npm run import:all -- --dry-run  # само проверка, нищо не се записва
npm run import:all -- --only river-3-plus,river-3-ups
npm run import:all -- --no-download     # без сваляне: само диск и Медия
npm run import:all -- --draft           # новите — чернова, не публикувани
npm run seed:attributes                 # първите атрибути; съществуващите не се пипат
npm run import:attributes               # стойностите от content/atributi.json (само празните)
npm run import:attributes -- --force    # презаписва
npm run snimki:bql-fon                  # продуктовите снимки с бял фон → content/snimki-bql-fon/
npm run snimki:zameni                   # content/snimki/ → Медия, по името в Медия (-- --dry-run)
npm run snimki:imena -- --dry-run       # смислени имена: какво би се сменило → snimki-imena-proverka.csv
npm run snimki:imena                    # смяната (архив + zip на content/), дописва snimki-imena.csv
npm run snimki:proverka                 # всички снимки от sitemap-а: 200 и непразни
npm run import:seo -- --dry-run         # SEO данните от content/seo-*.json: старо → ново
npm run import:seo                      # запис (продукти — презаписва; категории — само празното)
npm run seo:check                       # SEO отчет: дължини, повторения, празни категории, 404
npm run build:local                     # билд с localhost — САМО за проверка, никога за сървъра
npm run import:page <slug> -- --dry-run # страница от content/stranici/<slug>/: какво би направил
npm run import:page <slug>              # запис + публикуване (обновява същата страница)
npm run mail:catcher                    # локален SMTP приемник за проверка на имейлите → tmp-mail/
```

`push: false` в `payload.config.ts` е нарочно — схемата се променя само
през миграции, за да не се задават интерактивни въпроси и да не се губят
данни.

---
