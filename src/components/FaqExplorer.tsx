'use client'

import { MagnifyingGlass, X } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import { Fragment, useEffect, useMemo, useState } from 'react'

import type { FaqGroup, FaqItem } from '@/lib/faq'
import { CONTACT_PATH } from '@/lib/legal'
import { FaqAnswer } from './FaqAnswer'
import { ProductAnchorNav } from './ProductAnchorNav'

const DEBOUNCE_MS = 150

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Текстът с маркирани съвпадения (`<mark>`), без значение главни/малки букви. */
const Маркиран = ({ text, q }: { text: string; q: string }) => {
  if (!q) return <>{text}</>
  const части = text.split(new RegExp(`(${escapeRe(q)})`, 'giu'))
  return (
    <>
      {части.map((p, i) =>
        i % 2 ? (
          <mark key={i} className="rounded-sm bg-[#ffe58a] text-ink">
            {p}
          </mark>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  )
}

const съвпада = (item: FaqItem, q: string) => {
  if (!q) return true
  const t = q.toLowerCase()
  return item.question.toLowerCase().includes(t) || item.answers.some((a) => a.text.toLowerCase().includes(t))
}

const ВИЖ = { product: 'Виж продукта', page: 'Виж страницата', category: 'Виж категорията' } as const

/**
 * Търсачката, лентата с котви и акордеоните на `/vaprosi`.
 *
 * Всички въпроси и отговори са в HTML-а от сървъра (затворени `details`) —
 * търсачките ги виждат, а търсенето тук само скрива несъвпадащите.
 * Търсенето е в браузъра, докато се пише (150 ms), и се пази в адреса
 * (`?q=`) — чете се след зареждане, защото страницата е статична.
 * Котва към въпрос (`#delta-kak-se-zarezhda`) го отваря.
 */
export const FaqExplorer = ({ groups }: { groups: FaqGroup[] }) => {
  const [input, setInput] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    const от = new URLSearchParams(window.location.search).get('q') ?? ''
    if (от) {
      // Адресът се чете веднъж след зареждане — страницата е статична и сървърът не вижда `?q=`.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInput(от)
      setQ(от.trim())
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setQ(input.trim().replace(/\s+/g, ' ')), DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [input])

  /* Адресът следва търсенето — за споделяне; котвата остава. */
  useEffect(() => {
    const url = new URL(window.location.href)
    if (q) url.searchParams.set('q', q)
    else url.searchParams.delete('q')
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url)
  }, [q])

  /* Котва към въпрос — отваря го и го показва (и при смяна на котвата). */
  useEffect(() => {
    const отвори = () => {
      const id = decodeURIComponent(window.location.hash.slice(1))
      const el = id ? document.getElementById(id) : null
      if (el instanceof HTMLDetailsElement) {
        el.open = true
        el.scrollIntoView({ block: 'start' })
      }
    }
    отвори()
    window.addEventListener('hashchange', отвори)
    return () => window.removeEventListener('hashchange', отвори)
  }, [])

  const видими = useMemo(
    () => groups.map((g) => ({ ...g, items: g.items.filter((i) => съвпада(i, q)) })),
    [groups, q],
  )
  const брой = видими.reduce((s, g) => s + g.items.length, 0)
  const anchors = useMemo(
    () => видими.filter((g) => g.items.length).map((g) => ({ id: g.id, label: g.title })),
    [видими],
  )
  const видимиИд = useMemo(() => new Set(видими.flatMap((g) => g.items.map((i) => i.id))), [видими])

  return (
    <>
      <div className="container-site">
        <div className="mx-auto max-w-[56rem]">
          <div role="search" className="relative">
            <MagnifyingGlass size={20} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="search"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Търсете във въпросите…"
              aria-label="Търсете във въпросите"
              enterKeyHint="search"
              className="h-14 w-full rounded-xl border border-line bg-surface pl-12 pr-14 text-base outline-none transition-colors placeholder:text-ink-muted focus:border-ink [&::-webkit-search-cancel-button]:hidden"
            />
            {input ? (
              <button
                type="button"
                onClick={() => setInput('')}
                aria-label="Изчисти търсенето"
                className="absolute right-2 top-1/2 inline-flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-ink-muted hover:bg-tile hover:text-ink"
              >
                <X size={18} aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <p aria-live="polite" className="mt-3 min-h-6 text-sm text-ink-muted">
            {q ? (
              брой ? (
                `Намерени: ${брой}`
              ) : (
                <>
                  Няма намерени въпроси.{' '}
                  <Link href={CONTACT_PATH} className="font-medium text-ink underline underline-offset-4">
                    Пишете ни
                  </Link>{' '}
                  — ще ви отговорим.
                </>
              )
            ) : null}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <ProductAnchorNav anchors={anchors} />
      </div>

      <div className="container-site pb-16">
        <div className="mx-auto max-w-[56rem]">
          {groups.map((g) => {
            const има = видими.find((v) => v.id === g.id)!.items.length > 0
            return (
              <section key={g.id} id={g.id} hidden={!има} className="scroll-mt-28 pt-10">
                <h2 className="mb-4 text-xl font-semibold tracking-tight sm:text-2xl">{g.title}</h2>
                <div className="divide-y divide-line border-y border-line">
                  {g.items.map((item) => (
                    <details
                      key={item.id}
                      id={item.id}
                      hidden={!видимиИд.has(item.id)}
                      open={q && видимиИд.has(item.id) ? true : undefined}
                      className="group scroll-mt-32"
                    >
                      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
                        <h3 className="text-sm font-medium">
                          <Маркиран text={item.question} q={q} />
                        </h3>
                        <span aria-hidden="true" className="shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <div className="space-y-4 pb-4">
                        {item.answers.map((a, i) => (
                          <div key={i}>
                            <FaqAnswer
                              text={a.text}
                              mark={(t) => <Маркиран text={t} q={q} />}
                              prefix={
                                item.answers.length > 1 ? (
                                  <strong className="font-semibold text-ink">{a.sources.map((s) => s.title).join(', ')}: </strong>
                                ) : undefined
                              }
                            />
                            {a.sources[0] ? (
                              <Link
                                href={a.sources[0].url}
                                className="mt-1 inline-flex min-h-9 items-center text-xs font-medium text-ink underline-offset-4 hover:underline max-md:min-h-11"
                              >
                                {ВИЖ[a.sources[0].kind]} →
                              </Link>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </>
  )
}
