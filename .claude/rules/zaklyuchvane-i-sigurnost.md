---
paths:
  - "src/lib/gate.ts"
  - "src/middleware.ts"
  - "src/app/(vhod)/**"
  - "src/components/VhodForm.tsx"
  - "src/lib/access.ts"
  - "src/collections/Users.ts"
  - "deploy/**"
---

# Заключен достъп, роли, сигурност

Подробно — `docs/funkcii/roli-i-zaklyuchvane.md`, `server.md`; README „Сървър" → „Защити".

- **Роли** (`src/lib/access.ts`): Администратор / Редактор / Продажби; трие само администраторът; публично четените колекции остават публични за четене.
- **Заключеният сайт** — отметка в „Общи настройки" (само админ); правилата — `src/lib/gate.ts`, прилагането — първото в `src/middleware.ts`. Вход на `/vhod` със същия акаунт; JWT в `payload-token`, проверен с `jose` (ключ = първите 32 знака от SHA-256 на `PAYLOAD_SECRET`).
- **Снимките през `/_next/image` при заключен сайт:** вътрешното теглене е без бисквитка → middleware подписва адреса (`gk`, HMAC на пътя и деня). **307 на браузъра към подписания адрес, НЕ `rewrite`** — на сървъра rewrite става proxy: първо кръг (502/500), после Next не кодира `url` и `…?v=1&gk=…` губеше `gk` (400). Адрес с `gk` → `next()`.
- **Сайтът е пуснат (20.10.2026): `SITE_NOINDEX=false`** — индексира се; флагът се чете при старт (рестарт, без билд). `SITE_NOINDEX=true` — авариен предпазител (`robots.txt` `Disallow: /`, `X-Robots-Tag: noindex, nofollow` навсякъде). nginx слага `X-Robots-Tag: noindex, nofollow` САМО на `/admin` и `/api/` (без `/api/media/`) — чрез `map $uri $ef_robots`, не с `add_header` в location (той отменя заглавията за сигурност). `/tarsene` и адресите с параметри — `noindex, follow` от сайта. Правните страници — без „Скрита от търсачките".
- **Вход:** 5 грешни пароли → акаунтът (не IP-то) заключен 15 мин.; `/vhod` казва „заключен" и „твърде много опити" (429).
- **fail2ban — нормален човек никога не се блокира** (динамични IP): само `ecoflow-login` (30 за 10 мин.; от 16.10.2026 — само запис, `banaction = dummy`: зад Cloudflare бан по IP не действа) и `sshd` (10 → истински бан 15 мин.); без правило за сканиране (банна офиса), без нарастване, без `recidive`. `backend = auto`; в регулярните изрази датата е `\[[^\]]*\]`. `ignoreip` — в `jail.local` (jail.d/*.local се чете след него). Отблокиране — `npm run razblokirai`.
- **nginx:** лошите заявки се ОТКАЗВАТ (444 / 429 с българска страница), не се банват; снимки, статика и страници — без лимит.
- **Зад Cloudflare: `real_ip` от `CF-Connecting-IP`** (`conf.d/cloudflare-realip.conf`, генерира го `deploy/cloudflare-ips.sh`) — иначе лимитите и логовете виждат IP-тата на Cloudflare. **Cloudflare се управлява само от хостинга.** Payload: `cors`/`csrf` = адресът на сайта + `http://localhost:8080` (тунелът); `serverURL` нарочно не е зададен — с него админът през тунела спира да работи.
- `SITE_GATE=force-off` / `force-on` — авариен ключ. `npm run admin:nova-parola <имейл>`.
- Скриптове, които таймерите пускат като root — копия в `/usr/local/sbin`, не от `/srv` (потребителят `ecoflow` може да ги пише).
