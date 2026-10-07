import type { Media, Product } from '@/payload-types'
import { BADGE_LABELS } from './format'
import { productPath } from './urls'

type MaybeMedia = number | Media | null | undefined
type MaybeProduct = number | Product | null | undefined

/**
 * Размерите от `Media.ts`.
 *
 * Първите четири изрязват до точно съотношение; `content` и `large` пазят
 * пропорцията и се ползват там, където снимката не бива да се реже.
 */
export type MediaSize = 'thumbnail' | 'card' | 'banner' | 'wide' | 'mobile' | 'content' | 'large' | 'full'

/**
 * Размерът на снимка в продуктова карта: изрязаният вариант (`trimmed`),
 * ако снимката е изрез с прозрачен фон, иначе `card` — както досега.
 * Виж `src/lib/trim-image.ts` и `CardImage`.
 */
export type CardImageSize = MediaSize | 'trimmed'

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

/**
 * Адресът на изрязания вариант за картите или `null`, ако снимката няма
 * такъв (не е изрез). Файлът стои до оригинала, затова адресът е неговият
 * с друго име; `?v=` е същото като на `mediaUrl`.
 */
export const trimmedUrl = (value: MaybeMedia, which: 'filename' | 'small' = 'filename'): string | null => {
  if (!value || typeof value === 'number') return null
  const name = value.trimmed?.[which]
  const original = mediaUrl(value)
  if (!name || !original) return null
  return original.replace(/\/[^/?]*(\?|$)/, `/${encodeURIComponent(name)}$1`)
}

/**
 * Малка снимка за плочка (~96 CSS px) — готов файл, не оптимизаторът на Next:
 * малкото изрязано копие (до 240 px), иначе `thumbnail` (400 px, webp).
 * `trimmed` казва дали е изрез — плочката го показва с еднакво отстояние.
 */
export const tileImage = (value: MaybeMedia): { url: string | null; trimmed: boolean } => {
  const small = trimmedUrl(value, 'small')
  if (small) return { url: small, trimmed: true }
  return { url: mediaUrl(value, 'thumbnail'), trimmed: false }
}

export const mediaAlt = (value: MaybeMedia): string => {
  if (!value || typeof value === 'number') return ''
  return value.alt ?? ''
}

export const mediaDims = (value: MaybeMedia): { width: number; height: number } => {
  if (!value || typeof value === 'number') return { width: 1200, height: 800 }
  return { width: value.width ?? 1200, height: value.height ?? 800 }
}

/**
 * Снимката на продукт за дадено място — с възможна замяна.
 *
 * Навсякъде, където от админа се избира продукт (карта в менюто, карусел,
 * ред под банер, колона в сравнителната таблица), снимката идва от
 * главната снимка на продукта. Собственикът не я качва втори път и не я
 * оразмерява — размерите вече са направени при качването. Полето „Снимка"
 * на самото място е по избор и, ако е попълнено, има предимство.
 *
 * Размерът се избира от кода според мястото, не от собственика.
 *
 * Едно място за това правило, не пет — иначе замяната работи на едно
 * място и не работи на друго.
 */
export const productImage = (
  product: MaybeProduct,
  size: CardImageSize,
  override?: MaybeMedia,
): { url: string | null; alt: string; trimmed: boolean } => {
  const doc = product && typeof product !== 'number' ? product : null
  // Незаредена замяна (само номер) не може да се покаже — пада се на продукта.
  const media = override && typeof override !== 'number' ? override : doc?.image
  const trimmed = size === 'trimmed' ? trimmedUrl(media) : null
  return {
    url: trimmed ?? mediaUrl(media, size === 'trimmed' ? 'card' : size),
    alt: mediaAlt(media) || doc?.title || '',
    trimmed: Boolean(trimmed),
  }
}

/** Ръчните полета на едно място с избор на продукт — всяко по избор. */
export type ProductCardOverrides = {
  title?: string | null
  tagline?: string | null
  image?: MaybeMedia
  url?: string | null
  price?: number | null
  comparePrice?: number | null
  /** Ръчен етикет за това място. Само той се показва — етикетът на продукта не се пренася. */
  label?: string | null
}

export type ProductCardData = {
  imageUrl: string | null
  imageAlt: string
  /** Снимката е изрязаният вариант — картата я показва с еднакво отстояние (`CardImage`). */
  imageTrimmed: boolean
  title: string
  tagline: string | null
  url: string | null
  price: number | null
  comparePrice: number | null
  /** Ръчният етикет на мястото; `null`, ако не е попълнен. */
  label: string | null
  /** Етикетът на самия продукт („НОВО", „ПРОМОЦИЯ"…) — за собствената му карта. */
  badge: string | null
  /** „Последна бройка" — пресметнато при запис на продукта (`lastPiece`). */
  lastPiece: boolean
}

const filled = (v: string | null | undefined): string | null => (v && v.trim() ? v : null)

/**
 * Всичко за една продуктова карта — снимка, име, ред със спецификации,
 * адрес, цена, стара цена, етикет — с възможни замени за конкретното място.
 *
 * Същото правило като `productImage`, за всички полета: избран продукт дава
 * данните; ръчното поле на мястото е по избор и има предимство само ако е
 * попълнено. Едно място за това, не пет — иначе снимката се сменя от
 * продукта, а името и цената остават старите (точно това се случи в
 * панела на менюто).
 *
 * Изключение е етикетът. Той НЕ се взима от продукта: собственикът решава
 * къде и какъв етикет да има, за всяко място поотделно, през ръчното поле.
 * Етикетът на самия продукт се връща отделно (`badge`) — за собствената му
 * карта в карусела, където няма ръчно поле.
 */
export const productCardData = (
  product: MaybeProduct,
  overrides: ProductCardOverrides = {},
  size: CardImageSize = 'trimmed',
): ProductCardData => {
  const doc = product && typeof product !== 'number' ? product : null
  const image = productImage(doc, size, overrides.image)
  const title = filled(overrides.title) ?? doc?.title ?? ''
  const badge = doc?.badge && doc.badge !== 'none' ? (BADGE_LABELS[doc.badge] ?? null) : null

  return {
    imageUrl: image.url,
    imageAlt: image.alt || title,
    imageTrimmed: image.trimmed,
    title,
    tagline: filled(overrides.tagline) ?? filled(doc?.tagline) ?? null,
    url: filled(overrides.url) ?? (doc ? productPath(doc) : null),
    price: overrides.price ?? doc?.price ?? null,
    comparePrice: overrides.comparePrice ?? doc?.compareAtPrice ?? null,
    label: filled(overrides.label),
    badge,
    lastPiece: Boolean(doc?.lastPiece) && (doc?.availability ?? 'in-stock') === 'in-stock',
  }
}

/* ─────────── секционни снимки — без прекодиране ─────────── */

/** Готова за `<img>` снимка: адрес, кандидати по ширина, размери, alt. */
export type ResponsiveImage = {
  src: string
  /** Празно, когато има само един кандидат. */
  srcSet: string
  width: number
  height: number
  alt: string
}

/** Размерите без изрязване, от малък към голям. Всички са webp. */
/*
  `mobile` (828 px) е за телефона — без него най-малкият кандидат беше
  `content` (1600 px). Снимка, качена преди него и непреминала през
  `npm run media:regenerate`, просто го няма и започва от `content`.
*/
const WIDE_SIZES = ['mobile', 'content', 'large', 'full'] as const

/**
 * Снимка на пълна или половин ширина — секции, банери.
 *
 * Два въпроса, решени тук:
 *
 * 1. **Резолюция.** Собственикът качва оригиналите на EcoFlow (2048 px).
 *    Дълго време се сервираше `content` (1600 px) през `next/image` с
 *    q=75 — 22 % по-малко резолюция и двойна компресия; на 4K екран
 *    секциите бяха видимо по-меки от eu.ecoflow.com. Затова кандидатите
 *    стигат до `full`, който е с ширината на оригинала.
 *
 * 2. **Тегло.** Оригиналът НЕ влиза в `srcSet`. Той е JPEG архив: 454 KB
 *    срещу 94 KB за същата снимка в webp. Браузър с devicePixelRatio ≥ 1,5
 *    избираше точно него и страницата с 14 секции излизаше 5–6 MB.
 *
 * Кандидатите са само нашите webp размери, никога по-широки от оригинала.
 * Оригиналът остава краен изход само ако нито един размер не е направен —
 * например SVG, или файл, качен преди `full` и още непреминал през
 * `npm run media:regenerate`.
 *
 * Резултатът е за обикновен `<img>` (виж `SectionImage`), не за
 * `next/image` — оптимизаторът му няма какво полезно да направи, файловете
 * са готови при качването, а прекодирането само влошава и товари сървъра.
 */
export const sectionImage = (value: MaybeMedia): ResponsiveImage | null => {
  if (!value || typeof value === 'number' || !value.url) return null

  const original = mediaUrl(value)
  if (!original) return null

  const candidates: { url: string; w: number }[] = []
  for (const size of WIDE_SIZES) {
    const s = value.sizes?.[size]
    // Еднаква ширина от два размера (тясна снимка) дава един кандидат.
    if (s?.url && s.width && !candidates.some((c) => c.w === s.width)) {
      candidates.push({ url: mediaUrl(value, size)!, w: s.width })
    }
  }
  candidates.sort((a, b) => a.w - b.w)

  const largest = candidates[candidates.length - 1]

  return {
    src: largest?.url ?? original,
    srcSet: candidates.length > 1 ? candidates.map((c) => `${c.url} ${c.w}w`).join(', ') : '',
    width: largest?.w ?? value.width ?? 1600,
    height: value.height ?? 900,
    alt: value.alt ?? '',
  }
}

/**
 * Банер с изрязване (`object-cover`).
 *
 * Ползва същите неизрязани размери: CSS-ът изрязва, а `wide`/`banner` са
 * с височина и Sharp ГИ УВЕЛИЧАВА при тясна снимка (има `10-2400x800.webp`
 * от оригинал 1254 px). Разтегнат файл е по-лош от намален.
 *
 * Съотношението в `width`/`height` е това на снимката — контейнерът е с
 * `aspect` и `object-cover`, така че числата служат само за запазване на
 * мястото преди зареждане.
 */
export const bannerImage = (value: MaybeMedia): ResponsiveImage | null => sectionImage(value)

