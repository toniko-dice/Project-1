import { ДНИ } from '../blocks/Stores'

/** Редът „Работно време" на един магазин, както е в админа. */
export type ЧасовеРед = {
  fromDay?: string | null
  toDay?: string | null
  opens?: string | null
  closes?: string | null
  closed?: boolean | null
}
export type Магазин = {
  name: string
  street: string
  city: string
  mapUrl?: string | null
  phone?: string | null
  hours?: ЧасовеРед[] | null
}

const ИНДЕКС = Object.fromEntries(ДНИ.map((d, i) => [d.value, i]))

/** Дните на реда по ред — „От" до „До" (без „До" — само „От"). */
export const дниНа = (h: ЧасовеРед): string[] => {
  const от = h.fromDay ? ИНДЕКС[h.fromDay] : undefined
  if (от === undefined) return []
  const до = h.toDay && ИНДЕКС[h.toDay] !== undefined && ИНДЕКС[h.toDay]! >= от ? ИНДЕКС[h.toDay]! : от
  return ДНИ.slice(от, до + 1).map((d) => d.value)
}

/** „Понеделник – петък", „Събота". */
const дниТекст = (h: ЧасовеРед): string => {
  const дни = дниНа(h)
  const име = (v: string) => ДНИ[ИНДЕКС[v]!]!.label
  return дни.length > 1 ? `${име(дни[0]!)} – ${име(дни.at(-1)!).toLowerCase()}` : име(дни[0]!)
}

/** „Понеделник – петък: 10:00 – 19:00", „Неделя: почивен ден". */
export const редовеЧасове = (hours: ЧасовеРед[] | null | undefined): string[] =>
  (hours ?? [])
    .filter((h) => дниНа(h).length && (h.closed || (h.opens && h.closes)))
    .map((h) => `${дниТекст(h)}: ${h.closed ? 'почивен ден' : `${h.opens} – ${h.closes}`}`)

/** Ръчният линк или търсене в Google Maps по името и адреса. */
export const картаНа = (m: Магазин): string =>
  m.mapUrl?.trim() ||
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${m.name}, ${m.street}, ${m.city}`)}`

/** `Store` за JSON-LD — с адреса, работното време и фирмата над него. */
export const storeSchema = (m: Магазин, organizationId: string) => {
  const отворени = (m.hours ?? []).filter((h) => дниНа(h).length && !h.closed && h.opens && h.closes)
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: m.name,
    address: { '@type': 'PostalAddress', streetAddress: m.street, addressLocality: m.city, addressCountry: 'BG' },
    hasMap: картаНа(m),
    ...(m.phone?.trim() ? { telephone: m.phone.trim() } : {}),
    ...(отворени.length
      ? {
          openingHoursSpecification: отворени.map((h) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: дниНа(h).map((d) => `https://schema.org/${d}`),
            opens: h.opens,
            closes: h.closes,
          })),
        }
      : {}),
    parentOrganization: { '@id': organizationId },
  }
}
