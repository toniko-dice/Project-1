'use client'

import { CaretLeft, CaretRight } from '@phosphor-icons/react/dist/ssr'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Хоризонтална лента — общата основа на всички ленти по началната страница.
 *
 * Ползва се от лентата с категории, продуктовия карусел и лентата с банери.
 * Една реализация, за да не се разминават поведението и стрелките на трите
 * места.
 *
 * Плъзгането с ПРЪСТ е нативен скрол със `scroll-snap` — браузърът го прави
 * по-добре от всяко разпознаване на жестове и работи заедно с трекпад и
 * колело. Тук е добавено само плъзгането с МИШКА, което браузърът не дава.
 *
 * Стрелките се показват само когато има накъде — а това зависи от ширината
 * на екрана и от броя карти, тоест не се знае от сървъра. Затова
 * компонентът е клиентски.
 */
export const ScrollRow = ({
  label,
  className = '',
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) => {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canBack, setCanBack] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const [dragging, setDragging] = useState(false)

  /** Състояние на текущото влачене; `null`, когато не се влачи. */
  const drag = useRef<{ startX: number; startScroll: number; moved: boolean } | null>(null)
  /** Влаченето завършва с „click" върху картата — този клик се преглъща. */
  const swallowClick = useRef(false)

  const measure = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const max = track.scrollWidth - track.clientWidth
    // Един пиксел допуск — при мащабиране на браузъра числата не са цели.
    setCanBack(track.scrollLeft > 1)
    setCanNext(track.scrollLeft < max - 1)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    measure()
    track.addEventListener('scroll', measure, { passive: true })

    // Броят карти и ширината на екрана се менят — само scroll не стига.
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    for (const child of Array.from(track.children)) observer.observe(child)

    return () => {
      track.removeEventListener('scroll', measure)
      observer.disconnect()
    }
  }, [measure])

  const nudge = (direction: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    // Скача с по-малко от екран, за да остане видима връзка с предишното.
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: 'smooth' })
  }

  /*
    Влачене с мишка.

    `scroll-snap` се изключва за времето на влаченето: иначе всяко местене на
    `scrollLeft` се дърпа обратно към най-близката точка и лентата трепери.
    След пускане се връща и картата застава на място.
  */
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Пръстът и писалката си имат нативен скрол — не се месим.
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    const track = trackRef.current
    if (!track) return

    drag.current = { startX: e.clientX, startScroll: track.scrollLeft, moved: false }
    setDragging(true)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current
    if (!drag.current || !track) return

    const dx = e.clientX - drag.current.startX

    // Под пет пиксела е трепване на ръката, не влачене — кликът остава клик.
    if (!drag.current.moved && Math.abs(dx) > 5) {
      drag.current.moved = true
      /*
        Прихващането държи движението, дори когато курсорът излезе извън
        лентата. Може да откаже (показалецът вече е пуснат, синтетично
        събитие) — тогава влаченето продължава без него, вместо да гръмне.
      */
      try {
        track.setPointerCapture(e.pointerId)
      } catch {
        // Няма прихващане — влаченето работи, докато курсорът е върху лентата.
      }
    }

    if (drag.current.moved) {
      e.preventDefault()
      track.scrollLeft = drag.current.startScroll - dx
    }
  }

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current
    if (!drag.current || !track) return

    if (drag.current.moved) {
      swallowClick.current = true
      try {
        if (track.hasPointerCapture(e.pointerId)) track.releasePointerCapture(e.pointerId)
      } catch {
        // Вече пуснат.
      }
    }

    drag.current = null
    setDragging(false)
  }

  const arrow =
    'absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-tile text-ink shadow-sm transition-colors duration-200 hover:bg-tile-hover sm:flex'

  return (
    <div className="relative">
      <div
        ref={trackRef}
        role="group"
        aria-label={label}
        // Стрелките на клавиатурата работят, когато лентата е на фокус.
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') {
            e.preventDefault()
            nudge(1)
          }
          if (e.key === 'ArrowLeft') {
            e.preventDefault()
            nudge(-1)
          }
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        // Влаченето свършва върху карта и браузърът праща „click" — гълтаме го.
        onClickCapture={(e) => {
          if (!swallowClick.current) return
          swallowClick.current = false
          e.preventDefault()
          e.stopPropagation()
        }}
        // Иначе мишката „хваща" снимката и влачи нея вместо лентата.
        onDragStart={(e) => e.preventDefault()}
        style={dragging ? { scrollSnapType: 'none', userSelect: 'none' } : undefined}
        className={`${className} ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {children}
      </div>

      {canBack ? (
        <button
          type="button"
          onClick={() => nudge(-1)}
          aria-label="Назад"
          className={`${arrow} left-0`}
        >
          <CaretLeft size={18} weight="bold" aria-hidden="true" />
        </button>
      ) : null}

      {canNext ? (
        <button
          type="button"
          onClick={() => nudge(1)}
          aria-label="Напред"
          className={`${arrow} right-0`}
        >
          <CaretRight size={18} weight="bold" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}
