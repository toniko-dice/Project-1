import type { ResponsiveImage } from '@/lib/media'

/**
 * Обикновен `<img>` за секционни снимки и банери.
 *
 * Нарочно НЕ е `next/image`. Размерите са готови при качването (виж
 * `Media.ts`), а оптимизаторът на Next прекодира всяка снимка с q=75 —
 * втора компресия върху вече компресиран webp, която се вижда на 4K
 * екран. Освен това всяка снимка минаваше през сървъра при първото
 * зареждане. Тук браузърът избира от нашите размери по `srcSet`/`sizes`
 * и тегли файла направо от Медия.
 *
 * `sizes` описва колко широка е снимката на екрана — както при
 * `next/image`. Без `srcSet` (един кандидат) атрибутът просто не се слага.
 */
export const SectionImage = ({
  image,
  sizes,
  className = '',
  priority = false,
  alt,
}: {
  image: ResponsiveImage
  sizes: string
  className?: string
  /** Първата снимка над сгъвката — без отложено зареждане. */
  priority?: boolean
  /** Замяна на alt от Медия, напр. името на раздела. */
  alt?: string
}) => (
  // eslint-disable-next-line @next/next/no-img-element -- нарочно без next/image, виж по-горе
  <img
    src={image.src}
    {...(image.srcSet ? { srcSet: image.srcSet, sizes } : {})}
    width={image.width}
    height={image.height}
    alt={alt ?? image.alt}
    loading={priority ? 'eager' : 'lazy'}
    decoding="async"
    {...(priority ? { fetchPriority: 'high' as const } : {})}
    className={className}
  />
)
