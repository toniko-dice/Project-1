/**
 * Двата имейла от контактната форма (`/kontakti`, `task-futar.md`) —
 * вътрешният до support@dice.bg (`CONTACT_NOTIFY_TO`, иначе
 * `QUOTE_NOTIFY_TO`) с Reply-To на клиента и краткото потвърждение до
 * клиента. Шаблонът е същият като на заявките за оферта (`layout`).
 * Без телефона на фирмата.
 *
 * Сървърен модул.
 */
import type { Payload } from 'payload'

import { absoluteUrl, SITE_URL } from './site-url'
import { button, esc, FONT, INK, layout, type MailContacts, MUTED, nl2br, rows, siteHost, textFooter } from './quote/mail'

export type ContactMail = {
  id: number
  name: string
  phone: string
  email: string
  message: string
  page: string
  createdAt: Date
}

const бгВреме = (d: Date) =>
  d.toLocaleString('bg-BG', { timeZone: 'Europe/Sofia', dateStyle: 'long', timeStyle: 'short' })

const бележка = () => `Този имейл е изпратен от контактната форма на ${siteHost()}.`

const LINE = '#e3e3e3'

/** Ред с линк (телефон, имейл) — `rows` екранира стойността и не дава линк. */
const редСЛинк = (k: string, label: string, href: string) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">
  <tr>
    <td valign="top" style="padding:7px 12px 7px 0;width:38%;font-family:${FONT};font-size:14px;line-height:1.45;color:${MUTED};border-bottom:1px solid ${LINE}">${esc(k)}</td>
    <td valign="top" style="padding:7px 0;font-family:${FONT};font-size:14px;line-height:1.45;color:${INK};border-bottom:1px solid ${LINE}"><a href="${esc(href)}" style="color:${INK}">${esc(label)}</a></td>
  </tr>
</table>`

export const internalContactMail = (m: ContactMail, c: MailContacts) => {
  const host = siteHost()
  const adminUrl = absoluteUrl(`/admin/collections/contact-messages/${m.id}`)
  const subject = `[${host}] Контактна форма — ${m.name}`
  const html = layout(
    c,
    `${m.name}: ${m.message.slice(0, 80)}`,
    `<p style="margin:0 0 18px;padding:10px 14px;background:#fff4e6;border-radius:8px;font-size:14px;color:${INK}">Съобщение от контактната форма на сайта <strong>${esc(host)}</strong></p>
<h1 style="margin:0 0 6px;font-family:${FONT};font-size:22px;line-height:1.3;font-weight:700;color:#000000">Ново съобщение от ${esc(m.name)}</h1>
<p style="margin:0 0 4px;color:${MUTED};font-size:14px">${esc(бгВреме(m.createdAt))}</p>
${button('Отвори в админа', adminUrl)}
${rows([['Име', m.name]])}
${редСЛинк('Телефон', m.phone, `tel:${m.phone.replace(/[^\d+]/g, '')}`)}
${редСЛинк('Имейл', m.email, `mailto:${m.email}`)}
${rows([
  ['Дата и час', бгВреме(m.createdAt)],
  ['От страница', m.page],
])}
<h2 style="margin:24px 0 8px;font-family:${FONT};font-size:17px;font-weight:700;color:#000000">Съобщение</h2>
<p style="margin:0;font-size:15px;line-height:1.6">${nl2br(m.message)}</p>
<p style="margin:22px 0 0;font-size:13px;color:${MUTED}">„Отговор“ на този имейл отива директно до клиента (${esc(m.email)}).</p>`,
    бележка(),
  )
  const text = [
    `Съобщение от контактната форма на сайта ${host}`,
    `Отвори в админа: ${adminUrl}`,
    '',
    `Име: ${m.name}`,
    `Телефон: ${m.phone}`,
    `Имейл: ${m.email}`,
    `Дата и час: ${бгВреме(m.createdAt)}`,
    m.page ? `От страница: ${m.page}` : '',
    '',
    'СЪОБЩЕНИЕ',
    m.message,
    '',
    textFooter(c, бележка()),
  ]
    .filter((s, i, a) => s !== '' || a[i - 1] !== '')
    .join('\n')
  return { subject, html, text }
}

export const customerContactMail = (m: ContactMail, c: MailContacts) => {
  const subject = 'Получихме съобщението ви — EcoFlow България'
  const html = layout(
    c,
    'Ще ви отговорим възможно най-скоро.',
    `<h1 style="margin:0 0 14px;font-family:${FONT};font-size:22px;line-height:1.3;font-weight:700;color:#000000">Здравейте, ${esc(m.name)}!</h1>
<p style="margin:0 0 12px">Получихме съобщението ви и ще ви отговорим на ${esc(m.email)} възможно най-скоро. Благодарим ви!</p>
<p style="margin:0;color:${MUTED};font-size:14px">Ако искате да добавите нещо, просто отговорете на този имейл.</p>
<h2 style="margin:24px 0 8px;font-family:${FONT};font-size:17px;font-weight:700;color:#000000">Вашето съобщение</h2>
<p style="margin:0;padding:12px 14px;background:#f5f5f5;border-radius:8px;font-size:14px;line-height:1.6">${nl2br(m.message)}</p>
${button('Към сайта', SITE_URL)}`,
    бележка(),
  )
  const text = [
    `Здравейте, ${m.name}!`,
    '',
    `Получихме съобщението ви и ще ви отговорим на ${m.email} възможно най-скоро. Благодарим ви!`,
    'Ако искате да добавите нещо, просто отговорете на този имейл.',
    '',
    'ВАШЕТО СЪОБЩЕНИЕ',
    m.message,
    '',
    textFooter(c, бележка()),
  ].join('\n')
  return { subject, html, text }
}

/** Изпраща двата имейла; връща ред за дневника. Грешка в пощата не губи съобщението. */
export const sendContactMails = async (payload: Payload, m: ContactMail, c: MailContacts): Promise<string> => {
  const notifyTo = process.env.CONTACT_NOTIFY_TO || process.env.QUOTE_NOTIFY_TO || 'support@dice.bg'
  const log: string[] = []
  const internal = internalContactMail(m, c)
  try {
    await payload.sendEmail({
      to: notifyTo,
      replyTo: `${m.name.replace(/[<>"]/g, '')} <${m.email}>`,
      subject: internal.subject,
      html: internal.html,
      text: internal.text,
    })
    log.push(`вътрешен → ${notifyTo}: изпратен`)
  } catch (e) {
    log.push(`вътрешен → ${notifyTo}: ГРЕШКА ${(e as Error).message}`)
  }
  const customer = customerContactMail(m, c)
  try {
    await payload.sendEmail({
      to: m.email,
      ...(c.email ? { replyTo: c.email } : {}),
      subject: customer.subject,
      html: customer.html,
      text: customer.text,
    })
    log.push(`копие → ${m.email}: изпратено`)
  } catch (e) {
    log.push(`копие → ${m.email}: ГРЕШКА ${(e as Error).message}`)
  }
  return `${new Date().toISOString()} — ${log.join('; ')}`
}
