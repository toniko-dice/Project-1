#!/bin/bash
# Дневен отчет за fail2ban (`task-fail2ban-bez-blokirane.md`): колко IP са
# банати за последните 24 часа и от кое правило — за да се види, ако
# правилата хващат нормални хора. Пише в лога: journalctl -t ecoflow-fail2ban
# На сървъра: /usr/local/sbin/ecoflow-fail2ban-report (копие, root);
# пуска го ecoflow-fail2ban-report.timer всеки ден в 08:00.
LOG=/var/log/fail2ban.log
since=$(date -d '24 hours ago' '+%Y-%m-%d %H:%M:%S')
bans=$(cat "$LOG.1" "$LOG" 2>/dev/null | awk -v s="$since" '($1" "substr($2,1,8)) >= s' \
  | grep ' Ban ' | sed -E 's/.*\[([^]]+)\] Ban ([0-9a-fA-F.:]+).*/\1 \2/')
total=$(printf '%s\n' "$bans" | grep -c . || true)
if [ "$total" -eq 0 ]; then
  logger -t ecoflow-fail2ban "за 24 ч.: 0 бана"
else
  summary=$(printf '%s\n' "$bans" | sort | uniq -c | awk '{printf "%s %s (%d), ", $2, $3, $1}' | sed 's/, $//')
  logger -t ecoflow-fail2ban -p user.warning "за 24 ч.: ${total} бана — ${summary}"
fi
now=$(for j in $(fail2ban-client status | sed -n 's/.*Jail list:[[:space:]]*//p' | tr ',' ' '); do
  n=$(fail2ban-client status "$j" | sed -n 's/.*Currently banned:[[:space:]]*//p'); echo -n "$j=$n "; done)
logger -t ecoflow-fail2ban "сега банати: ${now}"
