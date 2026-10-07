/**
 * Адресите на офертите — всички само за влязъл админ:
 *
 *   GET  /api/offers/:id/pdf               — PDF-ът (`?download=1` — за сваляне)
 *   GET  /api/offers/:id/send-preview      — стойностите за прозореца „Изпрати на клиента"
 *   POST /api/offers/:id/send              — изпраща ({ to, subject, text, force })
 *   POST /api/offers/from-request/:id      — нова оферта от заявка → { id }
 *
 * PDF-ът и пощата се зареждат динамично — конфигурацията на Payload се
 * чете и от скриптовете, които нямат нужда от тях.
 */
import type { Endpoint, PayloadRequest } from 'payload'


const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
const forbidden = () => json({ error: 'Нужен е вход в админа.' }, 403)
const idOf = (req: PayloadRequest) => Number(req.routeParams?.id)

type OfferDoc = {
  id: number
  number?: string | null
  date?: string | null
  validUntil?: string | null
  status?: string | null
  quoteRequest?: number | { id: number } | null
  requestNumber?: string | null
  client?: { email?: string | null; contactPerson?: string | null; organization?: string | null } | null
  preparedBy?: { name?: string | null; position?: string | null } | null
  totals?: { total?: number | null } | null
  sentAt?: string | null
  sendLog?: string | null
}

/** Латински запасен вариант на името на файла — за стари клиенти без UTF-8 в заглавието. */
const asciiName = (number: string) => `Oferta-${number.replace(/ОФ/g, 'OF').replace(/[^A-Za-z0-9-]/g, '')}.pdf`

const pdfFor = async (req: PayloadRequest, id: number) => {
  const offer = await req.payload.findByID({ collection: 'offers', id, depth: 1, req })
  const { renderOfferPdf } = await import('./pdf')
  return { offer: offer as unknown as OfferDoc, pdf: await renderOfferPdf(req.payload, offer as never) }
}

/** Първото име от „лице за контакт" („Мария Тестова, Кмет" → „Мария Тестова"). */
const contactName = (o: OfferDoc) => (o.client?.contactPerson ?? '').split(',')[0]!.trim()

const companyOf = async (req: PayloadRequest) =>
  ((await req.payload.findGlobal({ slug: 'offer-settings', depth: 0, req })) as { company?: { name?: string | null; email?: string | null } })
    .company ?? {}

export const offerEndpoints: Endpoint[] = [
  {
    path: '/:id/pdf',
    method: 'get',
    handler: async (req) => {
      if (!req.user) return forbidden()
      let offer: OfferDoc
      let pdf: Buffer
      try {
        ;({ offer, pdf } = await pdfFor(req, idOf(req)))
      } catch (e) {
        // Пълната грешка — в лога; на админа — ясен текст (не „Something went wrong.").
        req.payload.logger.error({ err: e, msg: `PDF на оферта № ${idOf(req)} не се генерира` })
        return json({ error: `PDF-ът не се генерира: ${(e as Error).message}` }, 500)
      }
      const number = offer.number ?? String(offer.id)
      const download = new URL(req.url ?? 'http://x').searchParams.get('download') === '1'
      return new Response(new Uint8Array(pdf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${asciiName(number)}"; filename*=UTF-8''${encodeURIComponent(`Оферта-${number}.pdf`)}`,
          'Cache-Control': 'no-store',
        },
      })
    },
  },
  {
    path: '/:id/send-preview',
    method: 'get',
    handler: async (req) => {
      if (!req.user) return forbidden()
      const offer = (await req.payload.findByID({ collection: 'offers', id: idOf(req), depth: 0, req })) as unknown as OfferDoc
      const company = await companyOf(req)
      const { defaultOfferText } = await import('./mail')
      return json({
        to: offer.client?.email ?? '',
        cc: company.email ?? '',
        subject: `Оферта № ${offer.number ?? ''} — EcoFlow България`,
        text: defaultOfferText({
          contactName: contactName(offer),
          number: offer.number,
          requestNumber: offer.requestNumber,
          validUntil: offer.validUntil,
          preparedBy: offer.preparedBy?.name,
          companyName: company.name,
        }),
        sentAt: offer.sentAt ?? null,
      })
    },
  },
  {
    path: '/:id/send',
    method: 'post',
    handler: async (req) => {
      if (!req.user) return forbidden()
      const body = ((await req.json?.().catch(() => ({}))) ?? {}) as { to?: string; subject?: string; text?: string; force?: boolean }
      const to = (body.to ?? '').trim()
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(to)) return json({ error: 'Невалиден имейл на получателя.' }, 422)
      if (!body.subject?.trim() || !body.text?.trim()) return json({ error: 'Темата и текстът са задължителни.' }, 422)

      const id = idOf(req)
      const current = (await req.payload.findByID({ collection: 'offers', id, depth: 0, req })) as unknown as OfferDoc
      if (current.sentAt && !body.force) {
        const { bgDate } = await import('./calc')
        return json({ needConfirm: true, message: `Офертата вече е изпратена на ${bgDate(current.sentAt)}. Изпрати отново?` }, 409)
      }

      const { offer, pdf } = await pdfFor(req, id)
      const company = await companyOf(req)
      const { loadMailContacts } = await import('../quote/mail')
      const { offerMail } = await import('./mail')
      const mail = offerMail(
        { number: offer.number ?? '', date: offer.date, validUntil: offer.validUntil, total: Number(offer.totals?.total ?? 0), text: body.text },
        await loadMailContacts(req.payload),
      )
      const cc = company.email || undefined
      try {
        await req.payload.sendEmail({
          to,
          ...(cc && cc.toLowerCase() !== to.toLowerCase() ? { cc } : {}),
          ...(company.email ? { replyTo: company.email } : {}),
          subject: body.subject.trim(),
          html: mail.html,
          text: mail.text,
          attachments: [{ filename: asciiName(offer.number ?? String(id)).replace(/^Oferta/, 'Oferta'), content: pdf, contentType: 'application/pdf' }],
        })
      } catch (e) {
        return json({ error: `Имейлът не тръгна: ${(e as Error).message}` }, 502)
      }

      const now = new Date().toISOString()
      const ред = `${now} — до ${to}${cc ? ` (копие ${cc})` : ''}, от ${(req.user as { email?: string }).email ?? 'админ'}`
      await req.payload.update({
        collection: 'offers',
        id,
        depth: 0,
        req,
        data: { status: 'sent', sentAt: now, sentTo: to, sendLog: [current.sendLog, ред].filter(Boolean).join('\n') } as never,
      })

      // Заявката → „Изпратена оферта" (освен ако вече е спечелена или отказана).
      const reqId = typeof offer.quoteRequest === 'object' ? offer.quoteRequest?.id : offer.quoteRequest
      let requestUpdated: string | null = null
      if (reqId) {
        const qr = await req.payload.findByID({ collection: 'quote-requests', id: reqId, depth: 0, req, select: { status: true } })
        if (qr && !['won', 'lost'].includes(String(qr.status))) {
          await req.payload.update({ collection: 'quote-requests', id: reqId, depth: 0, req, data: { status: 'offer-sent' } as never })
          requestUpdated = now
        }
      }
      return json({ ok: true, sentAt: now, to, requestId: reqId ?? null, requestUpdated })
    },
  },
  {
    path: '/from-request/:id',
    method: 'post',
    handler: async (req) => {
      if (!req.user) return forbidden()
      const qr = (await req.payload.findByID({ collection: 'quote-requests', id: idOf(req), depth: 0, req })) as unknown as {
        id: number
        organization?: string
        eik?: string
        city?: string
        contactName?: string
        position?: string
        email?: string
        phone?: string
        items?: { product?: number | null; title?: string; sku?: string; ean?: string; image?: number | null; quantity?: number }[]
      }
      const settings = (await req.payload.findGlobal({ slug: 'offer-settings', depth: 0, req })) as {
        defaults?: Record<string, unknown>
      }
      const d = settings.defaults ?? {}
      const vatRate = Number(d.vatRate ?? 20)
      const ids = (qr.items ?? []).map((i) => i.product).filter((x): x is number => typeof x === 'number')
      const prices = ids.length
        ? await req.payload.find({ collection: 'products', where: { id: { in: ids } }, depth: 0, pagination: false, select: { price: true }, req })
        : { docs: [] }
      const priceOf = new Map(prices.docs.map((p) => [p.id, (p as { price?: number }).price]))

      const offer = await req.payload.create({
        collection: 'offers',
        depth: 0,
        req,
        data: {
          status: 'draft',
          quoteRequest: qr.id,
          client: {
            organization: qr.organization ?? '',
            eik: qr.eik ?? '',
            address: qr.city ?? '',
            contactPerson: [qr.contactName, qr.position].filter(Boolean).join(', '),
            email: qr.email ?? '',
            phone: qr.phone ?? '',
          },
          // Продуктите и бройките — със снимката на заявката (име, SKU, EAN, снимка).
          items: (qr.items ?? []).map((i) => ({
            product: i.product ?? null,
            title: i.title ?? '',
            sku: i.sku ?? null,
            ean: i.ean ?? null,
            image: i.image ?? null,
            quantity: i.quantity ?? 1,
            unitPrice: i.product ? (priceOf.get(i.product) ?? null) : null,
          })),
          terms: {
            payment: d.payment ?? 'advance100',
            paymentOther: d.paymentOther ?? null,
            deliveryTime: d.deliveryTime ?? null,
            deliveryTerms: d.deliveryTerms ?? null,
            warranty: d.warranty ?? null,
            validityDays: d.validityDays ?? 14,
            vatRate,
            note: d.note ?? null,
          },
        } as never,
      })
      return json({ id: offer.id, number: (offer as { number?: string }).number })
    },
  },
]
