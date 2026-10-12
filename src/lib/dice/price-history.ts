import type { CollectionAfterChangeHook } from 'payload'

import { ЦЕНОВИ_КОНТЕКСТ, пари, type PriceContext, type PriceSource } from './prices'

type Цени = { price?: number | null; compareAtPrice?: number | null; _status?: string | null }

const равни = (a: number | null | undefined, b: number | null | undefined) => (a ?? null) === (b ?? null)

/**
 * „История на цените" — кука `afterChange` на продуктите. Записва всяка
 * смяна на цената или зачертаната цена на САЙТА, откъдето и да идва
 * (одобрение, синхронизация, админ, внос, връщане).
 *
 * На сайта е публикуваната версия, затова:
 * - запис на чернова не се брои — сайтът не се сменя;
 * - при публикуване се сравнява с ПРЕДИШНАТА ПУБЛИКУВАНА версия, не с
 *   `previousDoc`: при чакащи непубликувани промени `previousDoc` е
 *   черновата и смяна, направена в нея, иначе би се изгубила.
 * Създаването на продукт не е смяна.
 */
export const recordPriceHistory: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation !== 'update' || doc._status !== 'published') return doc

  let преди: Цени | null = previousDoc?._status === 'published' ? (previousDoc as Цени) : null
  if (!преди) {
    // Последната публикувана версия преди тази (току-що записаната е първа).
    const v = await req.payload.findVersions({
      collection: 'products',
      where: { and: [{ parent: { equals: doc.id } }, { 'version._status': { equals: 'published' } }] },
      sort: '-updatedAt',
      limit: 2,
      depth: 0,
      overrideAccess: true,
      req,
    })
    преди = (v.docs[1]?.version as Цени | undefined) ?? null
    if (!преди) return doc // първо публикуване
  }

  const changedPrice = !равни(преди.price, doc.price)
  const changedCompare = !равни(преди.compareAtPrice, doc.compareAtPrice)
  if (!changedPrice && !changedCompare) return doc

  const ctx = (req.context?.[ЦЕНОВИ_КОНТЕКСТ] as PriceContext | undefined) ?? null
  const user = (req.user as { email?: string; name?: string } | null) ?? null
  const source: PriceSource = ctx?.source ?? (user ? 'admin' : 'import')
  const части = [
    changedPrice ? `${пари(преди.price)} → ${пари(doc.price)}` : '',
    changedCompare ? `зачертана ${пари(преди.compareAtPrice)} → ${пари(doc.compareAtPrice)}` : '',
  ].filter(Boolean)

  try {
    await req.payload.create({
      collection: 'price-history',
      data: {
        title: `${doc.title}: ${части.join('; ')}`,
        product: doc.id,
        productTitle: doc.title,
        sku: doc.sku ?? '',
        priceOld: преди.price ?? null,
        priceNew: doc.price ?? null,
        compareOld: преди.compareAtPrice ?? null,
        compareNew: doc.compareAtPrice ?? null,
        changedPrice,
        changedCompare,
        source,
        user: ctx?.user ?? user?.email ?? (source === 'sync' ? 'синхронизация' : ''),
        batch: ctx?.batch ?? '',
        approval: ctx?.approval ?? null,
      },
      overrideAccess: true,
      depth: 0,
      req,
    })
  } catch (e) {
    // Историята не бива да проваля записа на продукта — само се изписва.
    req.payload.logger.error(`История на цените: ${doc.title} — ${(e as Error).message}`)
  }
  return doc
}
