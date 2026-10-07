import { XMLParser } from 'fast-xml-parser'

import type { Availability } from '../availability'

/**
 * XML файлът на dice.bg → редове (`task-dice-xml-sinhronizaciya.md`).
 *
 * ИСТИНСКИЯТ формат още го нямаме. Затова имената на полетата не са
 * зашити едно по едно, а се търсят по списък с възможни имена (без значение
 * главни/малки букви, `_` и `-`), а записите — като най-дългия списък от
 * еднакви елементи с код или баркод. Когато дойде истинският файл, тук се
 * уточняват `ПОЛЕТА` и `НАЛИЧНОСТ` — нищо друго.
 */

export type DiceRow = {
  sku: string | null
  ean: string | null
  name: string
  brand: string
  qty: number | null
  availabilityRaw: string
  price: number | null
  /** Цената, както е във файла — за лога при невалидна. */
  priceRaw: string
  oldPrice: number | null
}

const ПОЛЕТА = {
  sku: ['sku', 'code', 'productcode', 'itemcode', 'model', 'artikul', 'kod'],
  ean: ['ean', 'ean13', 'barcode', 'gtin', 'gtin13'],
  name: ['name', 'title', 'productname', 'ime'],
  brand: ['brand', 'manufacturer', 'vendor', 'marka'],
  qty: ['qty', 'quantity', 'stock', 'stockqty', 'kolichestvo', 'broy', 'count'],
  availability: ['availability', 'stockstatus', 'status', 'nalichnost', 'instock'],
  price: ['price', 'finalprice', 'saleprice', 'specialprice', 'cena'],
  oldPrice: ['oldprice', 'regularprice', 'priceold', 'listprice', 'originalprice', 'staracena', 'oldcena'],
} as const

/** Стойностите на наличността в dice → нашите. Непозната → грешка, нищо не се пипа. */
const НАЛИЧНОСТ: Record<string, Availability> = {
  instock: 'in-stock',
  available: 'in-stock',
  yes: 'in-stock',
  true: 'in-stock',
  '1': 'in-stock',
  да: 'in-stock',
  вналичност: 'in-stock',
  наличен: 'in-stock',
  налично: 'in-stock',
  outofstock: 'out-of-stock',
  soldout: 'out-of-stock',
  no: 'out-of-stock',
  false: 'out-of-stock',
  '0': 'out-of-stock',
  не: 'out-of-stock',
  изчерпан: 'out-of-stock',
  изчерпано: 'out-of-stock',
  няма: 'out-of-stock',
  preorder: 'on-request',
  backorder: 'on-request',
  onrequest: 'on-request',
  позаявка: 'on-request',
  призаявка: 'on-request',
}

const ключ = (s: string) => s.toLowerCase().replace(/[\s_\-.:]/g, '')

/**
 * Наличността от реда. `null` — във файла няма такава стойност (тогава
 * решава броят); `'unknown'` — има, но не я познаваме.
 */
export const mapAvailability = (row: DiceRow): Availability | null | 'unknown' => {
  const raw = ключ(row.availabilityRaw)
  if (raw) return НАЛИЧНОСТ[raw] ?? 'unknown'
  if (row.qty === null) return null
  return row.qty > 0 ? 'in-stock' : 'out-of-stock'
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

const вземи = (obj: Record<string, unknown>, имена: readonly string[]): string => {
  const keys = Object.keys(obj)
  for (const име of имена) {
    const k = keys.find((x) => ключ(x) === име)
    if (k !== undefined) return текст(obj[k])
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
      if (best.length === 0 && (вземи(o, ПОЛЕТА.sku) || вземи(o, ПОЛЕТА.ean)) && вземи(o, ПОЛЕТА.price)) best = [o]
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
    const priceRaw = вземи(o, ПОЛЕТА.price)
    const qtyRaw = вземи(o, ПОЛЕТА.qty)
    const qty = parseNumber(qtyRaw)
    return {
      sku: вземи(o, ПОЛЕТА.sku) || null,
      ean: вземи(o, ПОЛЕТА.ean).replace(/\s/g, '') || null,
      name: вземи(o, ПОЛЕТА.name),
      brand: вземи(o, ПОЛЕТА.brand),
      qty: qty === null ? null : Math.max(0, Math.round(qty)),
      availabilityRaw: вземи(o, ПОЛЕТА.availability),
      price: parseNumber(priceRaw),
      priceRaw,
      oldPrice: parseNumber(вземи(o, ПОЛЕТА.oldPrice)),
    }
  })
}

export const isEcoFlow = (row: DiceRow) => /eco\s*flow/i.test(`${row.brand} ${row.name}`)
