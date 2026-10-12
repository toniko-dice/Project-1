import type { CollectionConfig } from 'payload'

import { hiddenFor, isAdmin, isSales, reqHasRole } from '../lib/access'
import { ИЗТОЧНИК, прегледВръщане, върни } from '../lib/dice/prices'

/**
 * „История на цените" (`task-dice-odobrenie-ceni.md`, т. 4) — всяка смяна
 * на цената или зачертаната цена на продукт. Пише я куката
 * `recordPriceHistory` на продуктите; тук нищо не се създава и не се
 * редактира. Четат Администратор и Продажби.
 *
 *   GET  /api/price-history/revert-preview?id=… | ?batch=…  — какво ще се върне
 *   POST /api/price-history/revert  { id } | { batch }       — връщането
 *
 * Връщането също е смяна и също влиза тук (източник „Връщане") — значи и
 * то може да се върне. Офертите не се пипат: те пазят своите цени.
 */
const цел = (q: { id?: unknown; batch?: unknown }) =>
  q.batch ? { batch: String(q.batch) } : q.id ? { id: Number(q.id) } : null

export const PriceHistory: CollectionConfig = {
  slug: 'price-history',
  labels: { singular: 'Промяна на цена', plural: 'История на цените' },
  admin: {
    group: 'Продажби',
    hidden: hiddenFor('admin', 'sales'),
    useAsTitle: 'title',
    defaultColumns: ['title', 'source', 'user', 'batch', 'createdAt'],
    listSearchableFields: ['title', 'sku', 'batch'],
    description: 'Всяка смяна на цена или зачертана цена — откъдето и да идва. В записа: „Върни предишната цена" и „Върни целия пакет".',
  },
  defaultSort: '-createdAt',
  access: { read: isSales, create: () => false, update: () => false, delete: isAdmin },
  endpoints: [
    {
      path: '/revert-preview',
      method: 'get',
      handler: async (req) => {
        if (!reqHasRole(req, 'admin', 'sales')) return Response.json({ error: 'Само за администратор и продажби.' }, { status: 403 })
        const t = цел((req.query ?? {}) as { id?: unknown; batch?: unknown })
        if (!t) return Response.json({ error: 'Липсва запис или пакет.' }, { status: 400 })
        return Response.json({ items: await прегледВръщане(req.payload, t, req) })
      },
    },
    {
      path: '/revert',
      method: 'post',
      handler: async (req) => {
        if (!reqHasRole(req, 'admin', 'sales')) return Response.json({ error: 'Само за администратор и продажби.' }, { status: 403 })
        const body = (await req.json?.().catch(() => ({}))) as { id?: unknown; batch?: unknown }
        const t = цел(body ?? {})
        if (!t) return Response.json({ error: 'Липсва запис или пакет.' }, { status: 400 })
        const user = (req.user as { email?: string } | null)?.email ?? ''
        const r = await върни(req.payload, t, user, req)
        const грешки = r.results.filter((x) => !x.ok)
        return Response.json({
          batch: r.batch,
          reverted: r.results.filter((x) => x.ok).length,
          drafts: r.results.filter((x) => x.ok && x.draft).length,
          errors: грешки.map((x) => `№ ${x.id}: ${x.error}`),
        })
      },
    },
  ],
  fields: [
    {
      name: 'actions',
      type: 'ui',
      admin: { components: { Field: '@/components/admin/PriceRevert#PriceHistoryRevert' } },
    },
    { name: 'title', type: 'text', label: 'Промяна', admin: { readOnly: true } },
    {
      type: 'row',
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products', label: 'Продукт', admin: { readOnly: true, width: '50%' } },
        { name: 'productTitle', type: 'text', label: 'Име към момента', admin: { readOnly: true, width: '30%' } },
        { name: 'sku', type: 'text', label: 'SKU', admin: { readOnly: true, width: '20%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'priceOld', type: 'number', label: 'Цена — стара', admin: { readOnly: true, width: '25%' } },
        { name: 'priceNew', type: 'number', label: 'Цена — нова', admin: { readOnly: true, width: '25%' } },
        { name: 'compareOld', type: 'number', label: 'Зачертана — стара', admin: { readOnly: true, width: '25%' } },
        { name: 'compareNew', type: 'number', label: 'Зачертана — нова', admin: { readOnly: true, width: '25%' } },
      ],
    },
    { name: 'changedPrice', type: 'checkbox', admin: { hidden: true } },
    { name: 'changedCompare', type: 'checkbox', admin: { hidden: true } },
    {
      type: 'row',
      fields: [
        {
          name: 'source',
          type: 'select',
          label: 'Източник',
          options: Object.entries(ИЗТОЧНИК).map(([value, label]) => ({ value, label })),
          admin: { readOnly: true, width: '25%' },
        },
        { name: 'user', type: 'text', label: 'Кой', admin: { readOnly: true, width: '25%' } },
        {
          name: 'batch',
          type: 'text',
          label: 'Номер на пакета',
          index: true,
          admin: { readOnly: true, width: '25%', description: 'Общ за едно „Одобри избраните", едно пускане на синхронизацията или едно връщане.' },
        },
        { name: 'approval', type: 'relationship', relationTo: 'price-approvals', label: 'Одобрение', admin: { readOnly: true, width: '25%' } },
      ],
    },
  ],
}
