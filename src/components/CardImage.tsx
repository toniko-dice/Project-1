import Image from 'next/image'

/**
 * Снимката в продуктова карта — едно правило за всички карти.
 *
 * Изрязаният вариант (`trimmed`, без прозрачното поле около продукта) стои
 * с еднакво отстояние от 12 % от всяка страна и `object-contain` — така
 * продуктът заема еднаква площ във всяка карта, каквото и празно поле да е
 * имала оригиналната снимка (`src/lib/trim-image.ts`). По-дългата страна
 * на продукта опира в отстоянието.
 *
 * Снимка без такъв вариант (сцена, бял фон) се показва както досега — с
 * класовете, които картата подава в `className`.
 *
 * Родителят е `relative` и задава размера на полето.
 */
export const CardImage = ({
  src,
  alt,
  trimmed,
  sizes,
  eager = false,
  className = '',
  hover = true,
}: {
  src: string
  alt: string
  trimmed: boolean
  sizes: string
  eager?: boolean
  /** Класовете на снимка БЕЗ изрязан вариант — както беше в картата. */
  className?: string
  /** Леко увеличение при посочване на картата (`group`). */
  hover?: boolean
}) => {
  const zoom = hover ? 'transition-transform duration-300 group-hover:scale-105' : ''
  const image = (cls: string) => (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      loading={eager ? 'eager' : 'lazy'}
      className={`object-contain ${zoom} ${cls}`}
    />
  )

  if (!trimmed) return image(className)

  // Процентите на `inset` са спрямо височината (горе/долу) и ширината (ляво/дясно) — 12 % от всяка страна.
  return <span className="absolute inset-[12%] block">{image('')}</span>
}
