import type { ResponsiveImage } from '@/lib/media'

/**
 * Прозрачен GIF 1×1 — „нищо" за `<source>` на скритата снимка. Data адрес:
 * браузърът не прави заявка.
 */
const ПРАЗНО = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='

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
 *
 * **`hideAt`** — медийна заявка, при която снимката е скрита (двойката
 * „за телефон / за компютър"). Тогава тя е в `<picture>` с празен източник
 * за тази заявка и браузърът изобщо не я тегли. До 7 октомври 2026 скритата
 * получаваше `sizes="… 1px"` — браузърът взимаше най-малкия кандидат, но
 * пак го теглеше, а снимка с един кандидат (без `srcSet`) — в пълен размер.
 * На телефон ръководството и „За EcoFlow" теглеха и двете снимки на героя,
 * и двете с висок приоритет. `display: contents` — обвивката не прави
 * кутия и класовете на `<img>` работят както без нея.
 */
export const SectionImage = ({
  image,
  sizes,
  className = '',
  priority = false,
  alt,
  hideAt,
}: {
  image: ResponsiveImage
  sizes: string
  className?: string
  /** Първата снимка над сгъвката — без отложено зареждане. */
  priority?: boolean
  /** Замяна на alt от Медия, напр. името на раздела. */
  alt?: string
  /** Медийна заявка, при която снимката е скрита и не се тегли. */
  hideAt?: string
}) => {
  const img = (
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
  if (!hideAt) return img
  return (
    <picture className="contents">
      <source media={hideAt} srcSet={ПРАЗНО} />
      {img}
    </picture>
  )
}

/** Заявките за двойките снимки — същите граници като класовете `sm:`/`md:`. */
export const ОТ_SM = '(min-width: 640px)'
export const ДО_SM = '(max-width: 639.98px)'
export const ОТ_MD = '(min-width: 768px)'
export const ДО_MD = '(max-width: 767.98px)'
