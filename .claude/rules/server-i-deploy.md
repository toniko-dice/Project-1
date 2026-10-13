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
- **https на IP адреса** — Let's Encrypt `shortlived` (6 дни), certbot 5.8 от snap, webroot; подновяване два пъти дневно; проверка `ecoflow-cert-check.timer`. nginx 1.24: `listen 443 ssl http2`. Тунелът (`otvori-sayta.bat`) → `127.0.0.1:8081`.
- **`db:kachi-na-sarvara` — НИКОГА** (само с `ALLOW_DB_UPLOAD=true` в `.env` на сървъра; махнат). `db:svali-ot-sarvara` — обратно, за тест.
- `na-sarvara <скрипт>` — npm скрипт на сървъра с архив преди това. Пощата без SMTP → `mail-log/`.
- Изпълнимите файлове в git — `git update-index --chmod=+x`.
