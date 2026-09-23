'use client'

import { useEffect, useState } from 'react'

export type Anchor = { id: string; label: string }

/**
 * Закачено меню по секциите на продукта.
 *
 * Точките са истински линкове към котви, не бутони с JavaScript — работят
 * при отваряне в нов таб и при изключен скрипт. Активната се следи с
 * IntersectionObserver, а не със слушане на всяко скролване.
 *
 * Плавното скролване и уважението към prefers-reduced-motion идват от
 * globals.css и не се дублират тук.
 *
 * Неактивните точки са с обикновения цвят на текста, не бледи. Това е
 * меню за навигация — при сив текст върху бял фон надписите се четат
 * трудно, а точките са единственият начин да се стигне до секция.
 */
export const ProductAnchorNav = ({ anchors }: { anchors: Anchor[] }) => {
  const [active, setActive] = useState<string>(anchors[0]?.id ?? '')

  useEffect(() => {
    if (!anchors.length) return

    const sections = anchors
      .map((a) => document.getElementById(a.id))
      .filter((el): el is HTMLElement => el !== null)

    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        // От пресичащите се секции взимаме най-горната — тя е тази, която се чете.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible[0]) setActive(visible[0].target.id)
      },
      {
        // Горната граница е под залепените ленти, за да не се активира
        // секция, която още е скрита зад тях.
        rootMargin: '-160px 0px -55% 0px',
        threshold: 0,
      },
    )

    sections.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [anchors])

  if (!anchors.length) return null

  return (
    <nav
      aria-label="Съдържание на страницата"
      className="sticky top-0 z-30 border-y border-line bg-surface/95 backdrop-blur"
    >
      <div className="container-site">
        {/*
          На широк екран точките стоят в центъра, както в оригинала. При
          препълване „safe center" се отказва от центрирането и лентата се
          скролва отляво — виж scroll-row-center в globals.css.
        */}
        <ul className="scroll-row scroll-row-center py-0">
          {anchors.map((a) => (
            <li key={a.id}>
              <a
                href={`#${a.id}`}
                aria-current={active === a.id ? 'true' : undefined}
                className={`inline-flex min-h-12 cursor-pointer items-center whitespace-nowrap border-b-2 px-4 text-sm transition-colors duration-200 ${
                  active === a.id
                    ? 'border-ink font-medium text-ink'
                    : 'border-transparent text-ink hover:text-ink-muted'
                }`}
              >
                {a.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
