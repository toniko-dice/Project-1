import type { CollectionBeforeChangeHook, CollectionConfig, Field, PayloadRequest } from 'payload'

import { lineTotal, offerTotals, OFFER_STATUSES, PAYMENT_OPTIONS } from '../lib/offers/calc'
import { offerEndpoints } from '../lib/offers/endpoints'
import { hiddenFor, salesAccess } from '../lib/access'

type Settings = {
  defaults?: {
    validityDays?: number | null
    vatRate?: number | null
    payment?: string | null
    paymentOther?: string | null
    deliveryTime?: string | null
    deliveryTerms?: string | null
    warranty?: string | null
    note?: string | null
  } | null
}

/** „Данни за офертите" — веднъж на заявка (`req.context`). */
export const offerSettings = async (req: PayloadRequest): Promise<Settings> => {
  const ctx = req.context as { offerSettings?: Settings }
  if (!ctx.offerSettings) {
    ctx.offerSettings = (await req.payload.findGlobal({ slug: 'offer-settings', depth: 0, req })) as Settings
  }
  return ctx.offerSettings
}

/** Стойност по подразбиране от „Данни за офертите" — новата оферта тръгва с копие. */
const fromSettings =
  (key: keyof NonNullable<Settings['defaults']>, fallback: unknown = undefined) =>
  async ({ req }: { req: PayloadRequest }) =>
    (await offerSettings(req)).defaults?.[key] ?? fallback

const ro = <T extends Field>(f: T): T => ({ ...f, admin: { ...(f.admin ?? {}), readOnly: true } }) as T

const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86_400_000)

type Item = {
  product?: number | { id: number; title?: string; sku?: string; ean?: string; price?: number; image?: unknown } | null
  title?: string | null
  sku?: string | null
  ean?: string | null
  image?: number | { id: number } | null
  quantity?: number | null
  unitPrice?: number | null
  discount?: number | null
  lineTotal?: number | null
}

/**
 * При всеки запис:
 * - номер `ОФ-ГГГГ-NNNN` (само при създаване), дата, „Валидна до";
 * - ред с продукт, но без име/SKU/EAN/снимка/цена → попълва се от продукта
 *   (цената — с ДДС, както е на сайта). Попълненото не се пипа:
 *   това е мястото на отстъпката;
 * - сумите на редовете и общите — `src/lib/offers/calc.ts`;
 * - „Изготвил" — потребителят, ако е празно;
 * - номерът на заявката — за текста на имейла.
 */
const prepare: CollectionBeforeChangeHook = async ({ data, req, operation, originalDoc }) => {
  const settings = await offerSettings(req)
  const vatRate = Number(data.terms?.vatRate ?? settings.defaults?.vatRate ?? 20)

  if (operation === 'create' && !data.number) {
    const year = new Date().getFullYear()
    const last = await req.payload.find({
      collection: 'offers',
      where: { number: { like: `ОФ-${year}-` } },
      sort: '-number',
      limit: 1,
      depth: 0,
      select: { number: true },
      req,
    })
    const n = Number(String(last.docs[0]?.number ?? '').split('-')[2] ?? 0) + 1
    data.number = `ОФ-${year}-${String(n).padStart(4, '0')}`
  }

  const date = data.date ? new Date(data.date) : new Date()
  data.date = date.toISOString()
  if (!data.validUntil) {
    const days = Number(data.terms?.validityDays ?? settings.defaults?.validityDays ?? 14)
    data.validUntil = addDays(date, days).toISOString()
  }

  if (Array.isArray(data.items)) {
    const ids = (data.items as Item[])
      .map((i) => (typeof i.product === 'object' ? i.product?.id : i.product))
      .filter((x): x is number => typeof x === 'number')
    const found = ids.length
      ? await req.payload.find({
          collection: 'products',
          where: { id: { in: ids } },
          depth: 0,
          pagination: false,
          select: { title: true, sku: true, ean: true, price: true, image: true },
          req,
        })
      : { docs: [] }
    const byId = new Map(found.docs.map((p) => [p.id, p]))
    data.items = (data.items as Item[]).map((i) => {
      const id = typeof i.product === 'object' ? i.product?.id : i.product
      const p = id ? byId.get(id) : undefined
      const filled = {
        ...i,
        title: i.title?.trim() || p?.title || i.title,
        sku: i.sku ?? p?.sku ?? null,
        ean: i.ean ?? p?.ean ?? null,
        image: i.image ?? (p?.image as number | null | undefined) ?? null,
        quantity: Math.max(1, Math.round(Number(i.quantity) || 1)),
        unitPrice: typeof i.unitPrice === 'number' ? i.unitPrice : (p?.price ?? null),
      }
      return { ...filled, lineTotal: lineTotal(filled) }
    })
  }
  // В базата `totals.subtotal` е данъчната основа (колоната е от времето на цените без ДДС).
  const t = offerTotals((data.items as Item[]) ?? [], vatRate)
  data.totals = { subtotal: t.base, vat: t.vat, total: t.total }

  if (!data.preparedBy?.name && req.user) {
    const u = req.user as { name?: string | null; position?: string | null; email?: string }
    data.preparedBy = { name: u.name || u.email, position: data.preparedBy?.position || u.position || '' }
  }

  const reqId = typeof data.quoteRequest === 'object' ? data.quoteRequest?.id : data.quoteRequest
  const prevReq = typeof originalDoc?.quoteRequest === 'object' ? originalDoc?.quoteRequest?.id : originalDoc?.quoteRequest
  if (reqId && (reqId !== prevReq || !data.requestNumber)) {
    const qr = await req.payload.findByID({ collection: 'quote-requests', id: reqId, depth: 0, req, select: { number: true } })
    data.requestNumber = qr?.number ?? ''
  }
  if (!reqId) data.requestNumber = ''
  return data
}

/**
 * „Оферти" — офертите към клиенти, с PDF и изпращане по имейл.
 *
 * Създава се от заявка (бутонът „Създай оферта" в „Нови заявки" →
 * `POST /api/offers/from-request/:id`) или празна от „Нова". Една заявка
 * може да има няколко оферти. PDF — `GET /api/offers/:id/pdf`,
 * изпращане — `POST /api/offers/:id/send` (`src/lib/offers/endpoints.ts`).
 * Само за влязъл админ.
 */
export const Offers: CollectionConfig = {
  slug: 'offers',
  labels: { singular: 'Оферта', plural: 'Оферти' },
  admin: {
    hidden: hiddenFor('admin', 'sales'),
    group: 'Продажби',
    useAsTitle: 'number',
    defaultColumns: ['number', 'date', 'client.organization', 'totals.total', 'status', 'requestNumber'],
    listSearchableFields: ['number', 'client.organization', 'client.email', 'requestNumber'],
  },
  defaultSort: '-createdAt',
  versions: { maxPerDoc: 50 },
  access: { ...salesAccess },
  hooks: { beforeChange: [prepare] },
  endpoints: offerEndpoints,
  fields: [
    ro({ name: 'number', type: 'text', label: '№', unique: true, index: true, admin: { description: 'ОФ-ГГГГ-NNNN — дава се при първия запис.' } } as Field),
    {
      name: 'actions',
      type: 'ui',
      admin: { position: 'sidebar', components: { Field: '@/components/admin/OfferActions#OfferActions' } },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Статус',
      defaultValue: 'draft',
      required: true,
      options: OFFER_STATUSES.map(({ value, label }) => ({ value, label })),
      admin: { position: 'sidebar', components: { Cell: '@/components/admin/OfferStatusCell#OfferStatusCell' } },
    },
    {
      name: 'quoteRequest',
      type: 'relationship',
      relationTo: 'quote-requests',
      label: 'По заявка',
      admin: { position: 'sidebar' },
    },
    ro({ name: 'requestNumber', type: 'text', label: '№ на заявката', admin: { position: 'sidebar' } } as Field),
    {
      type: 'row',
      fields: [
        { name: 'date', type: 'date', label: 'Дата', admin: { width: '50%', date: { displayFormat: 'dd.MM.yyyy' } } },
        {
          name: 'validUntil',
          type: 'date',
          label: 'Валидна до',
          admin: { width: '50%', date: { displayFormat: 'dd.MM.yyyy' }, description: 'Празно — датата + валидността.' },
        },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Клиент',
          fields: [
            {
              name: 'client',
              type: 'group',
              label: false,
              fields: [
                { name: 'organization', type: 'text', label: 'Организация' },
                {
                  type: 'row',
                  fields: [
                    { name: 'eik', type: 'text', label: 'ЕИК / БУЛСТАТ', admin: { width: '50%' } },
                    { name: 'vatNumber', type: 'text', label: 'ДДС №', admin: { width: '50%' } },
                  ],
                },
                { name: 'address', type: 'text', label: 'Адрес' },
                { name: 'contactPerson', type: 'text', label: 'МОЛ / лице за контакт' },
                {
                  type: 'row',
                  fields: [
                    { name: 'email', type: 'email', label: 'Имейл', admin: { width: '50%' } },
                    { name: 'phone', type: 'text', label: 'Телефон', admin: { width: '50%' } },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Продукти',
          fields: [
            {
              name: 'draftGuard',
              type: 'ui',
              admin: { components: { Field: '@/components/admin/OfferDraftGuard#OfferDraftGuard' } },
            },
            {
              // Само стойност по подразбиране за редовете — прилага се В ФОРМАТА
              // (`OfferGeneralDiscount`), сървърът не я разнася. Не излиза в PDF-а.
              name: 'generalDiscount',
              type: 'number',
              label: 'Обща отстъпка %',
              min: 0,
              max: 100,
              admin: { components: { Field: '@/components/admin/OfferGeneralDiscount#OfferGeneralDiscount' } },
            },
            {
              name: 'items',
              type: 'array',
              label: 'Редове',
              labels: { singular: 'Ред', plural: 'Редове' },
              admin: {
                description:
                  'Продукт от сайта или свободен ред (само име). При избор на продукт име, SKU, EAN, снимка и цена се попълват веднага — после се редактират.',
                components: {
                  RowLabel: {
                    path: '@/components/admin/RowLabel#RowLabel',
                    clientProps: { field: 'title', fallback: 'Ред' },
                  },
                },
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'product', type: 'relationship', relationTo: 'products', label: 'Продукт', admin: { width: '50%' } },
                    { name: 'title', type: 'text', label: 'Име', admin: { width: '50%' } },
                  ],
                },
                {
                  name: 'productSync',
                  type: 'ui',
                  admin: { components: { Field: '@/components/admin/OfferItemProductSync#OfferItemProductSync' } },
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'sku', type: 'text', label: 'SKU', admin: { width: '33%' } },
                    { name: 'ean', type: 'text', label: 'EAN', admin: { width: '33%' } },
                    { name: 'image', type: 'upload', relationTo: 'media', label: 'Снимка', admin: { width: '34%' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'quantity', type: 'number', label: 'Количество', defaultValue: 1, min: 1, admin: { width: '25%', step: 1 } },
                    {
                      name: 'unitPrice',
                      type: 'number',
                      label: 'Ед. цена с ДДС (€)',
                      min: 0,
                      admin: { width: '25%', step: 0.01, description: 'Празно — цената от сайта (с ДДС).' },
                    },
                    { name: 'discount', type: 'number', label: 'Отстъпка %', min: 0, max: 100, admin: { width: '25%', step: 0.5 } },
                    ro({ name: 'lineTotal', type: 'number', label: 'Сума с ДДС (€)', admin: { width: '25%' } } as Field),
                  ],
                },
              ],
            },
            {
              name: 'totalsView',
              type: 'ui',
              admin: { components: { Field: '@/components/admin/OfferTotals#OfferTotals' } },
            },
          ],
        },
        {
          label: 'Условия',
          fields: [
            {
              name: 'terms',
              type: 'group',
              label: false,
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'payment', type: 'select', label: 'Плащане', options: PAYMENT_OPTIONS, defaultValue: fromSettings('payment', 'advance100'), admin: { width: '50%' } },
                    { name: 'paymentOther', type: 'text', label: 'Плащане — друго', defaultValue: fromSettings('paymentOther'), admin: { width: '50%', condition: (_, s) => s?.payment === 'other' } },
                  ],
                },
                { name: 'deliveryTime', type: 'text', label: 'Срок на доставка', defaultValue: fromSettings('deliveryTime') },
                { name: 'deliveryTerms', type: 'textarea', label: 'Условия на доставка', defaultValue: fromSettings('deliveryTerms') },
                { name: 'warranty', type: 'text', label: 'Гаранция', defaultValue: fromSettings('warranty') },
                {
                  type: 'row',
                  fields: [
                    { name: 'validityDays', type: 'number', label: 'Валидност (дни)', min: 1, defaultValue: fromSettings('validityDays', 14), admin: { width: '50%' } },
                    { name: 'vatRate', type: 'number', label: 'ДДС (%)', min: 0, defaultValue: fromSettings('vatRate', 20), admin: { width: '50%' } },
                  ],
                },
                { name: 'note', type: 'textarea', label: 'Бележка в края', defaultValue: fromSettings('note') },
              ],
            },
            {
              name: 'preparedBy',
              type: 'group',
              label: 'Изготвил',
              admin: { description: 'Празно — потребителят, който записва офертата (име и длъжност от „Потребители").' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'name', type: 'text', label: 'Име', admin: { width: '50%' } },
                    { name: 'position', type: 'text', label: 'Длъжност', admin: { width: '50%' } },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Изпращане',
          fields: [
            ro({ name: 'sentAt', type: 'date', label: 'Изпратена на', admin: { date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' } } } as Field),
            ro({ name: 'sentTo', type: 'text', label: 'Изпратена до' } as Field),
            ro({ name: 'sendLog', type: 'textarea', label: 'Дневник на изпращанията' } as Field),
          ],
        },
      ],
    },
    // Записаните суми — за колоната в списъка; на живо се смятат в „Продукти" (`OfferTotals`).
    ro({
      name: 'totals',
      type: 'group',
      label: 'Общо (при последния запис)',
      admin: { position: 'sidebar' },
      fields: [
        { name: 'total', type: 'number', label: 'Общо с ДДС (€)' },
        { name: 'subtotal', type: 'number', label: 'Данъчна основа (без ДДС) (€)' },
        { name: 'vat', type: 'number', label: 'в т.ч. ДДС (€)' },
      ],
    } as Field),
    {
      name: 'internalNotes',
      type: 'textarea',
      label: 'Вътрешни бележки',
      admin: { position: 'sidebar', description: 'Не излизат в PDF-а и в имейла.' },
    },
  ],
}
