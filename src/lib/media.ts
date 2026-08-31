import type { Media } from '@/payload-types'

type MaybeMedia = number | Media | null | undefined

/** Payload връща или ID, или пълния обект според дълбочината на заявката. */
export const mediaUrl = (value: MaybeMedia, size?: 'thumbnail' | 'card' | 'banner' | 'wide'): string | null => {
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
