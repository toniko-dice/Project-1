import type { CollectionBeforeChangeHook, Payload, PayloadRequest, Where } from 'payload'

/**
 * Етикетът „Последна бройка" (`task-dice-xml-sinhronizaciya.md`, т. 7).
 *
 * Пази се готов в продукта (`lastPiece`), а не се пресмята при показване:
 * картите се рисуват и в браузъра (филтрите) и не могат да прочетат прага
 * от „Връзка с dice.bg". Пресмята се при всеки запис на продукта, а при
 * смяна на прага — за всички наведнъж (`recomputeLastPiece`).
 */
export const DEFAULT_LAST_PIECE = 1

type Settings = { lastPieceThreshold?: number | null }

export const lastPieceThreshold = async (req: PayloadRequest): Promise<number> => {
  const ctx = req.context as { diceSettings?: Settings }
  if (!ctx.diceSettings) {
    try {
      ctx.diceSettings = (await req.payload.findGlobal({ slug: 'dice-sync', depth: 0, req, overrideAccess: true })) as Settings
    } catch {
      ctx.diceSettings = {}
    }
  }
  const t = ctx.diceSettings.lastPieceThreshold
  return typeof t === 'number' && t >= 0 ? t : DEFAULT_LAST_PIECE
}

export const isLastPiece = (
  p: { stockQty?: number | null; availability?: string | null; hideLastPiece?: boolean | null },
  threshold: number,
) =>
  threshold > 0 &&
  !p.hideLastPiece &&
  (p.availability ?? 'in-stock') === 'in-stock' &&
  typeof p.stockQty === 'number' &&
  p.stockQty > 0 &&
  p.stockQty <= threshold

export const fillLastPiece: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const merged = { ...(originalDoc ?? {}), ...data }
  data.lastPiece = isLastPiece(merged, await lastPieceThreshold(req))
  return data
}

/** След смяна на прага — пресмята всички продукти, без нови версии. */
export const recomputeLastPiece = async (payload: Payload, threshold: number) => {
  const on: Where = {
    and: [
      { stockQty: { greater_than: 0 } },
      { stockQty: { less_than_equal: threshold } },
      { availability: { equals: 'in-stock' } },
      { hideLastPiece: { not_equals: true } },
    ],
  }
  await payload.db.updateMany({ collection: 'products', where: {}, data: { lastPiece: false } })
  if (threshold > 0) await payload.db.updateMany({ collection: 'products', where: on, data: { lastPiece: true } })
}
