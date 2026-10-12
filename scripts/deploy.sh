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
# Кешът на четенията (fetch-cache) остава от новия билд. Кешът на
# оптимизатора на снимки (.next/cache/images) се пренася — иначе след всеки
# deploy всички снимки се правят наново.
if [ -d .next/cache/images ]; then
  mkdir -p .next-new/cache
  rm -rf .next-new/cache/images
  cp -a .next/cache/images .next-new/cache/images
  echo "кешът на снимките е пренесен: $(du -sh .next-new/cache/images | cut -f1)"
fi
rm -rf .next-old
[ -d .next ] && mv .next .next-old
mv .next-new .next

step "6/7 рестарт"
sudo /usr/bin/systemctl restart ecoflow

step "7/7 проверка"
# Началната: 200, или 307 към /vhod при заключен сайт. До 12.10.2026 се
# питаше /vhod — при отключен сайт той е 404 и изглеждаше като грешка.
# До 60 s; после втора заявка към продукт (200, 301 или 307).
fail() {
  echo "⚠ $1"
  journalctl -u ecoflow -n 100 --no-pager || true
  exit 1
}
home=""
end=$((SECONDS + 60))
while [ $SECONDS -lt $end ]; do
  out=$(curl -s -o /dev/null -m 5 -w '%{http_code} %{redirect_url}' http://127.0.0.1:3000/ || true)
  code=${out%% *}; loc=${out#* }
  if [ "$code" = "200" ]; then home="Сайтът отговаря (200)"; break; fi
  if [ "$code" = "307" ] && [[ "$loc" == */vhod* ]]; then
    home="Сайтът е заключен — отговаря с пренасочване към /vhod (307)"; break
  fi
  sleep 2
done
[ -n "$home" ] || fail "Сайтът не отговаря след рестарта (началната: ${code:-няма отговор}) — journalctl -u ecoflow -n 100:"
pcode=$(curl -s -o /dev/null -m 30 -w '%{http_code}' http://127.0.0.1:3000/kategorii/produkt/delta-3 || true)
case "$pcode" in
  200|301|307) ;;
  *) fail "Продуктът /kategorii/produkt/delta-3 отговаря с ${pcode:-нищо} — journalctl -u ecoflow -n 100:" ;;
esac
echo "$home"
echo "продукт /kategorii/produkt/delta-3: $pcode"
git log --oneline -1
