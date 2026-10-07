'use client'

import { useConfig, useFormFields } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

type MediaDoc = { id: number; url?: string | null; trimmed?: { small?: string | null } | null; sizes?: { thumbnail?: { url?: string | null } | null } | null }

/** Малката снимка: изрязаният вариант (до 240 px), иначе `thumbnail`. */
const thumb = (m: MediaDoc | undefined): string | null => {
  if (!m) return null
  if (m.trimmed?.small && m.url) return m.url.replace(/\/[^/?]*(\?|$)/, `/${encodeURIComponent(m.trimmed.small)}$1`)
  return m.sizes?.thumbnail?.url ?? m.url ?? null
}

/**
 * Продуктите на заявката: снимка, име (линк към продукта на сайта, в нов
 * таб — само ако продуктът още е публикуван), SKU, баркод и количество.
 *
 * Данните са СНИМКАТА от заявката (име, SKU, EAN, снимка) — каквото е
 * поискал клиентът. Количеството и продуктите се редактират в
 * „Продукти и количества" по-долу.
 */
export const QuoteItemsTable = () => {
  const { config } = useConfig()
  const fields = useFormFields(([f]) => f)
  const count = Number(fields.items?.value ?? 0)
  const idOf = (v: unknown) => (typeof v === 'object' && v ? (v as { id: number }).id : (v as number | null | undefined)) ?? null
  const rows = Array.from({ length: Number.isFinite(count) ? count : 0 }, (_, i) => ({
    title: String(fields[`items.${i}.title`]?.value ?? ''),
    url: String(fields[`items.${i}.url`]?.value ?? ''),
    product: idOf(fields[`items.${i}.product`]?.value),
    sku: String(fields[`items.${i}.sku`]?.value ?? ''),
    ean: String(fields[`items.${i}.ean`]?.value ?? ''),
    image: idOf(fields[`items.${i}.image`]?.value),
    quantity: Number(fields[`items.${i}.quantity`]?.value ?? 0),
  }))
  const total = rows.reduce((s, r) => s + r.quantity, 0)
  const api = `${config.serverURL ?? ''}${config.routes.api}`
  const admin = config.routes.admin

  const imageIds = rows.map((r) => r.image).filter((x): x is number => !!x).join(',')
  const productIds = rows.map((r) => r.product).filter((x): x is number => !!x).join(',')
  const [media, setMedia] = useState<Record<number, MediaDoc>>({})
  const [live, setLive] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!imageIds) return
    void fetch(`${api}/media?where[id][in]=${imageIds}&depth=0&limit=100`, { credentials: 'include' })
      .then((r) => r.json())
      .then((j: { docs?: MediaDoc[] }) => setMedia(Object.fromEntries((j.docs ?? []).map((d) => [d.id, d]))))
      .catch(() => {})
  }, [api, imageIds])

  useEffect(() => {
    if (!productIds) return
    void fetch(`${api}/products?where[and][0][id][in]=${productIds}&where[and][1][_status][equals]=published&depth=0&limit=100&select[id]=true`, {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((j: { docs?: { id: number }[] }) => setLive(new Set((j.docs ?? []).map((d) => d.id))))
      .catch(() => {})
  }, [api, productIds])

  if (!rows.length) {
    return <p style={{ margin: '0 0 24px', color: 'var(--theme-elevation-500)' }}>Няма избрани продукти от списъка.</p>
  }

  const cell = { padding: '8px 10px', borderBottom: '1px solid var(--theme-elevation-100)', verticalAlign: 'middle' } as const
  const muted = { color: 'var(--theme-elevation-500)' } as const

  return (
    <div style={{ marginBottom: 32 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: 'left', ...muted }}>
            <th style={{ ...cell, width: 72 }} />
            <th style={cell}>Продукт</th>
            <th style={cell}>SKU</th>
            <th style={cell}>Баркод / EAN</th>
            <th style={{ ...cell, width: 110, textAlign: 'right' }}>Количество</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const src = r.image ? thumb(media[r.image]) : null
            const onSite = r.product !== null && live.has(r.product)
            return (
              <tr key={i}>
                <td style={cell}>
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="" width={56} height={56} style={{ width: 56, height: 56, objectFit: 'contain', display: 'block' }} />
                  ) : null}
                </td>
                <td style={cell}>
                  {onSite && r.url ? (
                    <a href={r.url} target="_blank" rel="noopener noreferrer">
                      {r.title}
                    </a>
                  ) : (
                    <span>
                      {r.title}
                      {r.product ? null : <span style={{ ...muted, fontSize: 12 }}> (продуктът е изтрит)</span>}
                      {r.product && !onSite && live.size ? <span style={{ ...muted, fontSize: 12 }}> (не е на сайта)</span> : null}
                    </span>
                  )}
                  {r.product ? (
                    <a href={`${admin}/collections/products/${r.product}`} style={{ marginLeft: 10, fontSize: 12, ...muted }}>
                      в админа
                    </a>
                  ) : null}
                </td>
                <td style={{ ...cell, fontFamily: 'monospace', fontSize: 13 }}>{r.sku || '—'}</td>
                <td style={{ ...cell, fontFamily: 'monospace', fontSize: 13 }}>{r.ean || '—'}</td>
                <td style={{ ...cell, textAlign: 'right', fontWeight: 600 }}>{r.quantity}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p style={{ margin: '10px 0 0', fontWeight: 600 }}>
        Общо: {rows.length} продукта, {total} броя
      </p>
    </div>
  )
}
