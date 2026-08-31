import Image from 'next/image'
import Link from 'next/link'

import type { Product } from '@/payload-types'
import { AVAILABILITY_LABELS, BADGE_LABELS, discountPercent, formatBgn, formatEur } from '@/lib/format'
import { mediaAlt, mediaUrl } from '@/lib/media'

export const ProductCard = ({
  product,
  showBgn = true,
  className = '',
}: {
  product: Product
  showBgn?: boolean
  className?: string
}) => {
  const img = mediaUrl(product.image, 'card')
  const discount = discountPercent(product.price, product.compareAtPrice)
  const soldOut = product.availability === 'out-of-stock'

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-lg border border-line bg-surface transition-shadow duration-200 hover:shadow-md ${className}`}
    >
      <div className="relative aspect-square bg-tile">
        {img ? (
          <Image
            src={img}
            alt={mediaAlt(product.image)}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw"
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}

        {product.badge && product.badge !== 'none' ? (
          <span
            className={`absolute left-2 top-2 rounded px-2 py-1 text-[11px] font-semibold tracking-wide ${
              product.badge === 'sale'
                ? 'bg-accent text-white'
                : 'bg-ink text-white'
            }`}
          >
            {BADGE_LABELS[product.badge]}
          </span>
        ) : null}

        {discount ? (
          <span className="absolute right-2 top-2 rounded bg-accent px-2 py-1 text-[11px] font-semibold text-white">
            −{discount}%
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="text-sm font-semibold leading-snug">{product.title}</h3>

        {product.tagline ? (
          <p className="text-xs leading-relaxed text-ink-muted">{product.tagline}</p>
        ) : null}

        <div className="mt-auto pt-3">
          <div className="flex items-baseline gap-2">
            <span className="tabular text-base font-bold">{formatEur(product.price)}</span>
            {product.compareAtPrice ? (
              <s className="tabular text-xs text-ink-muted">
                {formatEur(product.compareAtPrice)}
              </s>
            ) : null}
          </div>

          {showBgn ? (
            <p className="tabular mt-0.5 text-[11px] text-ink-muted">
              {formatBgn(product.price)}
            </p>
          ) : null}

          {soldOut ? (
            <p className="mt-2 text-xs font-medium text-ink-muted">
              {AVAILABILITY_LABELS[product.availability ?? 'in-stock']}
            </p>
          ) : (
            <Link
              href={product.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand"
            >
              {product.ctaLabel ?? 'Купи сега'}
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
