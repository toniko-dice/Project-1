import { Star, StarHalf } from '@phosphor-icons/react/dist/ssr'
import Image from 'next/image'
import Link from 'next/link'

import type { Product } from '@/payload-types'
import { AVAILABILITY_LABELS, formatBgn, formatEur } from '@/lib/format'
import { productCardData } from '@/lib/media'
import { productPath } from '@/lib/urls'
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
 * Продуктова карта.
 *
 * Бяла карта без рамка върху сивия фон на страницата — както в оригинала.
 * Цялата карта е един линк към продуктовата страница; черният бутон
 * „Купи сега" беше махнат, защото в реда с пет карти пет черни бутона
 * дърпат погледа повече от самите продукти.
 */
export const ProductCard = ({
  product,
  showBgn = true,
  className = '',
}: {
  product: Product
  showBgn?: boolean
  className?: string
}) => {
  // Всичко идва от продукта през общия помощник — същото като в менюто.
  const data = productCardData(product)
  const soldOut = product.availability === 'out-of-stock'

  const rating = typeof product.rating === 'number' ? product.rating : null
  const reviews = typeof product.reviewCount === 'number' ? product.reviewCount : null

  return (
    <Link
      href={productPath(product)}
      className={`group flex cursor-pointer flex-col overflow-hidden rounded-xl bg-surface p-4 transition-shadow duration-200 hover:shadow-md ${className}`}
    >
      {/* Снимката стои на бял фон, центрирана, без изрязване. */}
      <div className="relative h-48 w-full sm:h-60">
        {data.imageUrl ? (
          <Image
            src={data.imageUrl}
            alt={data.imageAlt}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw"
            loading="lazy"
            className="object-contain transition-transform duration-300 group-hover:scale-105"
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
            <span className="tabular font-semibold">от {formatEur(product.price)}</span>
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

          {soldOut ? (
            <p className="mt-2 text-xs font-medium text-ink-muted">
              {AVAILABILITY_LABELS[product.availability ?? 'in-stock']}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
