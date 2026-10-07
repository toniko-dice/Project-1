'use client'

import { useEffect, useRef, useState } from 'react'

import { useScrollEdges } from './useScrollEdges'

export type Anchor = { id: string; label: string }

/**
 * Закачено меню по секциите на продукта.
 *
 * Точките са истински линкове към котви, не бутони с JavaScript — работят
 * при отваряне в нов таб и при изключен скрипт.
 *
 * Активна е последната секция, чийто връх е минал под лентата — тоест
 * най-горната във видимата част; в края на страницата — последната.
 * Пресмята се при скролване (веднъж на кадър), не с IntersectionObserver:
 * той съобщава само секциите, които току-що са влезли или излезли, и на
 * ръководството „Въпроси" никога не светваше — активен оставаше
 * „Продукти", а последната секция не стигаше до горната зона изобщо.
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
  const rowRef = useRef<HTMLUListElement>(null)
  const edge = useScrollEdges(rowRef)

  /*
    Активната точка се вижда винаги: на телефон лентата е по-широка от
    екрана и без това активната оставаше отрязана вдясно. Мести се САМО
    лентата (`scrollTo` на нея), не страницата — `scrollIntoView` би
    дръпнал и прозореца по средата на скрола.
  */
  useEffect(() => {
    const row = rowRef.current
    const link = row?.querySelector<HTMLElement>(`a[href="#${CSS.escape(active)}"]`)
    if (!row || !link || row.scrollWidth <= row.clientWidth) return
    const център = link.offsetLeft + link.offsetWidth / 2 - row.clientWidth / 2
    row.scrollTo({ left: Math.max(0, център), behavior: 'smooth' })
  }, [active])

  useEffect(() => {
    if (!anchors.length) return

    const sections = anchors
      .map((a) => document.getElementById(a.id))
      .filter((el): el is HTMLElement => el !== null)

    if (!sections.length) return

    /*
      Линията е малко под лентата (56 px висока, котвите спират на 56 —
      `scroll-mt-14`): секция, до която е скочил линк, вече е активна.
    */
    const LINE = 96
    let frame = 0

    const update = () => {
      frame = 0
      const doc = document.documentElement
      // В края на страницата последната секция може никога да не стигне линията.
      if (window.innerHeight + window.scrollY >= doc.scrollHeight - 2) {
        setActive(sections[sections.length - 1]!.id)
        return
      }
      let current = sections[0]!.id
      for (const el of sections) {
        if (el.getBoundingClientRect().top <= LINE) current = el.id
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
  }, [anchors])

  if (!anchors.length) return null

  return (
    <nav
      aria-label="Съдържание на страницата"
      /*
        Лепне под хедъра: на телефон хедърът също лепне и пише височината
        си в `--header-offset` (0, когато е прибран или на компютър).
      */
      className="sticky top-[var(--header-offset,0px)] z-30 border-y border-line bg-surface/95 backdrop-blur transition-[top] duration-200"
    >
      <div className="container-site">
        {/*
          На широк екран точките стоят в центъра, както в оригинала. При
          препълване „safe center" се отказва от центрирането и лентата се
          скролва отляво — виж scroll-row-center в globals.css.
        */}
        <ul ref={rowRef} data-edge={edge} className="scroll-row scroll-row-center edge-fade py-0">
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
