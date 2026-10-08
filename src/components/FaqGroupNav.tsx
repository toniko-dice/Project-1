'use client'

import { useEffect, useState } from 'react'

export type FaqNavItem = { id: string; label: string; count: number }

/**
 * Лентата с групите на `/vaprosi` (`task-vaprosi-lenta-6-grupi.md`) — до 6
 * хапчета с броя въпроси, всички видими винаги:
 *
 * - компютър: в един ред, центрирани, лепнат под хедъра;
 * - телефон: пренасят се на 2–3 реда (`flex-wrap`), без хоризонтален скрол
 *   и без да лепне — би заемал половината екран.
 *
 * Активна (черна) е последната група, чийто връх е минал под лентата; в
 * края на страницата — последната. Пресмята се при скрол, веднъж на кадър —
 * както `ProductAnchorNav`.
 */
export const FaqGroupNav = ({ items }: { items: FaqNavItem[] }) => {
  const [active, setActive] = useState(items[0]?.id ?? '')

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const sections = items
        .map((i) => document.getElementById(i.id))
        .filter((el): el is HTMLElement => el !== null && !el.hidden)
      if (!sections.length) return
      const doc = document.documentElement
      if (window.innerHeight + window.scrollY >= doc.scrollHeight - 2) {
        setActive(sections[sections.length - 1]!.id)
        return
      }
      /*
        Линията е малко под мястото, където спира секцията след клик
        (`scroll-mt-40` = 160 px на компютър, `scroll-mt-24` = 96 на
        телефон) — иначе кликнатият бутон не става активен.
      */
      const линия = window.matchMedia('(min-width: 768px)').matches ? 176 : 112
      let current = sections[0]!.id
      for (const el of sections) {
        if (el.getBoundingClientRect().top <= линия) current = el.id
        else break
      }
      setActive(current)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [items])

  if (!items.length) return null

  return (
    <nav
      aria-label="Групи въпроси"
      className="z-30 mt-4 border-y border-line bg-surface/95 backdrop-blur md:sticky md:top-[var(--header-offset,0px)]"
    >
      {/* Телефон: решетка 2 × 3 — всичко се вижда, без скрол. Компютър: един ред, центрирано. */}
      <ul className="container-site grid grid-cols-2 gap-2 py-3 md:flex md:flex-wrap md:justify-center">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              onClick={() => setActive(i.id)}
              aria-current={active === i.id ? 'true' : undefined}
              className={`flex min-h-11 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-[13px] transition-colors duration-200 md:inline-flex md:px-4 md:text-sm ${
                active === i.id
                  ? 'border-ink bg-ink font-medium text-white'
                  : 'border-line bg-surface text-ink hover:border-ink'
              }`}
            >
              {i.label}
              <span className={`text-xs tabular ${active === i.id ? 'text-white/70' : 'text-ink-muted'}`}>· {i.count}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
