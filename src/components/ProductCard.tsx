import { Star, StarHalf } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'

import type { Product } from '@/payload-types'
import { formatBgn, formatEur } from '@/lib/format'
import { productCardData } from '@/lib/media'
import { productPath } from '@/lib/urls'
import { BuyButton } from './BuyButton'
import { CardImage } from './CardImage'
import { ImagePlaceholder } from './ImagePlaceholder'

/**
 * Звездички с брой отзиви.
 *
 * Рисуват се САМО когато и оценката, и броят са попълнени. Празни звезди
 * при липса на отзиви изглеждат като лоша оценка, а не като липса на
 * данни — затова редът просто отсъства.
 */
const Rating = ({ rating, count }: { rating: number; count: number }) => {
  const цели = Math.floor(rating)
  const половин = rating - цели >= 0.25 && rating - цели < 0.75
  const закръглени = rating - цели >= 0.75 ? цели + 1 : цели

  return (
    <p
      className="flex items-center gap-1 text-xs text-ink-muted"
      aria-label={`Оценка ${rating} от 5 при ${count} отзива`}
    >
      <span className="flex text-ink" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => {
          if (i < закръглени) return <Star key={i} size={13} weight="fill" />
          if (i === закръглени && половин) return <StarHalf key={i} size={13} weight="fill" />
          return <Star key={i} size={13} className="text-line-strong" />
        })}
      </span>
      <span aria-hidden="true">({count})</span>
    </p>
  )
}

/**
 * Продуктова карта — единствената; ползват я категориите, разделите на
 * серия, каруселите, редовете под банерите, търсенето, „Свързани" и
 * „Аксесоари".
 *
 * Бяла карта без рамка върху сивия фон на страницата — както в оригинала.
 *
 * Бутонът към магазина е същият `BuyButton` като на продуктовата
 * страница, в размер `md`. Собственикът го върна (веднъж беше махнат, за
 * да не дърпат пет черни бутона погледа от продуктите).
 *
 * Картата НЕ е един линк. Бутонът е отделен линк, а `<a>` в `<a>` е
 * невалиден HTML: браузърът затваря външния линк преди вътрешния и
 * картата се разпада. Затова обвивката е `article`, снимката и текстът са
 * един линк към страницата, бутонът — втори, под тях.
 *
 * Бутоните в един ред са на една линия: картата е `h-full` + flex,
 * линкът с текста се разтяга (`flex-1`), а бутонът стои в дъното.
 */
export const ProductCard = ({
  product,
  showBgn = true,
  className = '',
  eager = false,
}: {
  product: Product
  showBgn?: boolean
  className?: string
  /** Първите карти в списък — над сгъвката, едната е LCP; без отлагане. */
  eager?: boolean
}) => {
  // Всичко идва от продукта през общия помощник — същото като в менюто.
  const data = productCardData(product)

  const rating = typeof product.rating === 'number' ? product.rating : null
  const reviews = typeof product.reviewCount === 'number' ? product.reviewCount : null

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-xl bg-surface p-4 transition-shadow duration-200 hover:shadow-md ${className}`}
    >
      <Link href={productPath(product)} className="flex flex-1 cursor-pointer flex-col">
        {/*
          Снимката стои на бял фон, центрирана. Изрез с прозрачен фон е без
          празното си поле и с еднакво отстояние — `CardImage`.
        */}
        <div className="relative h-48 w-full sm:h-60">
          {data.imageUrl ? (
            <CardImage
              src={data.imageUrl}
              alt={data.imageAlt}
              trimmed={data.imageTrimmed}
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw"
              eager={eager}
            />
          ) : (
            <ImagePlaceholder className="absolute inset-0 rounded-lg" />
          )}
        </div>

        <div className="mt-4 flex flex-1 flex-col gap-1">
          {/* Етикетът е НАД името, в оранжево — не в ъгъла върху снимката. */}
          {/* Собствената карта на продукта показва неговия етикет. */}
          {data.badge ? <p className="text-sm text-flame">{data.badge}</p> : null}

          <h3 className="text-[17px] font-medium leading-snug">{data.title}</h3>

          {data.tagline ? (
            <p className="line-clamp-2 text-sm leading-snug text-ink-muted">{data.tagline}</p>
          ) : null}

          <div className="mt-auto pt-3">
            <p className="flex flex-wrap items-baseline gap-2">
              {/*
                Без „от": всеки продукт е с една цена. Ако някога дойде продукт
                с варианти на различни цени, „от" се връща като изрично поле на
                продукта — не автоматично за всички.
              */}
              <span className="tabular font-semibold">{formatEur(product.price)}</span>
              {data.comparePrice ? (
                <s className="tabular text-sm text-ink-muted">{formatEur(data.comparePrice)}</s>
              ) : null}
            </p>

            {showBgn ? (
              <p className="tabular mt-0.5 text-xs text-ink-muted">{formatBgn(product.price)}</p>
            ) : null}

            {rating !== null && reviews !== null ? (
              <div className="mt-1">
                <Rating rating={rating} count={reviews} />
              </div>
            ) : null}
          </div>
        </div>
      </Link>

      <BuyButton product={product} size="md" className="mt-4" />
    </article>
  )
}
