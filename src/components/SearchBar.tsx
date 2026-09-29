'use client'

import { MagnifyingGlass, X } from '@phosphor-icons/react/dist/ssr'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { formatEur } from '@/lib/format'
import type { ProductCardData } from '@/lib/media'
import { ImagePlaceholder } from './ImagePlaceholder'
import { SEARCH_API_PATH, SEARCH_PATH, searchUrl } from '@/lib/urls'

/** Най-краткото, което пуска заявка. Една буква съвпада с половината каталог. */
const MIN_CHARS = 2

/** Изчакване след последната натисната буква, преди да тръгне заявката. */
const DEBOUNCE_MS = 250

/**
 * Лентата за търсене под хедъра.
 *
 * Докато се пише, под полето излиза списък с до шест продукта — заявката
 * тръгва след 250 ms без натискане на клавиш, за да не се праща по една
 * на буква. Всяка следваща прекъсва предишната (`AbortController`):
 * бавен отговор на „del" иначе застига отговора на „delta" и списъкът
 * примигва с по-стария резултат.
 *
 * Enter отваря пълната страница с резултати. Тя е и единственият изход
 * без JavaScript — затова полето е в истински `<form>` с `action`, а не в
 * `<div>` с обработчик.
 */
export const SearchBar = ({ onClose }: { onClose: () => void }) => {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')

  /*
    Отговорът се пази ЗАЕДНО с търсенето, на което отговаря.

    Така не се налага списъкът да се чисти при всяка буква (а с това и
    `setState` направо в ефекта, което върти излишни рендери): показва се
    само ако `found.q` съвпада с това, което пише в полето. Отговор, който
    е закъснял и се отнася за по-стар текст, просто не се показва.
  */
  const [found, setFound] = useState<{
    q: string
    results: ProductCardData[]
    total: number
    провал?: boolean
  }>({ q: '', results: [], total: 0 })

  const текст = query.trim()
  const дълго = текст.length >= MIN_CHARS
  const готово = found.q === текст

  /* Лентата се отваря с клик на иконата — курсорът е в полето веднага. */
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!дълго) return

    const прекъсни = new AbortController()

    const изчакване = setTimeout(async () => {
      try {
        const отговор = await fetch(`${SEARCH_API_PATH}?q=${encodeURIComponent(текст)}`, {
          signal: прекъсни.signal,
        })
        if (!отговор.ok) throw new Error(String(отговор.status))
        const данни = (await отговор.json()) as { results: ProductCardData[]; total: number }
        setFound({ q: текст, results: данни.results ?? [], total: данни.total ?? 0 })
      } catch {
        /*
          Прекъснатата заявка не е провал — тя е заменена от следващата и
          на нейния текст вече отговаря друг ефект.
        */
        if (прекъсни.signal.aborted) return
        setFound({ q: текст, results: [], total: 0, провал: true })
      }
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(изчакване)
      прекъсни.abort()
    }
  }, [текст, дълго])

  const къмРезултатите = () => {
    if (!текст) return
    router.push(searchUrl(текст))
    onClose()
  }

  return (
    <div className="absolute inset-x-0 top-full z-40 border-t border-line bg-surface shadow-lg">
      <div className="container-site py-4">
        <form
          action={SEARCH_PATH}
          method="get"
          onSubmit={(e) => {
            e.preventDefault()
            къмРезултатите()
          }}
          className="flex items-center gap-3 border-b border-line-strong pb-2"
          role="search"
        >
          <MagnifyingGlass size={20} className="shrink-0 text-ink-muted" aria-hidden="true" />

          <input
            ref={inputRef}
            /*
              Не `type="search"`: браузърът рисува СВОЙ кръстец в полето и
              до бутона за затваряне излизат два еднакви знака един до друг.
              `enterKeyHint` пази лупата на екранната клавиатура.
            */
            type="text"
            enterKeyHint="search"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose()
            }}
            placeholder="Търсене по име, каталожен номер или баркод"
            aria-label="Търсене в продуктите"
            autoComplete="off"
            className="min-h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink-muted"
          />

          <button
            type="button"
            onClick={onClose}
            aria-label="Затваряне на търсенето"
            className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded transition-colors duration-200 hover:bg-nav-hover"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </form>

        {дълго ? (
          <div className="mt-3 max-h-[60vh] overflow-y-auto" aria-live="polite">
            {готово && found.results.length ? (
              <>
                <ul>
                  {found.results.map((item, i) => (
                    <li key={i}>
                      <Link
                        href={item.url ?? '#'}
                        onClick={onClose}
                        className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors duration-150 hover:bg-tile"
                      >
                        <span className="relative size-14 shrink-0">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.imageAlt}
                              fill
                              sizes="56px"
                              className="object-contain"
                            />
                          ) : (
                            <ImagePlaceholder className="absolute inset-0 rounded" />
                          )}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{item.title}</span>
                          {item.tagline ? (
                            <span className="block truncate text-xs text-ink-muted">
                              {item.tagline}
                            </span>
                          ) : null}
                        </span>

                        {typeof item.price === 'number' ? (
                          <span className="tabular shrink-0 text-sm font-semibold">
                            {formatEur(item.price)}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={къмРезултатите}
                  className="mt-1 flex min-h-11 w-full cursor-pointer items-center justify-center rounded-lg border-t border-line text-sm text-ink-muted transition-colors duration-150 hover:text-ink"
                >
                  Виж всички резултати за „{текст}“ ({found.total})
                </button>
              </>
            ) : (
              <p className="px-2 py-4 text-sm text-ink-muted">
                {!готово
                  ? 'Търсене…'
                  : found.провал
                    ? 'Търсенето не отговори. Опитайте отново.'
                    : `Нищо не е намерено за „${текст}“.`}
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
