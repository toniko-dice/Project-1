import { type DiceRow, eanКандидати } from './parse'

/**
 * Редовете от файла на dice → нашите продукти (`task-dice-xml-poleta.md`, т. 4).
 * Без заявки — синхронизацията подава продуктите, тестът — примерни.
 *
 * 1. По `Identifier` = SKU на продукта — първо за ВСИЧКИ редове, за да
 *    може по-късен ред да „заеме" продукта преди ред, който съвпада с него
 *    само по баркод.
 * 2. Останалите — по EAN (`ean` или `ean2` на продукта), само с годните
 *    кандидати (`eanКандидати`: без наставки и кодове, списъкът — всеки).
 *
 * Ред, който по EAN сочи продукт, вече съвпаднал по `Identifier` с друг
 * ред, е ДРУГ артикул в dice със същия баркод (DELTA 3 Max Plus: 74921 е
 * нашият, 78570 — не) — тихо се пропуска. Два реда само по EAN към един
 * продукт — грешка за втория, както досега.
 */

export type MatchProduct = { id: number; title: string; sku?: string | null; ean?: string | null; ean2?: string | null }

export type MatchResult<P extends MatchProduct> = {
  matches: { row: DiceRow; product: P; by: 'sku' | 'ean' }[]
  notFound: DiceRow[]
  /** Пропуснати без грешка — с причината. */
  skipped: string[]
  errors: string[]
  warnings: string[]
}

const норм = (s: string | null | undefined) => (s ?? '').trim().toLowerCase()

export const rowLabel = (row: DiceRow) => `${row.name || '(без име)'} [Identifier ${row.sku ?? '—'}, EAN ${row.ean ?? '—'}]`

export const съпостави = <P extends MatchProduct>(rows: DiceRow[], products: P[]): MatchResult<P> => {
  const поSku = new Map<string, P[]>()
  const поEan = new Map<string, P[]>()
  const добави = (m: Map<string, P[]>, k: string, p: P) => {
    if (k && !m.get(k)?.includes(p)) m.set(k, [...(m.get(k) ?? []), p])
  }
  for (const p of products) {
    добави(поSku, норм(p.sku), p)
    for (const e of [...eanКандидати(p.ean), ...eanКандидати(p.ean2)]) добави(поEan, e, p)
  }
  const поБаркод = (row: DiceRow): P[] => [...new Set(eanКандидати(row.ean).flatMap((e) => поEan.get(e) ?? []))]

  const r: MatchResult<P> = { matches: [], notFound: [], skipped: [], errors: [], warnings: [] }
  const поКодЗаето = new Map<number, DiceRow>()
  const поБаркодЗаето = new Map<number, DiceRow>()
  const обработени = new Set<DiceRow>()
  const съвпадения = new Map<DiceRow, { product: P; by: 'sku' | 'ean' }>()

  /* 1. По Identifier */
  for (const row of rows) {
    const поКод = row.sku ? (поSku.get(норм(row.sku)) ?? []) : []
    if (!поКод.length) continue
    обработени.add(row)
    if (поКод.length > 1) {
      r.errors.push(`${rowLabel(row)}: Identifier съвпада с ${поКод.length} продукта (${поКод.map((p) => p.title).join(', ')}) — не е пипнат`)
      continue
    }
    const p = поКод[0]!
    if (поКодЗаето.has(p.id)) {
      r.errors.push(`${rowLabel(row)}: „${p.title}" вече е съвпаднал с друг ред със същия Identifier — вторият не е пипнат`)
      continue
    }
    поКодЗаето.set(p.id, row)
    съвпадения.set(row, { product: p, by: 'sku' })
    const другиПоEan = поБаркод(row).filter((x) => x.id !== p.id)
    if (другиПоEan.length) {
      r.warnings.push(`${rowLabel(row)}: съвпада по Identifier с „${p.title}", а EAN-ът сочи „${другиПоEan.map((x) => x.title).join(', ')}" — взет е по Identifier`)
    }
  }

  /* 2. По EAN — редовете, които не съвпаднаха по Identifier */
  for (const row of rows) {
    if (обработени.has(row)) continue
    const поEanP = поБаркод(row)
    if (!поEanP.length) {
      r.notFound.push(row)
      continue
    }
    if (поEanP.length > 1) {
      r.errors.push(`${rowLabel(row)}: EAN съвпада с ${поEanP.length} продукта (${поEanP.map((p) => p.title).join(', ')}) — не е пипнат`)
      continue
    }
    const p = поEanP[0]!
    if (поКодЗаето.has(p.id)) {
      r.skipped.push(`${rowLabel(row)} — същият EAN като „${p.title}", който съвпадна по Identifier ${поКодЗаето.get(p.id)!.sku}; друг артикул в dice`)
      continue
    }
    if (поБаркодЗаето.has(p.id)) {
      r.errors.push(`${rowLabel(row)}: „${p.title}" вече е съвпаднал по EAN с друг ред във файла — вторият не е пипнат`)
      continue
    }
    поБаркодЗаето.set(p.id, row)
    съвпадения.set(row, { product: p, by: 'ean' })
  }

  // По реда във файла.
  for (const row of rows) {
    const m = съвпадения.get(row)
    if (m) r.matches.push({ row, ...m })
  }
  return r
}
