'use client'

import { useEffect, useRef } from 'react'

/**
 * Колона с линкове във футъра — акордеон на телефон, отворена колона от
 * 768 px нагоре.
 *
 * `details`/`summary` работят и без скрипт. На компютър колоната е винаги
 * отворена: нов браузър я показва още от CSS-а (`.footer-col::details-content`
 * в globals.css), а по-стар — щом скриптът сложи `open`. Заглавието там не
 * се натиска (`md:pointer-events-none`), за да не се затвори колоната.
 */
export const FooterColumn = ({ heading, children }: { heading: string; children: React.ReactNode }) => {
  const ref = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const sync = () => {
      if (ref.current) ref.current.open = mq.matches
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return (
    <details ref={ref} className="footer-col group border-b border-line md:border-0">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 md:pointer-events-none md:mb-3 md:min-h-0 md:cursor-auto [&::-webkit-details-marker]:hidden">
        <h3 className="text-sm font-semibold">{heading}</h3>
        <span aria-hidden="true" className="text-lg leading-none text-ink-muted transition-transform duration-200 group-open:rotate-45 md:hidden">
          +
        </span>
      </summary>
      {children}
    </details>
  )
}
