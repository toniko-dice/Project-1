'use client'

import Link from 'next/link'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

import {
  ALL_DENIED,
  CONSENT_CHANGE_EVENT,
  CONSENT_COOKIE,
  CONSENT_MAX_AGE,
  CONSENT_OPEN_EVENT,
  CONSENT_SETTINGS_HASH,
  CONSENT_VERSION,
  COOKIES,
  cookiesOf,
  parseConsent,
  serializeConsent,
  shownCategories,
  type ConsentAction,
  type ConsentChoices,
  type ConsentRecord,
  type OptionalCategory,
} from '@/lib/consent'
import { PRIVACY_PATH } from '@/lib/legal'
import { applyConsent, gaLoaded } from '@/lib/track'

/**
 * Банерът за бисквитки и настройките (`task-banner-biskvitki.md`).
 *
 * Първи слой — долу (на телефон на цялата ширина, на компютър карта долу
 * вляво), без затъмняване и без да спира скрола: сайтът се ползва и без
 * избор (не е „cookie wall"). Три бутона на първия екран: „Отказвам
 * всички" · „Настройки" · „Приемам всички" — отказът и приемането са
 * ЕДНАКВИ на вид. Няма X: банерът изчезва само с избор.
 *
 * Втори слой — настройките: категориите с превключвател (нищо отметнато
 * предварително), бисквитките на всяка, „Запази избора" · „Отказвам всички"
 * · „Приемам всички". Отварят се и от линк с `#nastroyki-biskvitki`
 * (футърът, страницата `/biskvitki`) — така се оттегля съгласието.
 *
 * Рендерира се само в браузъра (сървърът не знае избора, а страниците са
 * статични); `fixed` — не измества съдържанието. Само в `(frontend)` —
 * не в `/admin` и не на `/vhod`.
 */

const ПОЛИТИКА_БИСКВИТКИ = '/biskvitki'

const readCookie = (): ConsentRecord | null => {
  const m = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`))
  return parseConsent(m?.[1])
}

const writeCookie = (r: ConsentRecord) => {
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${CONSENT_COOKIE}=${serializeConsent(r)}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax${secure}`
}

/** Трие бисквитките на изключените категории (за GA4 — `_ga`, `_ga_*`) — на хоста и на домейна. */
const dropCookies = (off: OptionalCategory[]) => {
  const patterns = COOKIES.filter((c) => off.includes(c.category as OptionalCategory) && c.match).map((c) => c.match!)
  if (!patterns.length) return
  const host = location.hostname
  const domains = ['', host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`]
  for (const part of document.cookie.split('; ')) {
    const name = part.split('=')[0]
    if (!patterns.some((p) => p.test(name))) continue
    for (const d of domains) document.cookie = `${name}=; Max-Age=0; Path=/${d ? `; Domain=${d}` : ''}`
  }
}

/** „Приемам всички" — само показаните категории; скрита (празна) остава изключена. */
const всички = (): ConsentChoices => {
  const shown = new Set(shownCategories().map((k) => k.id))
  return { analytics: shown.has('analytics'), marketing: shown.has('marketing') }
}

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`

/* Отказ и приемане — един и същ клас (EDPB: равностойни на вид). */
const ГЛАВЕН =
  'inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-night focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink'
const ВТОРИ =
  'inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-ink bg-surface px-4 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-tile focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink'

export const CookieConsent = () => {
  const [готов, setГотов] = useState(false)
  const [банер, setБанер] = useState(false)
  const [настройки, setНастройки] = useState(false)
  const [чернова, setЧернова] = useState<ConsentChoices>(ALL_DENIED)
  const банерRef = useRef<HTMLDivElement>(null)
  const диалогRef = useRef<HTMLDivElement>(null)
  const предишенФокус = useRef<HTMLElement | null>(null)
  const заглавиеБанер = useId()
  const заглавиеДиалог = useId()

  useEffect(() => {
    const r = readCookie()
    setБанер(!r)
    setГотов(true)
    if (r) applyConsent(r.c)
  }, [])

  // Фокусът — на банера, щом излезе (без да го заключва: не е модален).
  useEffect(() => {
    if (банер && !настройки) банерRef.current?.focus()
  }, [банер, настройки])

  const отвориНастройки = useCallback(() => {
    предишенФокус.current = document.activeElement as HTMLElement | null
    setЧернова(readCookie()?.c ?? ALL_DENIED)
    setНастройки(true)
  }, [])

  // Отваряне отвсякъде: събитие или линк с `#nastroyki-biskvitki`.
  useEffect(() => {
    const onOpen = () => отвориНастройки()
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a || !a.getAttribute('href')?.endsWith(CONSENT_SETTINGS_HASH)) return
      e.preventDefault()
      отвориНастройки()
    }
    window.addEventListener(CONSENT_OPEN_EVENT, onOpen)
    document.addEventListener('click', onClick, true)
    if (location.hash === CONSENT_SETTINGS_HASH) отвориНастройки()
    return () => {
      window.removeEventListener(CONSENT_OPEN_EVENT, onOpen)
      document.removeEventListener('click', onClick, true)
    }
  }, [отвориНастройки])

  // Настройките: фокус вътре, Esc затваря, Tab обикаля само в тях.
  useEffect(() => {
    if (!настройки) return
    const d = диалогRef.current
    d?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setНастройки(false)
        предишенФокус.current?.focus?.()
      }
      if (e.key !== 'Tab' || !d) return
      const f = [...d.querySelectorAll<HTMLElement>('button, a[href], summary, [tabindex]:not([tabindex="-1"])')]
      if (!f.length) return
      const first = f[0]
      const last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [настройки])

  const запази = (c: ConsentChoices, action: ConsentAction) => {
    const стар = readCookie()
    const r: ConsentRecord = { v: CONSENT_VERSION, d: new Date().toISOString(), c, id: стар?.id ?? newId() }
    writeCookie(r)
    // Доказателството — анонимно, без IP (колекция „Съгласия за бисквитки").
    void fetch('/api/cookie-consents/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: r.id, v: r.v, action, choices: c }),
      keepalive: true,
    }).catch(() => {})
    const изключени = (Object.keys(c) as OptionalCategory[]).filter((k) => !c[k])
    dropCookies(изключени)
    const трябваПрезареждане = gaLoaded() && !c.analytics
    applyConsent(c)
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: c }))
    setБанер(false)
    setНастройки(false)
    предишенФокус.current?.focus?.()
    // Зареденият скрипт на Google не може да се „изключи" — спира с презареждане.
    if (трябваПрезареждане) location.reload()
  }

  if (!готов || (!банер && !настройки)) return null

  const категории = shownCategories()

  return (
    <>
      {банер && !настройки ? (
        <div
          ref={банерRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby={заглавиеБанер}
          tabIndex={-1}
          className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(0,0,0,0.12)] outline-none md:inset-x-auto md:bottom-4 md:left-4 md:max-w-xl md:rounded-xl md:border md:p-5"
        >
          <h2 id={заглавиеБанер} className="text-base font-semibold">
            Бисквитки на ecoflow.bg
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Използваме задължителни бисквитки, за да работи сайтът. С ваше съгласие бихме използвали и бисквитки за
            анализ на посещенията, за да подобряваме сайта. Можете да промените избора си по всяко време от „Настройки
            на бисквитките“ във футъра.{' '}
            <Link href={ПОЛИТИКА_БИСКВИТКИ} className="font-medium text-ink underline underline-offset-2">
              Политика за бисквитките
            </Link>{' '}
            ·{' '}
            <Link href={PRIVACY_PATH} className="font-medium text-ink underline underline-offset-2">
              Политика за поверителност
            </Link>
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <button type="button" className={ГЛАВЕН} onClick={() => запази(ALL_DENIED, 'reject-all')}>
              Отказвам всички
            </button>
            <button type="button" className={ВТОРИ} onClick={отвориНастройки}>
              Настройки
            </button>
            <button type="button" className={ГЛАВЕН} onClick={() => запази(всички(), 'accept-all')}>
              Приемам всички
            </button>
          </div>
        </div>
      ) : null}

      {настройки ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
          <div
            ref={диалогRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={заглавиеДиалог}
            className="flex max-h-[90svh] w-full flex-col overflow-hidden rounded-t-xl bg-surface shadow-xl sm:max-w-lg sm:rounded-xl"
          >
            <div className="overflow-y-auto p-5">
              <h2 id={заглавиеДиалог} className="text-lg font-semibold">
                Настройки на бисквитките
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                Изберете кои бисквитки разрешавате. Можете да промените избора си по всяко време от „Настройки на
                бисквитките“ във футъра. Подробно —{' '}
                <Link href={ПОЛИТИКА_БИСКВИТКИ} className="font-medium text-ink underline underline-offset-2">
                  Политика за бисквитките
                </Link>
                .
              </p>
              <ul className="mt-4 divide-y divide-line rounded-lg border border-line">
                {категории.map((k) => {
                  const задължителна = k.id === 'necessary'
                  const вкл = задължителна || чернова[k.id as OptionalCategory]
                  const списък = cookiesOf(k.id)
                  return (
                    <li key={k.id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-semibold" id={`kat-${k.id}`}>
                            {k.title}
                          </h3>
                          <p className="mt-1 text-sm text-ink-muted">{k.description}</p>
                        </div>
                        {задължителна ? (
                          <span className="shrink-0 whitespace-nowrap rounded bg-tile px-2 py-1 text-xs font-semibold text-ink">
                            Винаги активни
                          </span>
                        ) : (
                          <button
                            type="button"
                            role="switch"
                            aria-checked={вкл}
                            aria-labelledby={`kat-${k.id}`}
                            data-autofocus={k.id === 'analytics' ? '' : undefined}
                            onClick={() => setЧернова((ч) => ({ ...ч, [k.id]: !ч[k.id as OptionalCategory] }))}
                            className={`relative mt-0.5 inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                              вкл ? 'bg-ink' : 'bg-line-strong'
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className={`inline-block size-5 rounded-full bg-white shadow transition-transform duration-200 ${
                                вкл ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        )}
                      </div>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-medium text-ink underline underline-offset-2">
                          Виж бисквитките
                        </summary>
                        {списък.length ? (
                          <table className="mt-2 w-full text-left text-xs">
                            <thead className="text-ink-muted">
                              <tr>
                                <th className="py-1 pr-2 font-medium">Име</th>
                                <th className="py-1 pr-2 font-medium">Доставчик</th>
                                <th className="py-1 pr-2 font-medium">Цел</th>
                                <th className="py-1 font-medium">Срок</th>
                              </tr>
                            </thead>
                            <tbody>
                              {списък.map((c) => (
                                <tr key={c.name} className="border-t border-line align-top">
                                  <td className="py-1 pr-2 font-mono">{c.name}</td>
                                  <td className="py-1 pr-2">{c.provider}</td>
                                  <td className="py-1 pr-2">
                                    {c.purpose}
                                    {c.note ? <span className="text-ink-muted"> ({c.note})</span> : null}
                                  </td>
                                  <td className="whitespace-nowrap py-1">{c.duration}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="mt-2 text-xs text-ink-muted">
                            В момента сайтът не използва такива бисквитки. Ако разрешите, изборът ви ще важи, когато ги
                            добавим.
                          </p>
                        )}
                      </details>
                    </li>
                  )
                })}
              </ul>
            </div>
            <div className="grid gap-2 border-t border-line p-4 sm:grid-cols-3">
              <button type="button" className={ВТОРИ} onClick={() => запази(чернова, 'custom')}>
                Запази избора
              </button>
              <button type="button" className={ГЛАВЕН} onClick={() => запази(ALL_DENIED, 'reject-all')}>
                Отказвам всички
              </button>
              <button type="button" className={ГЛАВЕН} onClick={() => запази(всички(), 'accept-all')}>
                Приемам всички
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
