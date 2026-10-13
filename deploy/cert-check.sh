#!/bin/bash
# Колко дни остават на сертификата за IP адреса (`task-otvaryane-https-ip.md`).
# На сървъра: /usr/local/sbin/ecoflow-cert-check (копие, root). Пуска се от
# ecoflow-cert-check.timer два пъти на ден. Под 3 дни → запис в
# лога (journalctl -t ecoflow-cert) и писмо до anton@dice.bg — докато няма
# SMTP, само в лога. Сертификатът е 6 дни; certbot го подновява ~2–3 дни
# преди края, затова „под 3" значи, че подновяването не е минало.
CERT=/etc/letsencrypt/live/ecoflow-ip/fullchain.pem
TO=anton@dice.bg
if [ ! -f "$CERT" ]; then
  logger -t ecoflow-cert -p user.err "няма сертификат: $CERT"
  exit 1
fi
end=$(openssl x509 -enddate -noout -in "$CERT" | cut -d= -f2)
left=$(( ( $(date -d "$end" +%s) - $(date +%s) ) / 3600 ))
days=$(( left / 24 ))
if [ "$left" -lt 72 ]; then
  msg="Сертификатът на https://91.212.13.155 изтича след ${left} ч. ($end) — подновяването не е минало. Виж README „Сървър“ → ръчно подновяване."
  logger -t ecoflow-cert -p user.warning "$msg"
  if command -v mail >/dev/null 2>&1 && [ -n "$CERT_MAIL" ]; then echo "$msg" | mail -s "ecoflow: сертификатът изтича" "$TO"; fi
  exit 2
fi
logger -t ecoflow-cert -p user.info "сертификатът важи още ${days} дни (${left} ч., до $end)"
