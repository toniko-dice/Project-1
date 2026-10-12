import type { CollectionConfig, PayloadRequest, Where } from 'payload'

import { hiddenFor, isAdmin, isSales, reqHasRole } from '../lib/access'
import { новПакет, запишиЦени } from '../lib/dice/prices'
import { productCardData } from '../lib/media'

/**
 * „Цени за одобрение" (`task-dice-odobrenie-ceni.md`, т. 3) — в тестов режим
 * новите цени от dice.bg чакат тук, вместо да отидат направо в продукта.
 * Пише ги синхронизацията (`src/lib/dice/sync.ts`); решават Администратор
 * и Продажби — от собствения изглед на списъка (`PriceApprovalsList`):
 *
 *   GET  /api/price-approvals/rows?status=&from=&to=&warn=  — редовете за таблицата
 *   POST /api/price-approvals/approve { ids }               — цените отиват в продуктите
 *   POST /api/price-approvals/reject  { ids, note }         — продуктът остава с текущата
 *
 * Едно „Одобри избраните" = един номер на пакета в „История на цените".
 * Отказана стойност не излиза отново; друга цена от dice — нов запис.
 * Решените се пазят 180 дни (чисти ги синхронизацията), чакащите — докато
 * се решат.
 */

export const СТАТУС = { pending: 'Чака', approved: 'Одобрена', rejected: 'Отказана' } as const

const влязъл = (req: PayloadRequest) => (req.user as { email?: string } | null)?.email ?? ''
const тяло = async (req: PayloadRequest) => ((await req.json?.().catch(() => ({}))) ?? {}) as { ids?: unknown; note?: unknown }
const номера = (x: unknown) => (Array.isArray(x) ? x.map(Number).filter((n) => Number.isInteger(n) && n > 0) : [])

type Ред = {
  id: number
  product: { id: number } & Record<string, unknown> | number | null
  sku?: string | null
  currentPrice?: number | null
  newPrice?: number | null
  currentCompare?: number | null
  newCompare?: number | null
  changePct?: number | null
  changeAbs?: number | null
  level?: string | null
  warn?: boolean | null
  xmlDate?: string | null
  status?: string | null
  decidedBy?: string | null
  decidedAt?: string | null
  note?: string | null
  batch?: string | null
  productTitle?: string | null
}

export const PriceApprovals: CollectionConfig = {
  slug: 'price-approvals',
  labels: { singular: 'Цена за одобрение', plural: 'Цени за одобрение' },
  admin: {
    group: 'Продажби',
    hidden: hiddenFor('admin', 'sales'),
    useAsTitle: 'productTitle',
    defaultColumns: ['productTitle', 'currentPrice', 'newPrice', 'status', 'xmlDate'],
    components: { views: { list: { Component: '@/components/admin/PriceApprovalsList#PriceApprovalsList' } } },
  },
  defaultSort: '-changeAbsPct',
  access: { read: isSales, create: () => false, update: () => false, delete: isAdmin },
  endpoints: [
    {
      path: '/rows',
      method: 'get',
      handler: async (req) => {
        if (!reqHasRole(req, 'admin', 'sales')) return Response.json({ error: 'Само за администратор и продажби.' }, { status: 403 })
        const q = (req.query ?? {}) as Record<string, string | undefined>
        const and: Where[] = []
        if (q.status && q.status !== 'all') and.push({ status: { equals: q.status } })
        if (q.from) and.push({ xmlDate: { greater_than_equal: new Date(`${q.from}T00:00:00`).toISOString() } })
        if (q.to) and.push({ xmlDate: { less_than_equal: new Date(`${q.to}T23:59:59`).toISOString() } })
        if (q.warn === '1') and.push({ warn: { equals: true } })
        const r = await req.payload.find({
          collection: 'price-approvals',
          where: and.length ? { and } : {},
          sort: '-changeAbsPct',
          limit: 1000,
          depth: 2,
          overrideAccess: true,
          req,
        })
        const admin = req.payload.config.routes.admin
        const rows = (r.docs as unknown as Ред[]).map((d) => {
          const p = d.product && typeof d.product === 'object' ? d.product : null
          const card = p ? productCardData(p as never, undefined, 'thumbnail') : null
          return {
            id: d.id,
            productId: p?.id ?? (typeof d.product === 'number' ? d.product : null),
            title: card?.title ?? d.productTitle ?? '(изтрит продукт)',
            image: card?.imageUrl ?? null,
            siteUrl: card?.url ?? null,
            adminUrl: p ? `${admin}/collections/products/${p.id}` : null,
            sku: d.sku ?? '',
            currentPrice: d.currentPrice ?? null,
            newPrice: d.newPrice ?? null,
            currentCompare: d.currentCompare ?? null,
            newCompare: d.newCompare ?? null,
            changePct: d.changePct ?? null,
            changeAbs: d.changeAbs ?? null,
            level: d.level ?? 'ok',
            warn: Boolean(d.warn),
            xmlDate: d.xmlDate ?? null,
            status: d.status ?? 'pending',
            decidedBy: d.decidedBy ?? '',
            decidedAt: d.decidedAt ?? null,
            note: d.note ?? '',
            batch: d.batch ?? '',
          }
        })
        return Response.json({ rows, total: r.totalDocs })
      },
    },
    {
      path: '/approve',
      method: 'post',
      handler: async (req) => {
        if (!reqHasRole(req, 'admin', 'sales')) return Response.json({ error: 'Само за администратор и продажби.' }, { status: 403 })
        const ids = номера((await тяло(req)).ids)
        if (!ids.length) return Response.json({ error: 'Не е избрана нито една цена.' }, { status: 400 })
        const чакащи = (
          await req.payload.find({
            collection: 'price-approvals',
            where: { and: [{ id: { in: ids } }, { status: { equals: 'pending' } }] },
            pagination: false,
            depth: 0,
            overrideAccess: true,
            req,
          })
        ).docs as unknown as Ред[]
        const сПродукт = чакащи.filter((d) => typeof d.product === 'number' && typeof d.newPrice === 'number' && d.newPrice > 0)
        const batch = новПакет('О')
        const user = влязъл(req)
        const резултати = await запишиЦени(
          req.payload,
          сПродукт.map((d) => ({ id: d.product as number, price: d.newPrice!, compareAtPrice: d.newCompare ?? null, approval: d.id })),
          { source: 'approval', batch, user },
          req,
        )
        const now = new Date().toISOString()
        let одобрени = 0
        const грешки: string[] = []
        for (const d of сПродукт) {
          const r = резултати.find((x) => x.id === d.product)
          if (!r?.ok) {
            грешки.push(`${d.productTitle}: ${r?.error ?? 'не е записан'}`)
            continue
          }
          await req.payload.update({
            collection: 'price-approvals',
            id: d.id,
            data: { status: 'approved', decidedBy: user, decidedAt: now, batch },
            overrideAccess: true,
            depth: 0,
            req,
          })
          одобрени++
          if (r.draft) грешки.push(`${d.productTitle}: има непубликувани промени — цената е записана в черновата и излиза при „Публикувай"`)
        }
        return Response.json({ approved: одобрени, batch, errors: грешки, skipped: ids.length - сПродукт.length })
      },
    },
    {
      path: '/reject',
      method: 'post',
      handler: async (req) => {
        if (!reqHasRole(req, 'admin', 'sales')) return Response.json({ error: 'Само за администратор и продажби.' }, { status: 403 })
        const b = await тяло(req)
        const ids = номера(b.ids)
        if (!ids.length) return Response.json({ error: 'Не е избрана нито една цена.' }, { status: 400 })
        const r = await req.payload.update({
          collection: 'price-approvals',
          where: { and: [{ id: { in: ids } }, { status: { equals: 'pending' } }] },
          data: {
            status: 'rejected',
            decidedBy: влязъл(req),
            decidedAt: new Date().toISOString(),
            note: typeof b.note === 'string' ? b.note.slice(0, 1000) : '',
          },
          overrideAccess: true,
          depth: 0,
          req,
        })
        return Response.json({ rejected: r.docs.length })
      },
    },
  ],
  fields: [
    { name: 'productTitle', type: 'text', label: 'Продукт', admin: { readOnly: true } },
    {
      type: 'row',
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products', label: 'Продукт', index: true, admin: { readOnly: true, width: '70%' } },
        { name: 'sku', type: 'text', label: 'SKU', admin: { readOnly: true, width: '30%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'currentPrice', type: 'number', label: 'Сега на сайта', admin: { readOnly: true, width: '25%' } },
        { name: 'newPrice', type: 'number', label: 'Нова от dice', admin: { readOnly: true, width: '25%' } },
        { name: 'currentCompare', type: 'number', label: 'Зачертана сега', admin: { readOnly: true, width: '25%' } },
        { name: 'newCompare', type: 'number', label: 'Зачертана нова', admin: { readOnly: true, width: '25%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'changePct', type: 'number', label: 'Промяна, %', admin: { readOnly: true, width: '25%' } },
        { name: 'changeAbs', type: 'number', label: 'Промяна, €', admin: { readOnly: true, width: '25%' } },
        {
          name: 'level',
          type: 'select',
          label: 'Ниво',
          options: [
            { label: 'Обикновена', value: 'ok' },
            { label: 'Над 10 %', value: 'orange' },
            { label: '⚠ Провери', value: 'red' },
          ],
          admin: { readOnly: true, width: '25%' },
        },
        { name: 'xmlDate', type: 'date', label: 'Дата от XML', admin: { readOnly: true, width: '25%', date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
    // За подредбата „по най-голяма промяна" и за филтъра „само ⚠".
    { name: 'changeAbsPct', type: 'number', index: true, admin: { hidden: true } },
    { name: 'warn', type: 'checkbox', admin: { hidden: true } },
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          type: 'select',
          label: 'Статус',
          index: true,
          defaultValue: 'pending',
          options: Object.entries(СТАТУС).map(([value, label]) => ({ value, label })),
          admin: { readOnly: true, width: '25%' },
        },
        { name: 'decidedBy', type: 'text', label: 'Решил', admin: { readOnly: true, width: '25%' } },
        { name: 'decidedAt', type: 'date', label: 'Кога', admin: { readOnly: true, width: '25%', date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'batch', type: 'text', label: 'Номер на одобрението', admin: { readOnly: true, width: '25%' } },
      ],
    },
    { name: 'note', type: 'textarea', label: 'Бележка', admin: { readOnly: true } },
  ],
}
