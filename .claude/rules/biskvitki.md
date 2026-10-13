---
paths:
  - "src/lib/consent.ts"
  - "src/lib/track.ts"
  - "src/components/CookieConsent.tsx"
  - "src/components/CookieTable.tsx"
  - "src/components/CookieSettingsButton.tsx"
  - "src/collections/CookieConsents.ts"
---

# Банер за бисквитки, Consent Mode, GA4

Подробно — `docs/funkcii/biskvitki.md`; инвентаризацията — `docs/biskvitki-inventar.md`.

- **Едно място — `src/lib/consent.ts`:** категориите, бисквитките, `CONSENT_VERSION`. Нова услуга = ред в `COOKIES`. Категория без бисквитка не се показва (Маркетинг); „Външно съдържание" няма. Нова версия на политиката → вдигни `CONSENT_VERSION`.
- **„Отказвам всички" и „Приемам всички" — един и същ клас**, на първия екран; без X; нищо не е включено предварително; не е cookie wall. „Приемам всички" включва само показаните категории.
- **`ecoflow_consent`** — first-party, `Lax`, `Secure` на https, 6 месеца.
- **Доказателство** — „Съгласия за бисквитки" през `POST /api/cookie-consents/record`, без IP; 12 месеца.
- **GA4 — само с `NEXT_PUBLIC_GA_ID` и само след съгласие** (basic consent mode): в `<head>` само `consent default` (denied); `gtag/js` — след „Аналитични"; оттегляне → трие `_ga`, `_ga_*` и презарежда. `track()` праща само при съгласие. `NEXT_PUBLIC_*` се вгражда при билда.
- Настройките се отварят от линк `#nastroyki-biskvitki` или събитие `ecoflow:consent-open`. Банерът е само в `(frontend)` — не в `/admin` и не на `/vhod`.
- Посетителят днес не получава нито една бисквитка; Gravatar в админа е изключен (`admin.avatar: 'default'`).
