---
name: deploy
description: Качване на нов код на сървъра (npm run deploy) — какво да се гледа в изхода, какво при грешка, връщане към предишния билд, паметта при билда. Ползвай при „deploy", „качи на сървъра", „пусни го".
---

# Deploy на сървъра

Подробно — `.claude/rules/server-i-deploy.md`, `docs/funkcii/server.md`.

1. Кодът е commit-нат и push-нат в `main` (deploy-ът прави `git pull`). `npx tsc --noEmit` в главната папка минава.
2. `npm run deploy` (от главната папка). Върви откачено на сървъра — логът е `/srv/ecoflow-bg/deploy-log/<време>.log`, кодът на изхода — `.exit`. Не реже изхода с `head` (локалната команда спира; сървърът продължава).
3. **Стъпки:** 1/7 архив · 2/7 git pull · 3/7 npm ci · 4/7 миграции · 5/7 билд в `.next-new` · 6/7 рестарт · 7/7 проверка.
4. **Успех:** „Сайтът отговаря (200)" или „Сайтът е заключен — … /vhod (307)" + продукт 200/301/307 + последният commit.
5. **Ако спре** — старата версия работи (билдът е в `.next-new`). Срещани причини:
   - `Module not found … font/google` — временен проблем с Google Fonts → пусни пак;
   - `Killed` — памет: предупреждение „The file pattern … matches N files" (нов `path.join(process.cwd(), …)` без `turbopackIgnore`); `free -h`;
   - „Друг deploy още върви" — `flock`; изчакай.
6. **Връщане назад** (root): `cd /srv/ecoflow-bg && mv .next .next-bad && mv .next-old .next && systemctl restart ecoflow`.
7. **Без deploy** при задачи само за документация (`.md`).
