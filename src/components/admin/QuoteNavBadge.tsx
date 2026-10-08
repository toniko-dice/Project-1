'use client'

import { useAuth, useConfig, useDocumentEvents } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const POLL_MS = 60_000

/**
 * Броячът до „Нови заявки" и „Съобщения" в лявото меню — записите със
 * статус `new` („Нова" / „Ново"). Колекцията и думата идват като
 * `clientProps` от `payload.config.ts` — един компонент за двете.
 *
 * Payload не дава динамичен надпис на колекция в менюто, затова този
 * компонент (в `admin.components.afterNavLinks`) намира линка на колекцията
 * и слага кръгчето в него през portal. Броят се чете с
 * `/api/quote-requests?where[status][equals]=new&limit=0` — с бисквитката
 * на влезлия админ; без вход API-то връща 403 и кръгче няма.
 *
 * Опреснява се: при зареждане, при всяка смяна на страницата в админа, на
 * всеки 60 секунди и веднага след запис на заявка (`useDocumentEvents`) —
 * смяната на статуса от „Нова" маха цифрата без чакане. Нула — нищо.
 */
export const CollectionNavBadge = ({
  slug = 'quote-requests',
  noun = 'нови заявки',
}: {
  slug?: string
  noun?: string
}) => {
  const SLUG = slug
  const { config } = useConfig()
  // Само администраторът и продажбите виждат заявките; за редактора не се пита изобщо.
  const { user } = useAuth<{ role?: string | null }>()
  const вижда = user?.role === 'admin' || user?.role === 'sales'
  const pathname = usePathname()
  const { mostRecentUpdate } = useDocumentEvents()
  const [count, setCount] = useState(0)
  const [host, setHost] = useState<HTMLElement | null>(null)

  const api = `${config.serverURL ?? ''}${config.routes.api}`

  const refresh = useCallback(async () => {
    if (!вижда) return setCount(0)
    try {
      const r = await fetch(`${api}/${SLUG}?where[status][equals]=new&limit=0&depth=0`, {
        credentials: 'include',
      })
      if (!r.ok) return setCount(0)
      const j = (await r.json()) as { totalDocs?: number }
      setCount(j.totalDocs ?? 0)
    } catch {
      // Без връзка — оставяме последната стойност.
    }
  }, [api, вижда, SLUG])

  useEffect(() => {
    void refresh()
    const t = setInterval(refresh, POLL_MS)
    return () => clearInterval(t)
  }, [refresh, pathname])

  useEffect(() => {
    if (mostRecentUpdate?.entitySlug === SLUG) void refresh()
  }, [mostRecentUpdate, refresh, SLUG])

  /*
    Линкът се търси при всяка промяна в DOM-а: менюто се рендерира наново
    при навигация и старият елемент изчезва.
  */
  useEffect(() => {
    const find = () => {
      const a = document.querySelector<HTMLElement>(`nav a[href$="/collections/${SLUG}"]`)
      if (!a) return setHost(null)
      let slot = a.querySelector<HTMLElement>('[data-quote-badge]')
      if (!slot) {
        slot = document.createElement('span')
        slot.dataset.quoteBadge = ''
        a.appendChild(slot)
      }
      setHost((h) => (h === slot ? h : slot))
    }
    find()
    const mo = new MutationObserver(find)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => mo.disconnect()
  }, [SLUG])

  if (!host || count < 1) return null

  return createPortal(
    <span
      aria-label={`${count} ${noun}`}
      title={`${count} ${noun}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 20,
        height: 20,
        padding: '0 6px',
        marginLeft: 8,
        borderRadius: 999,
        background: '#e8590c',
        color: '#fff',
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1,
        verticalAlign: 'middle',
      }}
    >
      {count}
    </span>,
    host,
  )
}

/** Старото име — „Нови заявки". */
export const QuoteNavBadge = () => <CollectionNavBadge />
