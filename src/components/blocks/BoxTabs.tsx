'use client'

import { useState } from 'react'

/**
 * Раздели над картите на „Какво има в кутията".
 *
 * Страница, която покрива няколко модела (RIVER 3 Plus / Max / Max Plus),
 * има различна кутия за всеки. Съдържанието на всички раздели е в HTML-а —
 * търсачката вижда и трите, а превключването е без заявка.
 *
 * Лентата е същата като при разделите на секцията с раздели: центрирана,
 * с черта под активния. Един раздел не се показва като лента — тогава
 * блокът изглежда както преди появата на разделите.
 */
export const BoxTabs = ({
  labels,
  panels,
  initial = 0,
}: {
  labels: string[]
  /** Готовите карти на всеки раздел — рендерират се на сървъра. */
  panels: React.ReactNode[]
  initial?: number
}) => {
  const [active, setActive] = useState(Math.min(Math.max(initial, 0), labels.length - 1))

  return (
    <div>
      {labels.length > 1 ? (
        <div
          role="tablist"
          aria-label="Модели"
          className="scroll-row scroll-row-center mb-8 border-b border-line"
        >
          {labels.map((label, i) => (
            <button
              key={i}
              role="tab"
              type="button"
              aria-selected={active === i}
              aria-controls={`box-panel-${i}`}
              onClick={() => setActive(i)}
              className={`-mb-px inline-flex min-h-12 cursor-pointer items-center whitespace-nowrap border-b-2 px-5 text-sm transition-colors duration-200 ${
                active === i
                  ? 'border-ink font-medium text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {panels.map((panel, i) => (
        <div key={i} id={`box-panel-${i}`} role="tabpanel" hidden={active !== i}>
          {panel}
        </div>
      ))}
    </div>
  )
}
