#!/usr/bin/env bash
# Обновяване на сайта НА СЪРВЪРА (`task-kachvane-server.md`, т. 9).
# Пуска се като ecoflow в /srv/ecoflow-bg — локално с `npm run deploy`.
#
#   1. архив на базата и медията (npm run migrate прави и свой — преди миграцията);
#   2. git pull;  3. npm ci;  4. миграции;  5. билд;
#   6. рестарт на услугата;  7. проверка с curl.
#
# При грешка спира ПРЕДИ рестарта — старата версия продължава да работи:
# билдът е в отделна папка (.next-new) и се разменя с .next само при успех.
# Предишният билд остава в .next-old (връщане: mv .next-old .next и рестарт).
set -euo pipefail
cd /srv/ecoflow-bg

step() { echo; echo "── $* ──"; }

step "1/7 архив"
npx payload run src/backup-now.ts -- "Преди обновяване (deploy)"

step "2/7 git pull"
git pull --ff-only

step "3/7 npm ci"
npm ci --no-audit --no-fund

step "4/7 миграции"
npm run migrate

step "5/7 билд (в .next-new — работещият сайт не се пипа)"
rm -rf .next-new
NEXT_DIST_DIR=.next-new npm run build
# Кешът на четенията (fetch-cache) остава от новия билд.
rm -rf .next-old
[ -d .next ] && mv .next .next-old
mv .next-new .next

step "6/7 рестарт"
sudo /usr/bin/systemctl restart ecoflow

step "7/7 проверка"
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/vhod || true)
  if [ "$code" = "200" ] || [ "$code" = "404" ] || [ "$code" = "307" ]; then
    echo "сайтът отговаря ($code)"; git log --oneline -1; exit 0
  fi
  sleep 2
done
echo "⚠ сайтът не отговаря след рестарта — journalctl -u ecoflow -n 100"
exit 1
