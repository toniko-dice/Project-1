#!/usr/bin/env bash
# Опресняване на кеша след всеки старт на сайта (`ExecStartPost` в
# ecoflow.service; 19 октомври 2026).
#
# Защо: Next пази отметките „опресни" (revalidateTag / revalidatePath) САМО
# в паметта на процеса. След рестарт без билд те изчезват и сайтът отново
# сервира HTML-а от последния билд — със старите данни отпреди всяка смяна
# в базата след него (така на 19.10.2026 футърът върна support@dice.bg).
# Тук след старта се вика същото опресняване като след внос — всичко се
# пресъздава от базата при първото зареждане.
#
# Не проваля старта: в unit-а редът е с „-", а тук — изход 0 при неуспех.
cd /srv/ecoflow-bg || exit 0
for _ in $(seq 1 60); do
  curl -s -o /dev/null -m 2 http://127.0.0.1:3000/api/zaklyuchvane && break
  sleep 1
done
KEY=$(grep -E '^PAYLOAD_SECRET=' .env | cut -d= -f2-)
code=$(curl -s -o /dev/null -m 10 -w '%{http_code}' -X POST -H "x-revalidate-key: $KEY" \
  http://127.0.0.1:3000/api/products/revalidate)
echo "опресняване на кеша след старт: $code"
exit 0
