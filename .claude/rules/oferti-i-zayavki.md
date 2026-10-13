---
paths:
  - "src/collections/Offers.ts"
  - "src/collections/QuoteRequests.ts"
  - "src/collections/QuoteFiles.ts"
  - "src/collections/ContactMessages.ts"
  - "src/globals/OfferSettings.ts"
  - "src/lib/offers/**"
  - "src/lib/quote/**"
  - "src/lib/contact*.ts"
  - "src/components/QuoteForm.tsx"
  - "src/components/ContactForm.tsx"
  - "src/components/admin/Offer*.tsx"
  - "src/components/admin/Quote*.tsx"
  - "src/app/(frontend)/api/oferta/**"
  - "src/app/(frontend)/api/kontakti/**"
---

# Заявки за оферта, оферти, контакти

Подробно — `docs/funkcii/oferti-i-zayavki.md`, `futar-vaprosi-kontakti.md`.

- **Никъде не се обещават срокове** — нито на страниците, нито в имейлите; само „в максимално кратък срок".
- **Проверките — едно място за браузъра и сървъра:** `src/lib/quote/options.ts` (`validateQuote`, `validEik`), `src/lib/contact.ts`. ЕИК е по желание; 9/13 цифри — с контролна цифра.
- **Защита на формите:** SVG CAPTCHA с подписан жетон (HMAC, 10 мин., всеки опит го изгаря; не бисквитка), капан `website`, под 3 s → „успех" без запис, до 5 на час от IP (в паметта).
- **Заявката пази снимка на данните на реда** (име, адрес, SKU, EAN, снимка); `onEdit` взима наново само за нов/сменен ред. Редакцията НЕ праща имейли.
- **Цените в офертите са С ДДС** (`src/lib/offers/calc.ts` — една сметка за админа, сървъра, PDF-а); `totals.subtotal` е данъчната основа.
- **„Данни за офертите"** се копират в новата оферта — промяна там не пипа направените.
- **PDF** — `@react-pdf/renderer` на сървъра (в `serverExternalPackages`), Inter с кирилица от `src/assets/fonts/`; webp се преобразува в PNG/JPEG със Sharp.
- **Изпращане** — със запис на статуса; при незаписани промени — спира; повторно — с потвърждение (409).
- **`OfferDraftGuard`** пази незаписаните редове в `sessionStorage` (`next dev` презарежда админа при промяна на файл).
- **„Обща отстъпка %" се прилага само във формата** (`OfferGeneralDiscount`).
- Броячите в менюто — `CollectionNavBadge` / `QuoteNavBadge`.
- Имейлите — `src/lib/quote/mail.ts` (общ шаблон, без телефон); локално — `npm run mail:catcher`.
