/**
 * Редове, чийто продукт току-що е върнат от резервното копие
 * (`OfferDraftGuard`). `OfferItemProductSync` вижда това като смяна на
 * продукта — без този списък би презаписал върнатите име, цена и т.н. с
 * данните от сайта.
 */
export const restoredProductPaths = new Set<string>()

/** „7,5" → 7.5; празно → null; извън 0–100 или не през 0,5 → NaN. */
export const parseDiscount = (raw: string): number | null => {
  const s = raw.trim().replace(',', '.')
  if (!s) return null
  const n = Number(s)
  if (!Number.isFinite(n) || n < 0 || n > 100 || Math.round(n * 2) !== n * 2) return NaN
  return n
}
