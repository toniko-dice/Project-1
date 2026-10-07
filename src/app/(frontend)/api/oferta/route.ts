import { getGlobal, getPayloadClient, getProductsByIds } from '@/lib/payload'
import { mediaUrl, productCardData } from '@/lib/media'
import { checkCaptcha } from '@/lib/quote/captcha'
import { sendQuoteMails, type MailRequest } from '@/lib/quote/mail'
import { fileError, validateQuote, type QuotePayload } from '@/lib/quote/options'
import { absoluteUrl } from '@/lib/site-url'

/**
 * `POST /api/oferta` — заявка за оферта от `/oferta-za-firmi` (multipart).
 *
 * Всички проверки са тук, независимо какво е проверил браузърът, в този ред:
 *
 * 1. Капанът (`website`, скрито поле) е попълнен → „успех" без запис.
 * 2. Полетата (`validateQuote` — същата функция като във формата), файлът.
 *    При грешки CAPTCHA-та НЕ се изгаря: човекът поправя полето и праща пак.
 * 3. CAPTCHA (`checkCaptcha`): подпис, 10 минути, веднъж. По-малко от 3 s
 *    от издаването на кода → „успех" без запис (робот).
 * 4. До 5 приети заявки на час от един IP.
 * 5. Номер ГГГГ-NNNN, запис, двата имейла. Грешка в пощата не губи
 *    заявката — записва се в „Изпращане на имейлите" на записа.
 *
 * Колекцията е затворена за публично писане; записът минава през
 * локалното API, което заобикаля правата.
 */
export const dynamic = 'force-dynamic'

const LIMIT = 5
const WINDOW_MS = 60 * 60 * 1000
const g = globalThis as unknown as { __quoteHits?: Map<string, number[]> }
const hits = (g.__quoteHits ??= new Map())

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

/** Отговорът на робот — изглежда като успех, нищо не е записано. */
const silent = () => json({ ok: true, number: null })

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim()

export const POST = async (request: Request): Promise<Response> => {
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return json({ ok: false, message: 'Неправилна заявка.' }, 400)
  }

  if (str(form, 'website')) return silent()

  let items: { product: number; quantity: number }[] = []
  try {
    const raw = JSON.parse(str(form, 'items') || '[]') as { product: unknown; quantity: unknown }[]
    items = raw.map((i) => ({ product: Number(i.product), quantity: Number(i.quantity) }))
  } catch {
    return json({ ok: false, message: 'Неправилна заявка.' }, 400)
  }

  const data: QuotePayload = {
    clientType: str(form, 'clientType'),
    organization: str(form, 'organization'),
    eik: str(form, 'eik').replace(/\s/g, ''),
    city: str(form, 'city'),
    contactName: str(form, 'contactName'),
    position: str(form, 'position'),
    email: str(form, 'email'),
    phone: str(form, 'phone'),
    items,
    otherProducts: str(form, 'otherProducts'),
    purposes: form.getAll('purposes').map(String),
    timeframe: str(form, 'timeframe'),
    budget: str(form, 'budget'),
    procurement: str(form, 'procurement'),
    documents: form.getAll('documents').map(String),
    deliveryTo: str(form, 'deliveryTo'),
    consultation: str(form, 'consultation'),
    details: str(form, 'details'),
    consent: str(form, 'consent') === 'yes',
  }

  const errors = validateQuote(data)

  /* Продуктите — само публикуваните; изтрит или скрит междувременно → грешка. */
  const ids = [...new Set(items.map((i) => i.product))].filter((n) => Number.isInteger(n) && n > 0)
  const products = ids.length ? await getProductsByIds(ids) : {}
  if (items.some((i) => !products[i.product])) {
    errors.items = 'Някой от избраните продукти вече не е наличен на сайта — махнете го и опитайте пак.'
  }
  if (new Set(items.map((i) => i.product)).size !== items.length) {
    errors.items = 'Продукт е избран два пъти.'
  }

  const file = form.get('attachment')
  const upload = file instanceof File && file.size > 0 ? file : null
  if (upload) {
    const e = fileError(upload.name, upload.type, upload.size)
    if (e) errors.attachment = e
  }

  if (Object.keys(errors).length) {
    return json({ ok: false, errors, message: 'Моля, поправете отбелязаните полета.' }, 422)
  }

  const captcha = checkCaptcha(str(form, 'captchaToken'), str(form, 'captchaAnswer'))
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
      {
        ok: false,
        message:
          'От този адрес вече са изпратени няколко заявки през последния час. Опитайте по-късно или се свържете с нас по телефона.',
      },
      429,
    )
  }

  const payload = await getPayloadClient()

  /* ─────────── файлът ─────────── */
  let attachment: MailRequest['attachment'] = null
  let attachmentId: number | null = null
  if (upload) {
    const buf = Buffer.from(await upload.arrayBuffer())
    const doc = await payload.create({
      collection: 'quote-files',
      data: {},
      file: { data: buf, mimetype: upload.type || 'application/octet-stream', name: upload.name, size: buf.length },
      depth: 0,
    })
    attachmentId = doc.id
    attachment = {
      filename: doc.filename ?? upload.name,
      url: absoluteUrl(`/api/quote-files/file/${encodeURIComponent(doc.filename ?? '')}`),
      size: buf.length,
      mimeType: doc.mimeType ?? upload.type,
      path: `${process.cwd()}/quote-files/${doc.filename}`,
    }
  }

  /* ─────────── продуктите към момента на заявката ─────────── */
  const mailItems = items.map((i) => {
    const p = products[i.product]!
    const card = productCardData(p)
    const image = card.imageUrl ?? mediaUrl(p.image, 'thumbnail')
    return {
      product: p.id,
      title: card.title,
      url: absoluteUrl(card.url ?? '/'),
      image: image ? absoluteUrl(image) : null,
      quantity: i.quantity,
    }
  })
  const totalQty = items.reduce((s, i) => s + i.quantity, 0)

  /* ─────────── номерът и записът ─────────── */
  const year = new Date().getFullYear()
  let created: { id: number; number?: string | null } | null = null
  for (let attempt = 0; attempt < 5 && !created; attempt++) {
    const last = await payload.find({
      collection: 'quote-requests',
      where: { number: { like: `${year}-` } },
      sort: '-number',
      limit: 1,
      depth: 0,
      select: { number: true },
    })
    const n = Number(String(last.docs[0]?.number ?? '').split('-')[1] ?? 0) + 1 + attempt
    const number = `${year}-${String(n).padStart(4, '0')}`
    try {
      created = await payload.create({
        collection: 'quote-requests',
        depth: 0,
        data: {
          number,
          status: 'new',
          clientType: data.clientType as never,
          organization: data.organization,
          eik: data.eik,
          city: data.city,
          contactName: data.contactName,
          position: data.position,
          email: data.email,
          phone: data.phone,
          items: mailItems.map(({ product, title, url, quantity }) => ({ product, title, url, quantity })),
          itemsSummary: `${items.length} / ${totalQty}`,
          otherProducts: data.otherProducts,
          purposes: data.purposes as never,
          timeframe: (data.timeframe || null) as never,
          budget: data.budget,
          procurement: (data.procurement || null) as never,
          documents: data.documents as never,
          deliveryTo: data.deliveryTo,
          consultation: (data.consultation || null) as never,
          attachment: attachmentId,
          details: data.details,
          consent: true,
          ip,
          userAgent: (request.headers.get('user-agent') ?? '').slice(0, 400),
        },
      })
    } catch (e) {
      // Същият номер в същия миг (две заявки наведнъж) — следващият.
      if (!/unique|UNIQUE/.test(String((e as Error).message))) throw e
    }
  }
  if (!created) return json({ ok: false, message: 'Заявката не се записа. Опитайте отново.' }, 500)

  recentFrom(ip).push(Date.now())

  /* ─────────── имейлите ─────────── */
  const [settings, header] = await Promise.all([getGlobal('site-settings'), getGlobal('header')])
  const logo = mediaUrl((header as { logo?: unknown }).logo as never)
  const mailLog = await sendQuoteMails(
    payload,
    {
      ...data,
      id: created.id,
      number: created.number ?? '',
      items: mailItems,
      attachment,
    },
    {
      logoUrl: logo ? absoluteUrl(logo) : null,
      companyName: settings.companyName ?? '',
      address: settings.address ?? '',
      phone: settings.phone ?? '',
      email: settings.email ?? '',
    },
  )
  await payload.update({ collection: 'quote-requests', id: created.id, data: { mailLog }, depth: 0 })

  return json({ ok: true, number: created.number, email: data.email })
}
