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

    const marker = String(countTo)
    const text = (n: number) => (value.includes(marker) ? value.replace(marker, String(n)) : String(n))
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
