'use client'

import { CaretLeft, CaretRight, X } from '@phosphor-icons/react/dist/ssr'
import Image from 'next/image'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export type LightboxImage = { url: string; thumbUrl: string; alt: string }

/**
 * Уголемена снимка на цял екран.
 *
 * Бял фон, снимката в средата, лента с миниатюри отдолу — както в
 * оригинала. Наслагването се рендерира през портал в `body`, за да не го
 * реже `overflow`/`rounded` на галерията и за да стои над залепеното меню.
 *
 * Прелистването използва същата техника като галерията: лентата е
 * скролваща със `scroll-snap`, тоест плъзгането с пръст работи само по
 * себе си. Стрелките и клавишите само викат `scrollTo` — няма
 * самоделно разпознаване на жестове.
 *
 * Индексът се държи от галерията, не тук. Така при затваряне галерията
 * остава на снимката, до която е стигнал потребителят.
 */
export const Lightbox = ({
  images,
  index,
  onIndex,
  onClose,
}: {
  images: LightboxImage[]
  index: number
  onIndex: (next: number) => void
  onClose: () => void
}) => {
  const trackRef = useRef<HTMLDivElement>(null)
  const thumbsRef = useRef<(HTMLButtonElement | null)[]>([])
  const isProgrammatic = useRef(false)
  // Прихваща се веднъж при отваряне — при прелистване не бива да се мени.
  const startIndex = useRef(index)

  /** Мести лентата към дадена снимка. */
  const scrollTo = (next: number, smooth: boolean) => {
    const track = trackRef.current
    if (!track) return
    isProgrammatic.current = true
    track.scrollTo({ left: next * track.clientWidth, behavior: smooth ? 'smooth' : 'auto' })
    window.setTimeout(() => {
      isProgrammatic.current = false
    }, smooth ? 400 : 60)
  }

  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(images.length - 1, next))
    if (clamped === index) return
    onIndex(clamped)
    scrollTo(clamped, true)
  }

  /*
    Отваряне: лентата застава на снимката, от която е тръгнал потребителят.

    useLayoutEffect, не useEffect — местенето трябва да стане преди
    рисуването, иначе за миг се показва първата снимка. Компонентът се
    рендерира само в браузъра, така че тук няма предупреждение от сървъра.
  */
  useLayoutEffect(() => {
    scrollTo(startIndex.current, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Страницата отдолу не се скролва, докато наслагването е отворено. */
  useEffect(() => {
    const preden = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = preden
    }
  }, [])

  /*
    Клавишите се слушат на прозореца, не на самото наслагване. Иначе
    Esc спира да работи в мига, в който фокусът стъпи върху миниатюра.
  */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        go(index + 1)
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        go(index - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  /* Плъзгане с пръст — индексът следва позицията на лентата. */
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    let frame = 0
    const onScroll = () => {
      if (isProgrammatic.current) return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const width = track.clientWidth || 1
        onIndex(Math.round(track.scrollLeft / width))
      })
    }

    track.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      track.removeEventListener('scroll', onScroll)
    }
  }, [onIndex])

  /* Смяна на размера на прозореца разминава лентата с индекса. */
  useEffect(() => {
    const onResize = () => scrollTo(index, false)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  })

  /* Активната миниатюра е винаги видима. */
  useEffect(() => {
    thumbsRef.current[index]?.scrollIntoView({ inline: 'nearest', block: 'nearest' })
  }, [index])

  if (typeof document === 'undefined' || !images.length) return null

  const кръг =
    'flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-ink-muted text-white transition-opacity duration-200 hover:bg-ink disabled:cursor-default disabled:opacity-30 disabled:hover:bg-ink-muted'

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Снимка на продукта, уголемена"
      className="fade-in fixed inset-0 z-50 flex flex-col bg-page"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Затваряне"
        // Фокусът влиза тук при отваряне — първият елемент в наслагването.
        autoFocus
        className={`absolute right-4 top-4 z-10 ${кръг}`}
      >
        <X size={18} weight="bold" aria-hidden="true" />
      </button>

      {/* min-h-0 позволява на лентата да се свие; иначе flex-1 я разпъва извън екрана. */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={trackRef}
          className="flex h-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((img, i) => (
            /*
              Клик встрани от снимката затваря. Клик върху самата снимка —
              не: там потребителят я разглежда и случайно затваряне дразни.
            */
            <div
              key={i}
              onClick={onClose}
              className="flex h-full w-full shrink-0 snap-start items-center justify-center p-4 sm:p-10"
            >
              <span
                onClick={(e) => e.stopPropagation()}
                className="relative block h-full w-full max-w-6xl"
              >
                <Image
                  src={img.url}
                  alt={img.alt}
                  fill
                  sizes="92vw"
                  /*
                    Съседните две се теглят предварително — иначе при
                    прелистване се вижда празно място, докато се зареждат.
                  */
                  loading={Math.abs(i - index) <= 1 ? 'eager' : 'lazy'}
                  className="object-contain"
                />
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="Предишна снимка"
          className={`absolute left-4 top-1/2 -translate-y-1/2 ${кръг}`}
        >
          <CaretLeft size={18} weight="bold" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === images.length - 1}
          aria-label="Следваща снимка"
          className={`absolute right-4 top-1/2 -translate-y-1/2 ${кръг}`}
        >
          <CaretRight size={18} weight="bold" aria-hidden="true" />
        </button>
      </div>

      {images.length > 1 ? (
        <div className="shrink-0 border-t border-line">
          {/*
            На телефон лентата се скролва с пръст; на широк екран стои в центъра.

            „scroll-row-center" дава „justify-content: safe center", не
            обикновено „center". При обикновеното центриране преливащото
            съдържание излиза извън началото на скрола и първите миниатюри
            стават недостижими — на 390 px това са първите три.
          */}
          <div className="scroll-row-center flex gap-2 overflow-x-auto px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {images.map((img, i) => (
              <button
                key={i}
                ref={(el) => {
                  thumbsRef.current[i] = el
                }}
                type="button"
                onClick={() => go(i)}
                aria-label={`Снимка ${i + 1} от ${images.length}`}
                aria-current={i === index ? 'true' : undefined}
                className={`relative size-20 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 bg-page transition-colors duration-200 ${
                  i === index ? 'border-info' : 'border-line hover:border-line-strong'
                }`}
              >
                <Image
                  src={img.thumbUrl}
                  alt=""
                  fill
                  sizes="80px"
                  loading="lazy"
                  className="object-cover p-0.5"
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  )
}
