'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

import { formatEur } from '@/lib/format'
import type { Product } from '@/payload-types'
import { BuyButton } from './BuyButton'

/**
 * Лепнеща лента най-долу на продуктовата страница — само на телефон
 * (`task-mobilna-optimizaciya.md`, т. 4): малка снимка, името на един
 * ред, цената и бутонът (надписът следва наличността — `BuyButton`).
 *
 * Показва се, щом истинският бутон (`#kupi`) е излязъл НАГОРЕ от екрана, и
 * се скрива, когато той е видим или когато се вижда футърът — там лентата
 * само би закрила линковете. Скритата е `inert`: не се стига до нея с Tab.
 */
export const StickyBuyBar = ({
  title,
  imageUrl,
  price,
  comparePrice,
  product,
}: {
  title: string
  imageUrl: string | null
  price: number
  comparePrice?: number | null
  product: Pick<Product, 'availability' | 'externalUrl' | 'ctaLabel'>
}) => {
  const [минат, setМинат] = useState(false)
  const [футър, setФутър] = useState(false)

  useEffect(() => {
    const бутон = document.getElementById('kupi')
    const footer = document.querySelector('body > footer, footer')
    if (!бутон) return
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === бутон) setМинат(!e.isIntersecting && e.boundingClientRect.top < 0)
        else setФутър(e.isIntersecting)
      }
    })
    io.observe(бутон)
    if (footer) io.observe(footer)
    return () => io.disconnect()
  }, [])

  const видима = минат && !футър

  return (
    <div
      inert={!видима}
      aria-hidden={!видима}
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] transition-transform duration-200 md:hidden ${
        видима ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="container-site flex h-16 items-center gap-3">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            width={44}
            height={44}
            className="size-11 shrink-0 rounded bg-tile object-contain"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">{title}</p>
          <p className="tabular mt-0.5 text-sm leading-tight">
            <span className="font-semibold">{formatEur(price)}</span>
            {comparePrice ? (
              <s className="ml-1.5 text-xs text-ink-muted">{formatEur(comparePrice)}</s>
            ) : null}
          </p>
        </div>
        <BuyButton product={product} size="sm" label="Купи" className="shrink-0 px-4!" />
      </div>
    </div>
  )
}
