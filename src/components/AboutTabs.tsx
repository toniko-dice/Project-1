'use client'

import { type KeyboardEvent, type ReactNode, useId, useRef, useState } from 'react'

/**
 * Табове-хапчета на „Табове с продукти". Съдържанието на ВСИЧКИ табове е в
 * HTML-а (за търсачките); неактивните са скрити с `hidden`. Стрелките
 * местят избора (ARIA tabs, автоматично активиране).
 */
export const AboutTabs = ({ labels, panels }: { labels: string[]; panels: ReactNode[] }) => {
  const [active, setActive] = useState(0)
  const id = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const select = (i: number) => {
    const n = (i + labels.length) % labels.length
    setActive(n)
    refs.current[n]?.focus()
  }

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const move: Record<string, number> = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: labels.length - 1 }
    if (!(e.key in move)) return
    e.preventDefault()
    select(move[e.key]!)
  }

  return (
    <>
      <div
        role="tablist"
        aria-label="Продукти"
        className="-mx-4 mb-6 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:mb-8 md:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {labels.map((label, i) => (
          <button
            key={i}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={i === active}
            aria-controls={`${id}-panel-${i}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={onKey}
            className={`h-10 shrink-0 cursor-pointer whitespace-nowrap rounded-full px-5 text-sm font-medium transition-colors duration-200 md:h-11 md:px-6 md:text-base ${
              i === active ? 'bg-black text-white' : 'bg-[#f2f2f2] text-[#555] hover:bg-[#e6e6e6]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {panels.map((panel, i) => (
        <div key={i} role="tabpanel" id={`${id}-panel-${i}`} aria-labelledby={`${id}-tab-${i}`} hidden={i !== active}>
          {panel}
        </div>
      ))}
    </>
  )
}
