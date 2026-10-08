import { getPayloadClient } from '@/lib/payload'
import { validateContact, type ContactPayload } from '@/lib/contact'
import { sendContactMails } from '@/lib/contact-mail'
import { checkCaptcha } from '@/lib/quote/captcha'
import { loadMailContacts } from '@/lib/quote/mail'
import { SITE_URL } from '@/lib/site-url'

/**
 * `POST /api/kontakti` — съобщение от формата на `/kontakti` (JSON).
 *
 * Защитата е същата като на `POST /api/oferta`, в същия ред:
 * капанът (`website`) → „успех" без запис; полетата (`validateContact` —
 * същата функция като във формата), при грешка CAPTCHA-та НЕ се изгаря;
 * CAPTCHA (по-малко от 3 s → „успех" без запис); до 5 съобщения на час от
 * един IP. После запис в „Съобщения" и двата имейла — грешка в пощата не
 * губи съобщението (записва се в „Изпращане на имейлите").
 */
export const dynamic = 'force-dynamic'

const LIMIT = 5
const WINDOW_MS = 60 * 60 * 1000
const g = globalThis as unknown as { __contactHits?: Map<string, number[]> }
const hits = (g.__contactHits ??= new Map())

const clientIp = (h: Headers): string =>
  h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'неизвестен'

const recentFrom = (ip: string) => {
  const now = Date.now()
  const list = (hits.get(ip) ?? []).filter((t: number) => now - t < WINDOW_MS)
  hits.set(ip, list)
  return list
}

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

const silent = () => json({ ok: true })

/** Страницата, от която е дошъл — само адрес от сайта, без параметрите. */
const отСтраница = (raw: string): string => {
  try {
    const u = new URL(raw)
    const site = new URL(SITE_URL)
    return u.host === site.host || u.hostname === 'localhost' ? u.pathname : ''
  } catch {
    return ''
  }
}

export const POST = async (request: Request): Promise<Response> => {
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return json({ ok: false, message: 'Неправилна заявка.' }, 400)
  }
  const str = (k: string) => String(body[k] ?? '').trim()

  if (str('website')) return silent()

  const data: ContactPayload = {
    name: str('name'),
    phone: str('phone'),
    email: str('email'),
    message: String(body.message ?? '').trim(),
    consent: body.consent === true,
  }
  const errors = validateContact(data)
  if (Object.keys(errors).length) {
    return json({ ok: false, errors, message: 'Моля, поправете отбелязаните полета.' }, 422)
  }

  const captcha = checkCaptcha(str('captchaToken'), str('captchaAnswer'))
  if (captcha === 'too-fast') return silent()
  if (captcha !== 'ok') {
    const message =
      captcha === 'wrong'
        ? 'Символите от картинката не съвпадат. Въведете новия код.'
        : 'Кодът от картинката е изтекъл. Въведете новия код.'
    return json({ ok: false, errors: { captcha: message }, message, newCaptcha: true }, 422)
  }

  const ip = clientIp(request.headers)
  if (recentFrom(ip).length >= LIMIT) {
    return json(
      { ok: false, message: 'От този адрес вече са изпратени няколко съобщения през последния час. Опитайте по-късно или ни пишете на имейла.' },
      429,
    )
  }

  const payload = await getPayloadClient()
  const page = отСтраница(str('page'))
  const created = await payload.create({
    collection: 'contact-messages',
    depth: 0,
    data: {
      status: 'new',
      name: data.name,
      phone: data.phone,
      email: data.email,
      message: data.message,
      consent: true,
      page,
      ip,
      userAgent: (request.headers.get('user-agent') ?? '').slice(0, 400),
    },
  })
  recentFrom(ip).push(Date.now())

  const mailLog = await sendContactMails(
    payload,
    { id: created.id, ...data, page, createdAt: new Date(created.createdAt) },
    await loadMailContacts(payload),
  )
  await payload.update({ collection: 'contact-messages', id: created.id, data: { mailLog }, depth: 0 })

  return json({ ok: true, email: data.email })
}
