#!/usr/bin/env bash
# Диапазоните на Cloudflare → nginx (истинският IP на посетителя) и UFW
# (80/443 само от Cloudflare). `task-domein-ecoflow-bg.md`, 16 октомври 2026.
#
# На сървъра: /usr/local/sbin/ecoflow-cloudflare-ips (копие — таймерът го
# пуска като root, а /srv може да се пише от потребителя ecoflow).
# Таймер: ecoflow-cloudflare-ips.timer — веднъж седмично.
#
# Тегли САМО публичните списъци (cloudflare.com/ips-v4, ips-v6) — без
# достъп до акаунта в Cloudflare (Cloudflare се управлява от хостинга).
#
# При грешка в тегленето или в проверката — НИЩО не се пипа: старите
# правила остават (по-добре остарял списък, отколкото затворен сайт).
#
#   1. /etc/nginx/conf.d/cloudflare-realip.conf — set_real_ip_from за всеки
#      диапазон + real_ip_header CF-Connecting-IP; `nginx -t`, иначе връща
#      стария файл; reload само при промяна.
#   2. UFW — `80,443/tcp ALLOW <диапазон> # cloudflare`: добавя липсващите,
#      маха отпадналите. Други правила (22, тунелът) не се пипат.
#
# Общите правила „80/443 от навсякъде" се махат веднъж на ръка (README).
set -euo pipefail

CONF=/etc/nginx/conf.d/cloudflare-realip.conf
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
log() { echo "[cloudflare-ips] $*"; }

for v in 4 6; do
  if ! curl -fsS --max-time 30 "https://www.cloudflare.com/ips-v$v" -o "$TMP/v$v"; then
    log "ГРЕШКА: не мога да сваля ips-v$v — нищо не е променено"
    exit 1
  fi
  # Списъците са без нов ред в края — без него последният IPv4 се залепва за първия IPv6.
  echo >> "$TMP/v$v"
  sed -i 's/\r//; /^[[:space:]]*$/d' "$TMP/v$v"
done

# Проверка: само CIDR-и и разумен брой (днес: 15 за IPv4, 7 за IPv6).
if grep -qvE '^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$' "$TMP/v4" || [ "$(wc -l < "$TMP/v4")" -lt 5 ]; then
  log "ГРЕШКА: ips-v4 не изглежда като списък с диапазони — нищо не е променено"
  exit 1
fi
if grep -qvE '^[0-9a-fA-F:]+/[0-9]{1,3}$' "$TMP/v6" || [ "$(wc -l < "$TMP/v6")" -lt 3 ]; then
  log "ГРЕШКА: ips-v6 не изглежда като списък с диапазони — нищо не е променено"
  exit 1
fi
cat "$TMP/v4" "$TMP/v6" > "$TMP/all"
log "диапазони: $(wc -l < "$TMP/v4") IPv4, $(wc -l < "$TMP/v6") IPv6"

# ── 1. nginx ──
{
  echo "# Генерирано от ecoflow-cloudflare-ips ($(date -u +%F)) — не се пипа на ръка."
  echo "# Истинският IP на посетителя зад Cloudflare: \$remote_addr за limit_req,"
  echo "# логовете и fail2ban. Само от диапазоните на Cloudflare."
  while read -r c; do echo "set_real_ip_from $c;"; done < "$TMP/all"
  echo "real_ip_header CF-Connecting-IP;"
} > "$TMP/realip.conf"

if [ -f "$CONF" ] && diff -q <(grep -v '^#' "$CONF") <(grep -v '^#' "$TMP/realip.conf") > /dev/null; then
  log "nginx: без промяна"
else
  [ -f "$CONF" ] && cp "$CONF" "$TMP/realip.old"
  install -m 644 "$TMP/realip.conf" "$CONF"
  if nginx -t 2> "$TMP/nginx-t"; then
    systemctl reload nginx
    log "nginx: обновено и презаредено"
  else
    cat "$TMP/nginx-t"
    if [ -f "$TMP/realip.old" ]; then cp "$TMP/realip.old" "$CONF"; else rm -f "$CONF"; fi
    log "ГРЕШКА: nginx -t не мина — върнат е старият файл"
    exit 1
  fi
fi

# ── 2. UFW ──
cidr_re='([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}|[0-9a-fA-F]*:[0-9a-fA-F:]*/[0-9]{1,3}'
ufw status | grep -E '# cloudflare$' | grep -oE "$cidr_re" | sort -u > "$TMP/ufw-now" || true
sort -u "$TMP/all" > "$TMP/want"

added=0; removed=0
while read -r c; do
  ufw allow proto tcp from "$c" to any port 80,443 comment cloudflare > /dev/null
  added=$((added + 1))
done < <(comm -13 "$TMP/ufw-now" "$TMP/want")
while read -r c; do
  ufw delete allow proto tcp from "$c" to any port 80,443 > /dev/null
  removed=$((removed + 1))
done < <(comm -23 "$TMP/ufw-now" "$TMP/want")
log "UFW: добавени $added, махнати $removed, общо $(wc -l < "$TMP/want")"
