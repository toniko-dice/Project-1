'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Число, което се брои нагоре при първото влизане в екрана — веднъж.
 *
 * Сървърът рендерира крайната стойност („6 млн.+") — тя е в HTML-а за
 * търсачките и без скрипт. При влизане в екрана числото в стойността
 * (`countTo`) тръгва от 0; надписът около него остава („N млн.+"). Накрая
 * стои точно `value`. При `prefers-reduced-motion` — само крайната стойност.
 */
export const CountUp = ({ value, countTo }: { value: string; countTo?: number | null }) => {
  const ref = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState(value)

  useEffect(() => {
    const el = ref.current
    if (!el || !countTo || countTo <= 0) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    /*
      Числото в стойността може да е с разделител за хилядите — „60 000+"
      (интервал, неразделящ интервал или точка). Намира се по цифрите му и
      по време на броенето се пише със същия разделител: „37 421+", не
      „37421". Без съвпадение — само числото, както преди.
    */
    const marker = String(countTo)
    const намерено = (value.match(/\d(?:[\d\s\u00a0.]*\d)?/g) ?? []).find((m) => m.replace(/\D/g, '') === marker)
    const разделител = намерено?.match(/[\s\u00a0.]/)?.[0] ?? ''
    const формат = (n: number) => (разделител ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, разделител) : String(n))
    const text = (n: number) => (намерено ? value.replace(намерено, формат(n)) : String(n))
    let frame = 0

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        observer.disconnect()
        const start = performance.now()
        const DURATION = 1600
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / DURATION)
          // Забавяне към края — последните числа се четат.
          const eased = 1 - Math.pow(1 - t, 3)
          if (t < 1) {
            setShown(text(Math.round(eased * countTo)))
            frame = requestAnimationFrame(step)
          } else {
            setShown(value)
          }
        }
        setShown(text(0))
        frame = requestAnimationFrame(step)
      },
      { threshold: 0.4 },
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [value, countTo])

  return (
    <span ref={ref} className="tabular">
      {shown}
    </span>
  )
}
