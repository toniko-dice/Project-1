/**
 * Сметката на офертата — едно място за админа (на живо, `OfferTotals`),
 * сървъра (кука `beforeChange` в `Offers.ts`) и PDF-а.
 *
 * Сума на реда без ДДС = количество × единична цена × (1 − отстъпка %),
 * закръглена до 0,01 €. Общо без ДДС — сборът на редовете; ДДС — от
 * общото, закръглено; общо с ДДС — сборът на двете.
 */

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100

export type OfferLine = { quantity?: number | null; unitPrice?: number | null; discount?: number | null }

export const lineTotal = (l: OfferLine): number => {
  const q = Number(l.quantity) || 0
  const p = Number(l.unitPrice) || 0
  const d = Math.min(Math.max(Number(l.discount) || 0, 0), 100)
  return round2(q * p * (1 - d / 100))
}

export const offerTotals = (lines: OfferLine[], vatRate: number) => {
  const subtotal = round2(lines.reduce((s, l) => s + lineTotal(l), 0))
  const vat = round2((subtotal * (Number(vatRate) || 0)) / 100)
  return { subtotal, vat, total: round2(subtotal + vat) }
}

/** Цената от сайта е с ДДС — единичната без ДДС се предлага като цена ÷ (1 + ДДС). */
export const priceWithoutVat = (priceWithVat: number | null | undefined, vatRate = 20): number | null =>
  typeof priceWithVat === 'number' ? round2(priceWithVat / (1 + vatRate / 100)) : null

/** „1 234,56 €" — както на сайта. */
export const eur = (n: number): string =>
  new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n)

/** 07.10.2026 */
export const bgDate = (d: string | Date | null | undefined): string => {
  if (!d) return ''
  const x = typeof d === 'string' ? new Date(d) : d
  return Number.isNaN(x.getTime())
    ? ''
    : x.toLocaleDateString('bg-BG', { timeZone: 'Europe/Sofia', day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\s*г\.?$/, '')
}

export const PAYMENT_OPTIONS = [
  { value: 'advance100', label: '100% авансово плащане' },
  { value: 'split50', label: '50% авансово, 50% преди доставка' },
  { value: 'other', label: 'Друго' },
]

export const OFFER_STATUSES = [
  { value: 'draft', label: 'Чернова', color: '#868e96' },
  { value: 'sent', label: 'Изпратена', color: '#1c7ed6' },
  { value: 'accepted', label: 'Приета', color: '#2b8a3e' },
  { value: 'rejected', label: 'Отказана', color: '#c92a2a' },
]

/** Текстът за плащане: избраното, а при „Друго" — свободният текст. */
export const paymentText = (payment?: string | null, other?: string | null): string =>
  payment === 'other' ? (other ?? '').trim() : (PAYMENT_OPTIONS.find((o) => o.value === payment)?.label ?? '')
