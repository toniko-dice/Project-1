import type { Media } from '@/payload-types'

type MaybeMedia = number | Media | null | undefined

/**
 * Размерите от `Media.ts`.
 *
 * Първите четири изрязват до точно съотношение; `content` и `large` пазят
 * пропорцията и се ползват там, където снимката не бива да се реже.
 */
export type MediaSize = 'thumbnail' | 'card' | 'banner' | 'wide' | 'content' | 'large'

/**
 * Payload връща или ID, или пълния обект според дълбочината на заявката.
 *
 * Ако исканият размер липсва — например при снимка, качена преди той да
 * бъде добавен — се връща оригиналът. Затова старите изображения работят
 * без преобразуване.
 *
 * Адресът носи времето на последната промяна като параметър `?v=`.
 * При презаписване или изрязване в админа Payload запазва същото име на
 * файла; без параметъра браузърът и кешът на Next.js виждат същия адрес,
 * решават, че нищо не се е променило, и продължават да показват старата
 * версия. Смяната на `updatedAt` сменя адреса и ги кара да я изтеглят
 * наново.
 */
export const mediaUrl = (value: MaybeMedia, size?: MediaSize): string | null => {
  if (!value || typeof value === 'number') return null

  const base = size && value.sizes?.[size]?.url ? value.sizes[size]!.url! : value.url
  if (!base) return null

  const stamp = value.updatedAt ? Date.parse(value.updatedAt) : 0
  // Date.parse дава NaN при негоден запис — тогава адресът остава чист.
  return Number.isFinite(stamp) && stamp > 0 ? `${base}?v=${stamp}` : base
}

export const mediaAlt = (value: MaybeMedia): string => {
  if (!value || typeof value === 'number') return ''
  return value.alt ?? ''
}

export const mediaDims = (value: MaybeMedia): { width: number; height: number } => {
  if (!value || typeof value === 'number') return { width: 1200, height: 800 }
  return { width: value.width ?? 1200, height: value.height ?? 800 }
}
