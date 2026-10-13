#!/bin/bash
# След подновяване на сертификата — nginx го зарежда наново, без прекъсване.
# На сървъра: /etc/letsencrypt/renewal-hooks/deploy/ecoflow-nginx-reload.sh
nginx -t -q && systemctl reload nginx
logger -t ecoflow-cert "сертификатът е подновен: $RENEWED_DOMAINS — nginx презареден"
