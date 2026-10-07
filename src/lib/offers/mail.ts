/**
 * Имейлът с офертата — същият шаблон като имейлите от формата
 * (`src/lib/quote/mail.ts`). Текстът е този от прозореца „Изпрати на
 * клиента" (редактира се там); под него — кратко резюме. PDF-ът е приложен.
 *
 * Сървърен модул.
 */
import { button, esc, heading, layout, nl2br, textFooter, type MailContacts } from '../quote/mail'
import { SITE_URL } from '../site-url'
import { bgDate, eur } from './calc'

export type OfferMailData = {
  number: string
  date?: string | null
  validUntil?: string | null
  total: number
  text: string
}

/** Текстът по подразбиране в прозореца — редактира се преди изпращане. */
export const defaultOfferText = (o: {
  contactName?: string | null
  number?: string | null
  requestNumber?: string | null
  validUntil?: string | null
  preparedBy?: string | null
  companyName?: string | null
}) =>
  [
    `Здравейте${o.contactName ? `, ${o.contactName}` : ''}!`,
    '',
    `Изпращаме ви оферта № ${o.number ?? ''}${o.requestNumber ? ` по ваше запитване № ${o.requestNumber}` : ''}. Офертата е валидна до ${bgDate(o.validUntil)}.`,
    '',
    'При въпроси отговорете на този имейл.',
    '',
    'Поздрави,',
    [o.preparedBy, o.companyName].filter(Boolean).join(', '),
  ].join('\n')

export const offerMail = (d: OfferMailData, c: MailContacts) => {
  const html = layout(
    c,
    `Оферта № ${d.number} — валидна до ${bgDate(d.validUntil)}`,
    `<p style="margin:0 0 18px;font-size:15px;line-height:1.6">${nl2br(d.text)}</p>
${heading(`Оферта № ${d.number}`)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">
  <tr><td style="padding:6px 0;font-size:14px;color:#6b6b6b;border-bottom:1px solid #e3e3e3">Дата</td><td align="right" style="padding:6px 0;font-size:14px;border-bottom:1px solid #e3e3e3">${esc(bgDate(d.date))}</td></tr>
  <tr><td style="padding:6px 0;font-size:14px;color:#6b6b6b;border-bottom:1px solid #e3e3e3">Валидна до</td><td align="right" style="padding:6px 0;font-size:14px;border-bottom:1px solid #e3e3e3">${esc(bgDate(d.validUntil))}</td></tr>
  <tr><td style="padding:8px 0;font-size:15px;font-weight:700">Общо с ДДС</td><td align="right" style="padding:8px 0;font-size:15px;font-weight:700">${esc(eur(d.total))}</td></tr>
</table>
<p style="margin:16px 0 0;font-size:14px;color:#6b6b6b">Офертата е приложена като PDF.</p>
${button('Към сайта', SITE_URL)}`,
  )
  const text = [
    d.text,
    '',
    `Оферта № ${d.number}`,
    `Дата: ${bgDate(d.date)}`,
    `Валидна до: ${bgDate(d.validUntil)}`,
    `Общо с ДДС: ${eur(d.total)}`,
    'Офертата е приложена като PDF.',
    '',
    textFooter(c),
  ].join('\n')
  return { html, text }
}
