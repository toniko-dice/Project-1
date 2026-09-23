'use client'

import { CaretLeft, CaretRight } from '@phosphor-icons/react/dist/ssr'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import { Lightbox } from './Lightbox'

/**
 * Трите адреса са на една и съща снимка в три размера:
 *  - `url`      — за галерията на страницата
 *  - `fullUrl`  — оригиналът, за уголемяването на цял екран
 *  - `thumbUrl` — за лентата с миниатюри под уголемената снимка
 */
export type GalleryImage = { url: string; fullUrl: string; thumbUrl: string; alt: string }

/**
 * Продуктова галерия.
 *
 * На телефон се плъзга с пръст — самата лента е скролваща и снимките се
 * захващат със `scroll-snap`. На широк екран същата лента се управлява със
 * стрелки, с чертичките отдолу и с клавиатурата.
 *
 * Няма безкраен цикъл: на първата снимка стрелката назад изчезва, на
 * последната — напред.
 *
 * Клик върху снимката я отваря на цял екран. Индексът се държи тук и се
 * споделя с наслагването, затова при затваряне галерията остава на
 * снимката, до която е стигнал потребителят.
 */
export const ProductGallery = ({ images }: { images: GalleryImage[] }) => {
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const isProgrammatic = useRef(false)

  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(images.length - 1, next))
    setIndex(clamped)

    const track = trackRef.current
    if (!track) return
    isProgrammatic.current = true
    track.scrollTo({ left: clamped * track.clientWidth, behavior: 'smooth' })
    // Плъзгането отвътре не бива да връща индекса назад, докато траe анимацията.
    window.setTimeout(() => {
      isProgrammatic.current = false
    }, 400)
  }

  /*
    Затваряне на уголемяването.

    Лентата долу се мести на снимката, гледана горе, и фокусът се връща
    върху нея — иначе след затваряне фокусът пада на `body` и следващият
    Tab тръгва от началото на страницата.
  */
  const closeLightbox = () => {
    setOpen(false)

    const track = trackRef.current
    if (!track) return
    isProgrammatic.current = true
    track.scrollTo({ left: index * track.clientWidth })
    window.setTimeout(() => {
      isProgrammatic.current = false
    }, 200)
    track.focus()
  }

  // Плъзгане с пръст — индексът следва позицията на лентата.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    let frame = 0
    const onScroll = () => {
      if (isProgrammatic.current) return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const width = track.clientWidth || 1
        setIndex(Math.round(track.scrollLeft / width))
      })
    }

    track.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      track.removeEventListener('scroll', onScroll)
    }
  }, [])

  if (!images.length) return null

  const single = images.length === 1

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <div
          ref={trackRef}
          role="group"
          aria-roledescription="карусел"
          aria-label="Снимки на продукта. Enter уголемява снимката."
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') {
              e.preventDefault()
              go(index + 1)
            }
            if (e.key === 'ArrowLeft') {
              e.preventDefault()
              go(index - 1)
            }
            // Лентата е фокусируемият елемент, затова уголемяването виси тук.
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setOpen(true)
            }
          }}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-xl bg-tile [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((img, i) => (
            <div
              key={i}
              onClick={() => setOpen(true)}
              className="relative aspect-square w-full shrink-0 cursor-zoom-in snap-start"
              aria-label={`Снимка ${i + 1} от ${images.length}`}
            >
              <Image
                src={img.url}
                alt={img.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                // Само първата снимка се дърпа веднага — деветте наведнъж
                // забавят чувствително първото зареждане.
                priority={i === 0}
                loading={i === 0 ? undefined : 'lazy'}
                className="object-contain p-6"
              />
            </div>
          ))}
        </div>

        {!single && index > 0 ? (
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Предишна снимка"
            className="absolute left-3 top-1/2 hidden size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/80 backdrop-blur transition-colors duration-200 hover:bg-white sm:flex"
          >
            <CaretLeft size={18} weight="bold" aria-hidden="true" />
          </button>
        ) : null}

        {!single && index < images.length - 1 ? (
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Следваща снимка"
            className="absolute right-3 top-1/2 hidden size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/80 backdrop-blur transition-colors duration-200 hover:bg-white sm:flex"
          >
            <CaretRight size={18} weight="bold" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {!single ? (
        <div className="flex justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Снимка ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
              className="group flex h-11 cursor-pointer items-center px-1"
            >
              <span
                className={`block h-0.5 w-6 rounded-full transition-colors duration-200 ${
                  i === index ? 'bg-ink' : 'bg-line group-hover:bg-line-strong'
                }`}
              />
            </button>
          ))}
        </div>
      ) : null}

      {open ? (
        <Lightbox
          images={images.map((img) => ({
            url: img.fullUrl,
            thumbUrl: img.thumbUrl,
            alt: img.alt,
          }))}
          index={index}
          onIndex={setIndex}
          onClose={closeLightbox}
        />
      ) : null}
    </div>
  )
}
