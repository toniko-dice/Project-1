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
  const navRef = useRef<HTMLElement>(null)
  const edge = useScrollEdges(rowRef)

  /*
    Височината на лентата → `--anchor-nav-h` (котвите спират под нея,
    `.anchor-target`). На компютър лентата става на два реда, когато
    секциите не се побират — с фиксиран отстъп заглавието би се скрило.
  */
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const root = document.documentElement
    const ro = new ResizeObserver(() => root.style.setProperty('--anchor-nav-h', `${nav.offsetHeight}px`))
    ro.observe(nav)
    return () => {
      ro.disconnect()
      root.style.removeProperty('--anchor-nav-h')
    }
  }, [])

  /*
    Активната точка се вижда винаги: на телефон лентата е по-широка от
    екрана и без това активната оставаше отрязана вдясно. Мести се САМО
    лентата (`scrollTo` на нея), не страницата — `scrollIntoView` би
    дръпнал и прозореца по средата на скрола.
    Мигновено, не `smooth`: плавното превъртане на лентата (със scroll-snap)
    не завършваше — лентата изоставаше с една секция назад (30.10.2026).
    Мястото се смята спрямо самата лента (`getBoundingClientRect`), не с
    `offsetLeft` — той е спрямо залепения `nav` и включва отстъпа на контейнера.
  */
  useEffect(() => {
    const row = rowRef.current
    const link = row?.querySelector<HTMLElement>(`a[href="#${CSS.escape(active)}"]`)
    if (!row || !link || row.scrollWidth <= row.clientWidth) return
    const r = row.getBoundingClientRect()
    const l = link.getBoundingClientRect()
    const център = row.scrollLeft + (l.left - r.left) + l.width / 2 - row.clientWidth / 2
    row.scrollTo({ left: Math.max(0, център), behavior: 'instant' })
  }, [active])

  useEffect(() => {
    if (!anchors.length) return

    const sections = anchors
      .map((a) => document.getElementById(a.id))
      .filter((el): el is HTMLElement => el !== null)

    if (!sections.length) return

    /*
      Линията е малко под мястото, където спират котвите (височината на
      лентата + 56 px — `.anchor-target`): секция, до която е скочил линк, вече
      е активна. Височината се чете всеки път — на компютър лентата може да е
      на два реда.
    */
    const line = () => (navRef.current?.offsetHeight ?? 56) + 56 + 16
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
      const LINE = line()
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
      ref={navRef}
      aria-label="Съдържание на страницата"
      /*
        Лепне под хедъра: на телефон хедърът също лепне и пише височината
        си в `--header-offset` (0, когато е прибран или на компютър).
      */
      className="sticky top-[var(--header-offset,0px)] z-30 border-y border-line bg-surface/95 backdrop-blur transition-[top] duration-200"
    >
      <div className="container-site">
        {/*
          На широк екран точките стоят в центъра, както в оригинала; които не
          се побират — на втори ред (`anchor-row`). На телефон при препълване
          „safe center" се отказва от центрирането и лентата се скролва
          отляво — виж scroll-row-center в globals.css.
        */}
        <ul ref={rowRef} data-edge={edge} className="scroll-row scroll-row-center anchor-row edge-fade py-0">
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
