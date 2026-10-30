# Сървърът

<!-- Пренесено дословно от CLAUDE.md на 13.10.2026 (task-claude-md-prenarezhdane.md). -->

## Сървърът — главната база е там (`task-kachvane-server.md`, 12 октомври 2026)

`91.212.13.155`, `/srv/ecoflow-bg`, потребител `ecoflow`, услуга
`ecoflow.service`; отвън само SSH, сайтът — през тунел
(`scripts\otvori-sayta.bat`). Подробно — README „Сървър".

- Тъмната лента е **без линк** (13.10.2026): `/dostavka` даваше 404 на
  всички страници; `announcementUrl` е празно (и в `seed.ts`). С адрес в
  „Общи настройки" лентата пак става линк.
- **Главната база е на сървъра.** Локалната е за тест на код.
  **Внос за истинския сайт — само с `:server`** (`import:product:server`,
  `import:page:server`, `faq:dobavi:server`, `na-sarvara <скрипт>`) —
  `scripts/server.mjs`. Без `:server` командите пишат в локалната база.
- `npm run deploy` → `scripts/deploy.sh` на сървъра: архив, pull, `npm ci`,
  миграции, билд в `.next-new` (`NEXT_DIST_DIR`) и смяна с `.next` чак
  при успех — `next build` иначе изчиства `.next` под работещия сайт.
- `db:kachi-na-sarvara` — само с `ALLOW_DB_UPLOAD=true` в `.env` на
  сървъра (махнат след първото качване); `db:svali-ot-sarvara` — обратно.
- **`INTERNAL_SERVER_URL`** — middleware-ът пита `/api/zaklyuchvane` и
  `/api/kanon` на него, не на адреса на заявката: през тунела той е
  `localhost:8080`, който на сървъра не съществува. Същото — опресняването
  след внос и синхронизация.
- **`busyTimeout: 15_000`** в `sqliteAdapter` — втори процес чака заетата
  база, вместо да падне със `SQLITE_BUSY` (синхронизацията с dice на
  12.10.2026).
- Поща без `SMTP_HOST` (или `EMAIL_MODE=log`) → `mail-log/`
  (`src/lib/mail-log.ts`), нищо не се праща.
- Локално `DICE_SYNC_DISABLED=true` — „Синхронизирай сега" отказва.
- Домейнът е **ecoflow.bg** (не `bg-ecoflow.com`): сменен в кода, README,
  `content/stranici/` и в базата (трите правни страници,
  `npm run domein:ecoflow-bg`, архив № 160; миграцията
  `20261012_131700_domein_ecoflow_bg` — стойностите по подразбиране в
  „Данни за офертите"). Старите миграции, версиите и 6-те оферти пазят
  стария текст — история.
- Архивите: последните 7 обикновени (`KEEP_LAST`).
- **Снимките през `/_next/image` при заключен сайт** (12 октомври 2026,
  `task-server-snimki.md`): на сървъра пренасочването с подпис (`gk`) в
  middleware-а се изпълнява като нова HTTP заявка, която минаваше пак през
  middleware-а и се подписваше отново — кръг: nginx „upstream sent too big
  header" (502), Next „socket hang up" (500), 0 от 26 снимки. После —
  400 „isn't a valid image": при това проксиране Next не кодира новата
  стойност на `url` и `…png?v=1&gk=…` се разпадаше (`gk` — отделен
  параметър, снимката — без подпис → `/vhod`). **Затова е 307 на браузъра
  към подписания адрес, не rewrite** (кеширано `private, max-age=3600`);
  адрес с `gk` → `NextResponse.next()`. Локално (`next dev`) пренасочването
  е в процеса и нито едното не се виждаше.
- **Кешът на оптимизатора** (`.next/cache/images`) се пренася в новия билд
  при `npm run deploy` — иначе след всеки deploy снимките се правят наново.
- **Данните са извън проследяването на файловете на билда**
  (`outputFileTracingExcludes` в `next.config.ts` + `/* turbopackIgnore:
  true */` в `path.join(process.cwd(), …)` на кода, който влиза в сайта).
  Без това Turbopack включваше цели папки — `media/` (~115 000 записа в
  `.nft.json`), всички архиви, базата — и паметта на билда растеше с всеки
  архив: на 12 октомври 2026 (`backups/` 5,3 GB) билдът на сървъра стигна
  7,2 GB и беше убит. **Предупреждение „The file pattern … matches N files"
  в изхода на билда = нов такъв път** — слага се коментарът в самия
  `path.join` (на променливата не действа). Swap на сървъра: 1 GB + 4 GB
  (`/swapfile2`).
- **29.10.2026 — пак OOM, без предупреждение.** Билдът стигаше над 11 GB
  (7,1 GB RAM + 4,3 GB swap; в `journalctl -k` „Free swap = 12kB" — swap-ът
  Е изчерпан; малкият swap след това е, защото убитият процес го освобождава).
  Причината: `path.join(dir, `arhiv-${stamp}.zip`)`, `path.join(dir,
  `${stem}-trimmed-${w}x${h}.webp`)` и `mail-log` — с папка-параметър или
  променлива Turbopack прави шаблон от името и ЧЕТЕ всеки съвпадащ файл в
  проекта (12 архива × 1,37 GB); `outputFileTracingExcludes` ги маха чак
  след това. Измерено на копие (`/usr/bin/time -v`): без данни 2,4 GB, с
  `backups/` > 8 GB, с `turbopackIgnore` на тези пътища (`backup.ts`,
  `Backups.ts`, `trim-image.ts`, `mail-log.ts`) — 2,4 GB. `content-server/`
  и документите не влияят.
- `npm run deploy` върви **откачено** на сървъра (`setsid nohup`, `flock`,
  `NODE_OPTIONS=--max-old-space-size=4096`): прекъсната връзка не спира
  билда; логът и кодът на изхода — `deploy-log/<време>.log` и `.exit`.
- **https://91.212.13.155 от 13 октомври 2026** (`task-otvaryane-https-ip.md`,
  подробно — README „Сървър"): сертификат на Let's Encrypt за IP адреса
  (профил `shortlived`, 6 дни, certbot 5.8 от snap, webroot), nginx от
  `deploy/` (80 → https; 443; `127.0.0.1:8081` за тунела — `otvori-sayta.bat`
  сочи 8081, защото 80 пренасочва навън), лимити и блокирани пътища в
  nginx, fail2ban (от `task-fail2ban-bez-blokirane.md` само `ecoflow-login`
  — 30 за 10 мин. → 15 мин. — и `sshd`; правило за сканиране НЯМА, банна
  офиса): **`backend = auto`** (в
  Ubuntu по подразбиране е `systemd` и правила върху файл никога не
  сработват) и **датата в израза е `\[[^\]]*\]`** (fail2ban я изрязва
  преди проверката). Вход: 5 опита / 15 мин., `payload-token` `Secure`.
  `SITE_NOINDEX=true` → `noindex` и `Disallow: /` независимо от
  заключването. Портове 80/443 бяха затворени и при хостинга — първо там,
  ако отвън не отговарят. nginx 1.24: `listen 443 ssl http2`, не `http2 on`.
- Проверката в края на deploy-а пита **началната** (200, или 307 към
  `/vhod` при заключен сайт; до 60 s) и `/kategorii/produkt/delta-3`
  (200/301/307). При грешка — `journalctl -u ecoflow -n 100` в изхода.
  До 12.10.2026 питаше `/vhod`, който при отключен сайт е 404.
