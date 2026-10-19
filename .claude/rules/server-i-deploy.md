---
paths:
  - "scripts/**"
  - "deploy/**"
  - "package.json"
  - "next.config.ts"
---

# Сървър и deploy

Подробно — `docs/funkcii/server.md`; README „Сървър". Процедурата — skill `deploy`.

- **Сървърът:** `91.212.13.155`, `/srv/ecoflow-bg`, потребител `ecoflow` (sudo само за `systemctl … ecoflow`), `ecoflow.service` (`next start` на `127.0.0.1:3000`, `MemoryMax=3G`). Root — само с ключ. SSH от Windows — `C:\Windows\System32\OpenSSH\ssh.exe` (ключът е в агента), `-o BatchMode=yes`.
- **`npm run deploy`** (`scripts/server.mjs` → `scripts/deploy.sh`): архив, `git pull`, `npm ci`, миграции, билд в `.next-new` (`NEXT_DIST_DIR` — `next build` иначе трие `.next` под работещия сайт), пренасяне на кеша на снимките, смяна, рестарт, проверка (началната: 200 или 307 към `/vhod`; продукт). Старият билд — `.next-old`.
- **Deploy върви откачено** (`setsid nohup`, `flock`, лог в `deploy-log/`): прекъсната връзка не го спира. `cd` е отделна команда (с `&` цялата верига отиваше във фона).
- **Паметта при билда:** данните са извън проследяването на файлове (`outputFileTracingExcludes` + `/* turbopackIgnore: true */` в `path.join(process.cwd(), …)` в кода на сайта) — иначе архивите (GB) влизаха в билда и той умираше. Предупреждение „The file pattern … matches N files" = нов такъв път. Swap 5 GB.
- **Шрифтът Inter се тегли от Google при билда** — два пъти падна временно; повтори deploy.
- **`build:local` е САМО за проверка на локалната машина** — с localhost в sitemap/canonical; билдът на сървъра спира без истински `NEXT_PUBLIC_SITE_URL`.
- **Билд — в главната папка** (`C:\CLAUDE\ecoflow-bg`), не в worktree (там няма `node_modules`).
- **`INTERNAL_SERVER_URL=http://127.0.0.1:3000`** — middleware-ът и опресняването след внос не минават през nginx.
- **Сайтът: https://ecoflow.bg през Cloudflare** (от 16.10.2026). **Cloudflare се управлява САМО от хостинга** — не влизаш там, не искаш token; каквото зависи от Cloudflare → в отчета, собственикът го препраща. Сертификатът — Origin на Cloudflare от хостинга (`/etc/ssl/certs/ecoflow.bg.cert`, `/etc/ssl/private/ecoflow.bg.key`): само пътищата, файловете не се четат и никога в git. nginx: `ecoflow.bg` — сайтът; `www`, порт 80 и IP → 301 към `https://ecoflow.bg`; https по IP — `ssl_reject_handshake`. UFW: 80/443 само от Cloudflare (`deploy/cloudflare-ips.sh`, седмичен таймер; обновява и `real_ip`). Пряко по IP не се стига — резервът е тунелът (`otvori-sayta.bat`) → `127.0.0.1:8081`. Сертификатът за IP (Let's Encrypt) е махнат 16.10.2026. nginx 1.24: `listen 443 ssl http2`. Промяна в nginx → първо архив на `/etc/nginx/` и сравнение с текущия файл на сървъра (хостингът също го редактира).
- **`db:kachi-na-sarvara` — НИКОГА** (само с `ALLOW_DB_UPLOAD=true` в `.env` на сървъра; махнат). `db:svali-ot-sarvara` — обратно, за тест.
- `na-sarvara <скрипт>` — npm скрипт на сървъра с архив преди това и **опресняване на кеша след него** (както `import:*:server`). Скрипт, пуснат по друг начин върху базата на сървъра → после `POST /api/products/revalidate` с `x-revalidate-key`.
- **Next пази отметките „опресни" САМО в паметта** — рестарт без билд връщаше HTML-а от последния билд със старите данни (19.10.2026: футърът пак със support@dice.bg). Затова `ecoflow.service` има `ExecStartPost=-…/scripts/opresni-sled-start.sh` — опреснява всичко след всеки старт.
- Изпълнимите файлове в git — `git update-index --chmod=+x`.
