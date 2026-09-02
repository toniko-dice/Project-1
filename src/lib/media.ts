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
 */
export const mediaUrl = (value: MaybeMedia, size?: MediaSize): string | null => {
  if (!value || typeof value === 'number') return null
  if (size && value.sizes?.[size]?.url) return value.sizes[size]!.url!
  return value.url ?? null
}

export const mediaAlt = (value: MaybeMedia): string => {
  if (!value || typeof value === 'number') return ''
  return value.alt ?? ''
}

export const mediaDims = (value: MaybeMedia): { width: number; height: number } => {
  if (!value || typeof value === 'number') return { width: 1200, height: 800 }
  return { width: value.width ?? 1200, height: value.height ?? 800 }
}
