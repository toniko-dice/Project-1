import { XMLParser } from 'fast-xml-parser'

import type { Availability } from '../availability'

/**
 * XML файлът на dice.bg → редове (`task-dice-xml-sinhronizaciya.md`,
 * полетата — `task-dice-xml-poleta.md`, 12 октомври 2026).
 *
 * Форматът е истинският (`https://dice.bg/xtento_exports/Ecoflow-XML.xml`):
 *
 *   <Product>
 *     <Identifier>78725</Identifier>      кодът на dice = SKU на продукта
 *     <ProductNumber/>                    празно навсякъде
 *     <Name>…</Name>
 *     <SpecialPrice>159.00</SpecialPrice> намалената; празно = без намаление
 *     <Price>179.00</Price>               редовната
 *     <quantity>3</quantity>
 *     <Manufacturer>EcoFlow</Manufacturer>
 *     <ean>4895251667388</ean>
 *     <stock>in stock</stock>             "in stock" / "out of stock"
 *   </Product>
 *
 * `ПОЛЕТА` са ТОЧНИТЕ имена — без догадки. Първата версия търсеше по
 * списък възможни имена и хвана `Price` (редовната) за крайна цена, а
 * `SpecialPrice` никъде: 54 продукта с намаление излязоха с редовната
 * цена и без зачертана. Главни/малки букви, `_` и `-` нямат значение.
 */

export type DiceRow = {
  /** `Identifier` (после `ProductNumber`) — съвпада с полето SKU на продукта. */
  sku: string | null
  /** Както е във файла, без интервалите. Кандидатите за търсене — `eanКандидати`. */
  ean: string | null
  name: string
  brand: string
  qty: number | null
  availabilityRaw: string
  /** `Price` — редовната цена. */
  regularPrice: number | null
  /** `SpecialPrice` — намалената; `null` = няма намаление. */
  specialPrice: number | null
  /** Цените, както са във файла — за лога при невалидна. */
  priceRaw: string
  specialRaw: string
}

const ПОЛЕТА = {
  sku: ['identifier', 'productnumber'],
  ean: ['ean'],
  name: ['name'],
  brand: ['manufacturer'],
  qty: ['quantity'],
  availability: ['stock'],
  regularPrice: ['price'],
  specialPrice: ['specialprice'],
} as const

/** `stock` → наличност. Друга стойност → грешка в лога, наличността не се пипа. */
const НАЛИЧНОСТ: Record<string, Availability> = {
  instock: 'in-stock',
  outofstock: 'out-of-stock',
}

const ключ = (s: string) => s.toLowerCase().replace(/[\s_\-.:]/g, '')

/**
 * Наличността от реда. `null` — `stock` е празно (тогава решава броят:
 * > 0 → в наличност); `'unknown'` — има стойност, но не я познаваме.
 * `in stock` с брой 0 остава „в наличност" — dice го продава.
 */
export const mapAvailability = (row: DiceRow): Availability | null | 'unknown' => {
  const raw = ключ(row.availabilityRaw)
  if (raw) return НАЛИЧНОСТ[raw] ?? 'unknown'
  if (row.qty === null) return null
  return row.qty > 0 ? 'in-stock' : 'out-of-stock'
}

export type FinalPrice =
  | { ok: true; price: number; compareAtPrice: number | null; warning: string | null }
  | { ok: false; error: string }

/**
 * Цената на сайта и зачертаната — ЕДИНСТВЕНОТО място с това правило
 * (синхронизацията, „Провери" и „Цени за одобрение" ползват него):
 *
 * | във файла                         | цена         | зачертана |
 * |-----------------------------------|--------------|-----------|
 * | SpecialPrice > 0 и < Price        | SpecialPrice | Price     |
 * | SpecialPrice празна / 0           | Price        | —         |
 * | SpecialPrice ≥ Price              | Price        | — + предупреждение |
 * | Price празна / 0 / не е число     | продуктът се пропуска + грешка |
 *
 * Третият ред е Solar Tracker (60687): 1699 > 1533,36 — и самият магазин
 * показва по-ниската.
 */
export const finalPrice = (row: Pick<DiceRow, 'regularPrice' | 'specialPrice' | 'priceRaw' | 'specialRaw'>): FinalPrice => {
  const p = row.regularPrice
  if (p === null || !(p > 0)) return { ok: false, error: `невалидна цена във файла (Price „${row.priceRaw}")` }
  const s = row.specialPrice
  if (s === null || !(s > 0)) return { ok: true, price: p, compareAtPrice: null, warning: null }
  if (s < p) return { ok: true, price: s, compareAtPrice: p, warning: null }
  return {
    ok: true,
    price: p,
    compareAtPrice: null,
    warning: `SpecialPrice ${row.specialRaw} не е по-ниска от Price ${row.priceRaw} — взета е Price, без зачертана`,
  }
}

/**
 * EAN-ите от реда, годни за търсене: без интервалите, разделени по
 * запетая, само 8–14 цифри. Стойност с наставка (`…-1`, `…-нарушена`) е
 * отделен артикул в dice (отворена кутия, втори вариант) и НЕ се
 * съпоставя по EAN — само по `Identifier`. Кодове (`BMR330`) — също не.
 */
export const eanКандидати = (raw: string | null | undefined): string[] =>
  (raw ?? '')
    .replace(/\s/g, '')
    .split(',')
    .filter((e) => /^\d{8,14}$/.test(e))

/**
 * Нередност в баркода на реда — за раздела „Нередности във файла на dice"
 * в отчета, за да се оправи там. `null` — няма. Наставките (`-1`,
 * `-нарушена`) не са нередност: така dice отбелязва отделни артикули.
 */
export const eanНередност = (raw: string | null | undefined): string | null => {
  const s = (raw ?? '').replace(/\s/g, '')
  if (!s) return 'няма EAN'
  const части = s.split(',').filter(Boolean)
  if (части.length > 1) return 'няколко EAN в едно поле'
  const e = части[0]!
  if (/^\d{8,14}-.+$/.test(e)) return null
  if (!/^\d+$/.test(e)) return 'код вместо EAN'
  if (e.length < 8 || e.length > 14) return `${e.length} цифри — не е EAN`
  if (e.startsWith('0') && e.length > 13) return 'водеща нула'
  if (e.length === 14) return '14 цифри — вероятно излишна цифра'
  return null
}

/** „1 234,50", „1234.50", „1.234,50 лв." → 1234.5; празно или негодно → null. */
export const parseNumber = (raw: string): number | null => {
  let s = raw.replace(/[^\d.,-]/g, '')
  if (!s) return null
  if (s.includes(',') && s.includes('.')) s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '')
  else if (s.includes(',')) s = s.replace(',', '.')
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

const текст = (v: unknown): string => {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>
    // <price currency="EUR">12.50</price> → стойността е в `#text`.
    return '#text' in o ? текст(o['#text']) : ''
  }
  return String(v).trim()
}

/** Първата НЕпразна стойност по реда на имената (`Identifier`, после `ProductNumber`). */
const вземи = (obj: Record<string, unknown>, имена: readonly string[]): string => {
  const keys = Object.keys(obj)
  for (const име of имена) {
    const k = keys.find((x) => ключ(x) === име)
    const v = k === undefined ? '' : текст(obj[k])
    if (v) return v
  }
  return ''
}

/** Най-дългият списък от обекти с код или баркод — това са продуктите. */
const намериЗаписи = (node: unknown): Record<string, unknown>[] => {
  let best: Record<string, unknown>[] = []
  const обходи = (n: unknown) => {
    if (Array.isArray(n)) {
      const objs = n.filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === 'object' && !Array.isArray(x))
      const сКод = objs.filter((o) => вземи(o, ПОЛЕТА.sku) || вземи(o, ПОЛЕТА.ean))
      if (сКод.length > best.length) best = objs
      n.forEach(обходи)
    } else if (n && typeof n === 'object') {
      const o = n as Record<string, unknown>
      // Единствен продукт във файла не е масив — пак се брои.
      if (best.length === 0 && (вземи(o, ПОЛЕТА.sku) || вземи(o, ПОЛЕТА.ean)) && вземи(o, ПОЛЕТА.regularPrice)) best = [o]
      Object.values(o).forEach(обходи)
    }
  }
  обходи(node)
  return best
}

export class DiceFileError extends Error {}

export const parseDiceXml = (xml: string): DiceRow[] => {
  if (!xml.trim()) throw new DiceFileError('Файлът е празен.')
  let doc: unknown
  try {
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '', parseTagValue: false, trimValues: true })
    doc = parser.parse(xml, true)
  } catch (e) {
    throw new DiceFileError(`Файлът не е валиден XML: ${(e as Error).message}`)
  }
  const записи = намериЗаписи(doc)
  if (!записи.length) throw new DiceFileError('Във файла няма нито един продукт с код или баркод.')
  return записи.map((o) => {
    const priceRaw = вземи(o, ПОЛЕТА.regularPrice)
    const specialRaw = вземи(o, ПОЛЕТА.specialPrice)
    const qty = parseNumber(вземи(o, ПОЛЕТА.qty))
    return {
      sku: вземи(o, ПОЛЕТА.sku) || null,
      ean: вземи(o, ПОЛЕТА.ean).replace(/\s/g, '') || null,
      name: вземи(o, ПОЛЕТА.name),
      brand: вземи(o, ПОЛЕТА.brand),
      qty: qty === null ? null : Math.max(0, Math.round(qty)),
      availabilityRaw: вземи(o, ПОЛЕТА.availability),
      regularPrice: parseNumber(priceRaw),
      specialPrice: parseNumber(specialRaw),
      priceRaw,
      specialRaw,
    }
  })
}

export const isEcoFlow = (row: DiceRow) => /eco\s*flow/i.test(`${row.brand} ${row.name}`)
