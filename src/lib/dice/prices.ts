import type { Payload, PayloadRequest, Where } from 'payload'

import { formatEur } from '../format'

/**
 * Цените на продуктите — запис, история и връщане
 * (`task-dice-odobrenie-ceni.md`). Сървърен модул.
 *
 * Всяка смяна на `price` / `compareAtPrice` се записва в „История на
 * цените" от куката на продукта (`recordPriceHistory`) — откъдето и да
 * идва. Кой и защо идва от `req.context` (`ЦЕНОВИ_КОНТЕКСТ`); без него —
 * „ръчно в админа" (с влязъл потребител) или „внос / скрипт".
 */

export type PriceSource = 'approval' | 'sync' | 'admin' | 'import' | 'revert'

export const ИЗТОЧНИК: Record<PriceSource, string> = {
  approval: 'Одобрение',
  sync: 'Синхронизация',
  admin: 'Ръчно в админа',
  import: 'Внос / скрипт',
  revert: 'Връщане',
}

export type PriceContext = { source: PriceSource; batch?: string; user?: string; approval?: number }

/** Ключът в `req.context`, с който записът казва откъде идва цената. */
export const ЦЕНОВИ_КОНТЕКСТ = 'priceChange'

/**
 * Номер на пакет: „О-20261012-130512-k3" — О = одобрение, С = синхронизация,
 * В = връщане. Всички цени от едно натискане / едно пускане са с един номер.
 */
export const новПакет = (prefix: 'О' | 'С' | 'В') => {
  const t = new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Sofia' }).replace(/\D/g, '')
  return `${prefix}-${t.slice(0, 8)}-${t.slice(8, 14)}-${Math.random().toString(36).slice(2, 4)}`
}

export type Level = 'ok' | 'orange' | 'red'

/**
 * Колко е голяма промяната — за оцветяването в „Цени за одобрение":
 * над 10 % → оранжево; над 30 % или новата цена е под половината от новата
 * зачертана → червено (⚠ провери).
 */
export const оценка = (current: number | null | undefined, next: number, nextCompare: number | null) => {
  const cur = typeof current === 'number' && current > 0 ? current : null
  const pct = cur ? ((next - cur) / cur) * 100 : null
  const absPct = pct === null ? 100 : Math.abs(pct)
  const подЗачертаната = nextCompare !== null && nextCompare > 0 && next < nextCompare * 0.5
  const level: Level = absPct > 30 || подЗачертаната ? 'red' : absPct > 10 ? 'orange' : 'ok'
  return { pct, abs: cur ? next - cur : null, absPct, level, warn: level === 'red' }
}

export const пари = (n: number | null | undefined) => (typeof n === 'number' ? formatEur(n) : '—')

type ProductPrice = { id: number; price?: number | null; compareAtPrice?: number | null; _status?: string | null }

/**
 * Публикуваният продукт с непубликувани промени отгоре — записът отива в
 * черновата (иначе би публикувал и чуждите промени). Чернова остава
 * чернова. Връща номерата, които трябва да се пишат като чернова.
 */
export const черновиОт = async (payload: Payload, ids: number[], req?: PayloadRequest): Promise<Set<number>> => {
  if (!ids.length) return new Set()
  const latest = await payload.find({
    collection: 'products', where: { id: { in: ids } }, draft: true, pagination: false, depth: 0,
    overrideAccess: true, select: { _status: true }, req,
  })
  return new Set(latest.docs.filter((d) => d._status === 'draft').map((d) => d.id as number))
}

/**
 * Записва цени в продуктите с контекста за историята. Една грешка не спира
 * останалите — връща се списък с резултатите.
 */
export const запишиЦени = async (
  payload: Payload,
  items: { id: number; price?: number; compareAtPrice?: number | null; approval?: number }[],
  ctx: PriceContext,
  req?: PayloadRequest,
): Promise<{ id: number; ok: boolean; draft: boolean; error?: string }[]> => {
  const чернови = await черновиОт(payload, items.map((i) => i.id), req)
  const out: { id: number; ok: boolean; draft: boolean; error?: string }[] = []
  for (const i of items) {
    const draft = чернови.has(i.id)
    const data: Record<string, unknown> = {}
    if (i.price !== undefined) data.price = i.price
    if (i.compareAtPrice !== undefined) data.compareAtPrice = i.compareAtPrice
    try {
      await payload.update({
        collection: 'products',
        id: i.id,
        data: (draft ? data : { ...data, _status: 'published' }) as never,
        ...(draft ? { draft: true } : {}),
        depth: 0,
        overrideAccess: true,
        context: { [ЦЕНОВИ_КОНТЕКСТ]: { ...ctx, ...(i.approval ? { approval: i.approval } : {}) } },
        ...(req ? { req } : {}),
      })
      out.push({ id: i.id, ok: true, draft })
    } catch (e) {
      out.push({ id: i.id, ok: false, draft, error: (e as Error).message })
    }
  }
  return out
}

/* ─────────── връщане ─────────── */

type Запис = {
  id: number
  product: number | { id: number; title?: string } | null
  productTitle?: string | null
  priceOld?: number | null
  priceNew?: number | null
  compareOld?: number | null
  compareNew?: number | null
  changedPrice?: boolean | null
  changedCompare?: boolean | null
  batch?: string | null
  createdAt: string
}

export type RevertItem = {
  product: number
  title: string
  price?: number
  compareAtPrice?: number | null
  /** Как ще изглежда: „649,00 € → 919,81 €". */
  описание: string
  /** „След тази промяна цената е сменена още веднъж…" — празно, ако не е. */
  warning: string
}

const номерНа = (p: Запис['product']) => (p && typeof p === 'object' ? p.id : (p ?? 0))
const кога = (iso: string) => new Date(iso).toLocaleString('bg-BG', { timeZone: 'Europe/Sofia', dateStyle: 'short', timeStyle: 'short' })

/**
 * Какво ще направи връщането — на един запис от историята или на целия
 * пакет. Връща се САМО това, което е сменено в записа/пакета, към
 * стойността точно ПРЕДИ него. Наличностите не се пипат.
 */
export const прегледВръщане = async (
  payload: Payload,
  target: { id: number } | { batch: string },
  req?: PayloadRequest,
): Promise<RevertItem[]> => {
  const where: Where = 'id' in target ? { id: { equals: target.id } } : { batch: { equals: target.batch } }
  const записи = (
    await payload.find({ collection: 'price-history', where, sort: 'createdAt', pagination: false, depth: 0, overrideAccess: true, req })
  ).docs as unknown as Запис[]
  if (!записи.length) return []

  // Първият запис на всеки продукт в пакета — стойността ПРЕДИ пакета.
  const поПродукт = new Map<number, { first: Запис; last: Запис; price: boolean; compare: boolean }>()
  for (const z of записи) {
    const pid = номерНа(z.product)
    if (!pid) continue
    const g = поПродукт.get(pid)
    if (!g) поПродукт.set(pid, { first: z, last: z, price: Boolean(z.changedPrice), compare: Boolean(z.changedCompare) })
    else {
      g.last = z
      g.price ||= Boolean(z.changedPrice)
      g.compare ||= Boolean(z.changedCompare)
    }
  }

  const сега = await payload.find({
    collection: 'products', where: { id: { in: [...поПродукт.keys()] } }, draft: true, pagination: false, depth: 0,
    overrideAccess: true, select: { title: true, price: true, compareAtPrice: true }, req,
  })
  const продукт = new Map(сега.docs.map((d) => [d.id as number, d as unknown as ProductPrice & { title: string }]))

  const out: RevertItem[] = []
  for (const [pid, g] of поПродукт) {
    const p = продукт.get(pid)
    if (!p) continue // продуктът е изтрит
    const item: RevertItem = { product: pid, title: p.title ?? g.first.productTitle ?? `№ ${pid}`, описание: '', warning: '' }
    const части: string[] = []
    // Вече е с тази стойност — няма какво да се връща.
    if (g.price && typeof g.first.priceOld === 'number' && g.first.priceOld !== (p.price ?? null)) {
      item.price = g.first.priceOld
      части.push(`цена ${пари(p.price)} → ${пари(g.first.priceOld)}`)
    }
    if (g.compare && (g.first.compareOld ?? null) !== (p.compareAtPrice ?? null)) {
      item.compareAtPrice = g.first.compareOld ?? null
      части.push(`зачертана ${пари(p.compareAtPrice)} → ${пари(g.first.compareOld)}`)
    }
    if (!части.length) continue
    item.описание = части.join(', ')

    // Сменяна ли е цената след записа/пакета?
    const следващи = await payload.find({
      collection: 'price-history',
      where: { and: [{ product: { equals: pid } }, { createdAt: { greater_than: g.last.createdAt } }] },
      sort: '-createdAt', limit: 1, depth: 0, overrideAccess: true, req,
    })
    const after = следващи.docs[0] as unknown as Запис | undefined
    if (after) {
      const нова = after.changedPrice ? after.priceNew : after.compareNew
      const стара = item.price !== undefined ? item.price : item.compareAtPrice
      item.warning = `След тази промяна цената е сменена още веднъж (на ${кога(after.createdAt)}, ${пари(нова)}). Да върна ли все пак към ${пари(стара)}?`
    }
    out.push(item)
  }
  return out
}

export const върни = async (
  payload: Payload,
  target: { id: number } | { batch: string },
  user: string,
  req?: PayloadRequest,
) => {
  const items = await прегледВръщане(payload, target, req)
  const batch = новПакет('В')
  const r = await запишиЦени(
    payload,
    items.map((i) => ({ id: i.product, price: i.price, compareAtPrice: i.compareAtPrice })),
    { source: 'revert', batch, user },
    req,
  )
  return { batch, items, results: r }
}
