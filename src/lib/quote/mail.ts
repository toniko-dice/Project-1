/**
 * Двата имейла след заявка за оферта — вътрешният (до `QUOTE_NOTIFY_TO`) и
 * копието до клиента. Един HTML шаблон в стила на сайта: бяла лента с
 * логото, светлосив фон, бяла карта до 600 px, тъмни бутони като „Купи
 * сега", тъмна лента с контактите долу.
 *
 * За Outlook и Gmail: таблична верстка, всички стилове inline, всички
 * снимки с пълен адрес (`SITE_URL`). Към всеки имейл — и текстова версия.
 *
 * Адресът на сайта навсякъде е `SITE_URL` (`NEXT_PUBLIC_SITE_URL`), не
 * зашит: на сървъра това е bg-ecoflow.com, локално — localhost.
 *
 * Никакви срокове: текстът казва „в максимално кратък срок" и толкова.
 *
 * Сървърен модул.
 */
import type { Payload } from 'payload'

import { mediaUrl } from '../media'
import { PRIVACY_PATH } from '../legal'
import { absoluteUrl, SITE_URL } from '../site-url'
import {
  CLIENT_TYPES,
  CONSULTATION,
  DOCUMENTS,
  labelOf,
  PROCUREMENT,
  PURPOSES,
  TIMEFRAMES,
} from './options'
import { gateMode } from '../gate'

export type MailItem = { title: string; url: string; image: string | null; quantity: number }

export type MailRequest = {
  id: number
  number: string
  clientType: string
  organization: string
  eik: string
  city: string
  contactName: string
  position: string
  email: string
  phone: string
  items: MailItem[]
  otherProducts: string
  purposes: string[]
  timeframe: string
  budget: string
  procurement: string
  documents: string[]
  deliveryTo: string
  consultation: string
  details: string
  attachment: { filename: string; url: string; size: number; mimeType: string; path: string } | null
}

export type MailContacts = {
  logoUrl: string | null
  companyName: string
  address: string
  phone: string
  email: string
}

/** Над толкова прикаченият файл отива като линк, не като приложение. */
const ATTACH_MAX = 5 * 1024 * 1024

export const siteHost = (): string => {
  try {
    return new URL(SITE_URL).host
  } catch {
    return SITE_URL
  }
}

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const nl2br = (s: string) => esc(s).replace(/\r?\n/g, '<br>')

const FONT = "Inter, 'Segoe UI', Arial, Helvetica, sans-serif"
const INK = '#1a1a1a'
const MUTED = '#6b6b6b'
const LINE = '#e3e3e3'

/* ─────────── части на шаблона ─────────── */

export const button = (label: string, href: string) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px">
  <tr><td bgcolor="#262626" style="border-radius:8px">
    <a href="${esc(href)}" target="_blank" style="display:inline-block;padding:12px 24px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px">${esc(label)}</a>
  </td></tr>
</table>`

export const heading = (text: string) =>
  `<h2 style="margin:28px 0 10px;font-family:${FONT};font-size:17px;line-height:1.3;font-weight:700;color:#000000">${esc(text)}</h2>`

/** Ред „етикет — стойност"; празната стойност не дава ред. */
const rows = (pairs: [string, string][]) => {
  const filled = pairs.filter(([, v]) => v && v.trim())
  if (!filled.length) return ''
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">
${filled
  .map(
    ([k, v]) => `  <tr>
    <td valign="top" style="padding:7px 12px 7px 0;width:38%;font-family:${FONT};font-size:14px;line-height:1.45;color:${MUTED};border-bottom:1px solid ${LINE}">${esc(k)}</td>
    <td valign="top" style="padding:7px 0;font-family:${FONT};font-size:14px;line-height:1.45;color:${INK};border-bottom:1px solid ${LINE}">${nl2br(v)}</td>
  </tr>`,
  )
  .join('\n')}
</table>`
}

const productsTable = (items: MailItem[]) => {
  if (!items.length) return `<p style="margin:0;font-family:${FONT};font-size:14px;color:${MUTED}">Няма избрани продукти от списъка.</p>`
  const total = items.reduce((s, i) => s + i.quantity, 0)
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">
${items
  .map(
    (i) => `  <tr>
    <td width="72" valign="middle" style="padding:8px 12px 8px 0;border-bottom:1px solid ${LINE}">${
      i.image
        ? `<img src="${esc(i.image)}" width="60" height="60" alt="" style="display:block;width:60px;height:60px;object-fit:contain;border:0">`
        : '&nbsp;'
    }</td>
    <td valign="middle" style="padding:8px 12px 8px 0;font-family:${FONT};font-size:14px;line-height:1.4;color:${INK};border-bottom:1px solid ${LINE}"><a href="${esc(i.url)}" target="_blank" style="color:${INK};text-decoration:underline">${esc(i.title)}</a></td>
    <td valign="middle" align="right" style="padding:8px 0;font-family:${FONT};font-size:14px;font-weight:700;color:${INK};white-space:nowrap;border-bottom:1px solid ${LINE}">${i.quantity} бр.</td>
  </tr>`,
  )
  .join('\n')}
  <tr>
    <td colspan="2" style="padding:10px 12px 0 0;font-family:${FONT};font-size:14px;font-weight:700;color:${INK}">Общо: ${items.length} продукта</td>
    <td align="right" style="padding:10px 0 0;font-family:${FONT};font-size:14px;font-weight:700;color:${INK};white-space:nowrap">${total} бр.</td>
  </tr>
</table>`
}

/** Общият шаблон — и за офертите (`src/lib/offers/mail.ts`). */
export const layout = (
  c: MailContacts,
  preheader: string,
  body: string,
  footerNote = `Този имейл е изпратен от формата за оферти на ${siteHost()}.`,
) => {
  const host = siteHost()
  return `<!doctype html>
<html lang="bg">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>EcoFlow България</title>
</head>
<body style="margin:0;padding:0;background:#F2F2F2">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F2F2F2" style="background:#F2F2F2">
  <tr><td align="center" style="padding:0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background:#ffffff;border-bottom:1px solid ${LINE}">
      <tr><td align="center" style="padding:18px 16px">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px">
          <tr><td style="font-family:${FONT}">
            <a href="${esc(SITE_URL)}" target="_blank" style="text-decoration:none;color:${INK}">${
              c.logoUrl
                ? `<img src="${esc(c.logoUrl)}" height="16" alt="EcoFlow" style="display:inline-block;height:16px;width:auto;border:0;vertical-align:middle">`
                : `<span style="font-size:18px;font-weight:700;letter-spacing:2px;vertical-align:middle">ECOFLOW</span>`
            }<span style="display:inline-block;margin-left:10px;padding-left:10px;border-left:1px solid #c9c9c9;font-size:14px;letter-spacing:0.5px;color:#444444;vertical-align:middle">МАГАЗИН</span></a>
            <div style="margin-top:4px;font-size:11px;color:${MUTED}">Официален дистрибутор за България</div>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </td></tr>
  <tr><td align="center" style="padding:28px 12px">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:600px;background:#ffffff;border-radius:12px">
      <tr><td style="padding:32px 32px 36px;font-family:${FONT};font-size:15px;line-height:1.55;color:${INK}">
${body}
      </td></tr>
    </table>
  </td></tr>
  <tr><td align="center" bgcolor="#1a1a1a" style="background:#1a1a1a;padding:26px 16px">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px">
      <tr><td style="font-family:${FONT};font-size:13px;line-height:1.7;color:#d9d9d9">
        <strong style="color:#ffffff">${esc(c.companyName || 'EcoFlow България')}</strong><br>
        ${c.address ? `${nl2br(c.address).replace(/<br>/g, ', ')}<br>` : ''}
        ${c.phone ? `Тел.: <a href="tel:${esc(c.phone.replace(/\s/g, ''))}" style="color:#ffffff;text-decoration:none">${esc(c.phone)}</a><br>` : ''}
        ${c.email ? `Имейл: <a href="mailto:${esc(c.email)}" style="color:#ffffff;text-decoration:none">${esc(c.email)}</a><br>` : ''}
        <a href="${esc(SITE_URL)}" target="_blank" style="color:#ffffff">${esc(host)}</a>
        <div style="margin-top:14px;font-size:12px;color:#9a9a9a">${esc(footerNote)}<br><a href="${esc(absoluteUrl(PRIVACY_PATH))}" target="_blank" style="color:#9a9a9a">Политика за поверителност</a></div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

/* ─────────── съдържанието ─────────── */

const detailPairs = (r: MailRequest): [string, string][] => [
  ['За какво ще се ползват', r.purposes.map((p) => labelOf(PURPOSES, p)).join(', ')],
  ['Кога ви трябват', labelOf(TIMEFRAMES, r.timeframe)],
  ['Ориентировъчен бюджет', r.budget],
  ['Начин на възлагане', labelOf(PROCUREMENT, r.procurement)],
  ['Нужни документи', r.documents.map((d) => labelOf(DOCUMENTS, d)).join(', ')],
  ['Доставка до', r.deliveryTo],
  ['Консултация или монтаж', labelOf(CONSULTATION, r.consultation)],
  ['Прикачен файл', r.attachment?.filename ?? ''],
  ['Допълнителна информация', r.details],
]

const orgPairs = (r: MailRequest): [string, string][] => [
  ['Тип клиент', labelOf(CLIENT_TYPES, r.clientType)],
  ['Организация', r.organization],
  ['ЕИК / БУЛСТАТ', r.eik],
  ['Град / община', r.city],
]

const contactPairs = (r: MailRequest): [string, string][] => [
  ['Име и фамилия', r.contactName],
  ['Длъжност', r.position],
  ['Имейл', r.email],
  ['Телефон', r.phone],
]

const textBlock = (title: string, pairs: [string, string][]) => {
  const filled = pairs.filter(([, v]) => v && v.trim())
  return filled.length ? `${title.toUpperCase()}\n${filled.map(([k, v]) => `${k}: ${v}`).join('\n')}\n` : ''
}

const textItems = (items: MailItem[]) =>
  items.length
    ? `ПРОДУКТИ\n${items.map((i) => `- ${i.title} — ${i.quantity} бр.\n  ${i.url}`).join('\n')}\nОбщо: ${items.length} продукта, ${items.reduce((s, i) => s + i.quantity, 0)} бр.\n`
    : 'ПРОДУКТИ\nНяма избрани продукти от списъка.\n'

export const textFooter = (c: MailContacts, footerNote = `Този имейл е изпратен от формата за оферти на ${siteHost()}.`) =>
  [
    '—',
    c.companyName || 'EcoFlow България',
    c.address.replace(/\r?\n/g, ', '),
    c.phone ? `Тел.: ${c.phone}` : '',
    c.email ? `Имейл: ${c.email}` : '',
    SITE_URL,
    footerNote,
    `Политика за поверителност: ${absoluteUrl(PRIVACY_PATH)}`,
  ]
    .filter(Boolean)
    .join('\n')

/** Вътрешният имейл — до екипа. */
export const internalMail = (r: MailRequest, c: MailContacts) => {
  const host = siteHost()
  const adminUrl = absoluteUrl(`/admin/collections/quote-requests/${r.id}`)
  const typeLabel = labelOf(CLIENT_TYPES, r.clientType)
  const subject = `[${host}] Нова заявка за оферта № ${r.number} — ${r.organization} (${typeLabel})`
  const bigFile = r.attachment && r.attachment.size > ATTACH_MAX

  const html = layout(
    c,
    `${r.organization} — ${r.items.length} продукта`,
    `<p style="margin:0 0 18px;padding:10px 14px;background:#fff4e6;border-radius:8px;font-size:14px;color:${INK}">Заявка от сайта <strong>${esc(host)}</strong> — форма „Оферта за фирми“</p>
<h1 style="margin:0 0 6px;font-family:${FONT};font-size:22px;line-height:1.3;font-weight:700;color:#000000">Нова заявка за оферта № ${esc(r.number)}</h1>
<p style="margin:0 0 4px;color:${MUTED};font-size:14px">${esc(r.organization)} · ${esc(typeLabel)} · ${esc(r.city)}</p>
${button('Отвори в админа', adminUrl)}
${heading('Организация')}${rows(orgPairs(r))}
${heading('Лице за контакт')}${rows(contactPairs(r))}
${heading('Продукти и количества')}${productsTable(r.items)}
${r.otherProducts.trim() ? `${heading('Други продукти или изисквания')}<p style="margin:0;font-size:14px">${nl2br(r.otherProducts)}</p>` : ''}
${heading('Подробности')}${rows(detailPairs(r)) || `<p style="margin:0;font-size:14px;color:${MUTED}">—</p>`}
${
  r.attachment
    ? `<p style="margin:16px 0 0;font-size:14px">Прикаченият файл „${esc(r.attachment.filename)}“ ${
        bigFile
          ? `е над 5 MB — <a href="${esc(r.attachment.url)}" style="color:${INK}">свалете го от админа</a>.`
          : 'е приложен към този имейл.'
      }</p>`
    : ''
}
<p style="margin:22px 0 0;font-size:13px;color:${MUTED}">Отговор на този имейл отива директно до клиента (${esc(r.email)}).</p>`,
  )

  const text = [
    `Заявка от сайта ${host} — форма „Оферта за фирми“`,
    `Нова заявка за оферта № ${r.number}`,
    `Отвори в админа: ${adminUrl}`,
    '',
    textBlock('Организация', orgPairs(r)),
    textBlock('Лице за контакт', contactPairs(r)),
    textItems(r.items),
    r.otherProducts.trim() ? `ДРУГИ ПРОДУКТИ ИЛИ ИЗИСКВАНИЯ\n${r.otherProducts}\n` : '',
    textBlock('Подробности', detailPairs(r)),
    r.attachment ? `Прикачен файл: ${r.attachment.filename}${bigFile ? ` — ${r.attachment.url}` : ' (в приложение)'}\n` : '',
    textFooter(c),
  ]
    .filter((s) => s !== '')
    .join('\n')

  return {
    subject,
    html,
    text,
    attachments:
      r.attachment && !bigFile
        ? [{ filename: r.attachment.filename, path: r.attachment.path, contentType: r.attachment.mimeType }]
        : [],
  }
}

/** Копието до клиента — без IP, бележки и статус. */
export const customerMail = (r: MailRequest, c: MailContacts) => {
  const subject = `Получихме вашата заявка за оферта № ${r.number} — EcoFlow България`
  const html = layout(
    c,
    'Ще ви изпратим оферта в максимално кратък срок.',
    `<h1 style="margin:0 0 14px;font-family:${FONT};font-size:22px;line-height:1.3;font-weight:700;color:#000000">Здравейте, ${esc(r.contactName)}!</h1>
<p style="margin:0 0 12px">Получихме вашата заявка № <strong>${esc(r.number)}</strong>. Ще ви изпратим оферта в максимално кратък срок. Благодарим ви за доверието!</p>
<p style="margin:0;color:${MUTED};font-size:14px">По-долу е копие на заявката. Ако нещо трябва да се промени, просто отговорете на този имейл или се обадете${c.phone ? ` на ${esc(c.phone)}` : ''}.</p>
${heading('Организация')}${rows([...orgPairs(r), ...contactPairs(r)])}
${heading('Продукти и количества')}${productsTable(r.items)}
${r.otherProducts.trim() ? `${heading('Други продукти или изисквания')}<p style="margin:0;font-size:14px">${nl2br(r.otherProducts)}</p>` : ''}
${rows(detailPairs(r)) ? `${heading('Подробности')}${rows(detailPairs(r))}` : ''}
${heading('Контакти')}
<p style="margin:0;font-size:14px">${c.phone ? `Телефон: <a href="tel:${esc(c.phone.replace(/\s/g, ''))}" style="color:${INK}">${esc(c.phone)}</a><br>` : ''}${c.email ? `Имейл: <a href="mailto:${esc(c.email)}" style="color:${INK}">${esc(c.email)}</a>` : ''}</p>
${button('Към сайта', SITE_URL)}`,
  )

  const text = [
    `Здравейте, ${r.contactName}!`,
    '',
    `Получихме вашата заявка № ${r.number}. Ще ви изпратим оферта в максимално кратък срок. Благодарим ви за доверието!`,
    '',
    textBlock('Организация', [...orgPairs(r), ...contactPairs(r)]),
    textItems(r.items),
    r.otherProducts.trim() ? `ДРУГИ ПРОДУКТИ ИЛИ ИЗИСКВАНИЯ\n${r.otherProducts}\n` : '',
    textBlock('Подробности', detailPairs(r)),
    `КОНТАКТИ\n${c.phone ? `Телефон: ${c.phone}\n` : ''}${c.email ? `Имейл: ${c.email}\n` : ''}`,
    textFooter(c),
  ]
    .filter((s) => s !== '')
    .join('\n')

  return { subject, html, text }
}

/** Контактите за имейлите — „Общи настройки" (както във футъра) и логото от „Меню (хедър)". */
export const loadMailContacts = async (payload: Payload): Promise<MailContacts> => {
  const [settings, header] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings', depth: 0 }),
    payload.findGlobal({ slug: 'header', depth: 1 }),
  ])
  const logo = mediaUrl((header as { logo?: unknown }).logo as never)
  /*
    Докато сайтът е заключен, снимките от Медия искат вход и пощенската
    програма не би заредила логото — тогава е копието в `public/vhod/`,
    което е отворено (`task-zaklyuchen-dostap.md`).
  */
  const заключен = gateMode() !== 'off' && (settings as { gate?: { locked?: boolean | null } }).gate?.locked !== false
  return {
    logoUrl: заключен ? absoluteUrl('/vhod/ecoflow-logo.png') : logo ? absoluteUrl(logo) : null,
    companyName: settings.companyName ?? '',
    address: settings.address ?? '',
    phone: settings.phone ?? '',
    email: settings.email ?? '',
  }
}

/** Изпраща двата имейла; връща ред за дневника на заявката. Грешка не спира заявката. */
export const sendQuoteMails = async (payload: Payload, r: MailRequest, c: MailContacts): Promise<string> => {
  const notifyTo = process.env.QUOTE_NOTIFY_TO || 'support@dice.bg'
  const log: string[] = []
  const internal = internalMail(r, c)
  try {
    await payload.sendEmail({
      to: notifyTo,
      replyTo: `${r.contactName} <${r.email}>`,
      subject: internal.subject,
      html: internal.html,
      text: internal.text,
      attachments: internal.attachments,
    })
    log.push(`вътрешен → ${notifyTo}: изпратен`)
  } catch (e) {
    log.push(`вътрешен → ${notifyTo}: ГРЕШКА ${(e as Error).message}`)
  }
  const customer = customerMail(r, c)
  try {
    await payload.sendEmail({
      to: r.email,
      ...(c.email ? { replyTo: c.email } : {}),
      subject: customer.subject,
      html: customer.html,
      text: customer.text,
    })
    log.push(`копие → ${r.email}: изпратено`)
  } catch (e) {
    log.push(`копие → ${r.email}: ГРЕШКА ${(e as Error).message}`)
  }
  return `${new Date().toISOString()} — ${log.join('; ')}`
}
