'use client'

import { useField } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

/**
 * Под списъка „Продукти" в секция на панел: подзаглавието и цената на
 * всеки продукт, в реда на списъка.
 *
 * Полето е обикновеният relationship — влачене за подредба, „×" за махане,
 * търсене за добавяне. Той обаче показва само името, а „EcoFlow 160W
 * Solar Panel" и „EcoFlow 160W Lightweight Portable Solar Panel" се
 * различават едва по подзаглавието. Тук се вижда кое какво е, без да се
 * отваря продуктът.
 *
 * Данните се четат от същото REST API, което ползва админът, с `select` —
 * само трите полета. Черновите се виждат (`draft=true`) и са отбелязани:
 * на сайта не излизат, докато не се публикуват.
 *
 * След добавяне или преместване трябва `npm run generate:importmap`.
 */
type Ред = {
  id: number
  title: string
  tagline?: string | null
  price?: number | null
  _status?: 'draft' | 'published' | null
}

const цена = (n?: number | null) =>
  typeof n === 'number'
    ? new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR' }).format(n)
    : null

export const PanelProductsPreview = ({ path }: { path: string }) => {
  const { value } = useField<(number | { id: number } | { value: number })[] | null>({ path })

  // Стойността е списък с номера; при някои пътища идват обекти.
  const ids = (value ?? [])
    .map((v) => (typeof v === 'number' ? v : 'id' in v ? v.id : v.value))
    .filter((id): id is number => typeof id === 'number')
  const ключ = ids.join(',')

  const [редове, setРедове] = useState<Record<number, Ред>>({})

  useEffect(() => {
    if (!ключ) return
    const контрол = new AbortController()
    const params = new URLSearchParams({
      'where[id][in]': ключ,
      depth: '0',
      draft: 'true',
      limit: '200',
      'select[title]': 'true',
      'select[tagline]': 'true',
      'select[price]': 'true',
      'select[_status]': 'true',
    })
    fetch(`/api/products?${params}`, { credentials: 'include', signal: контрол.signal })
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((data: { docs: Ред[] }) => {
        setРедове(Object.fromEntries(data.docs.map((d) => [d.id, d])))
      })
      .catch(() => {
        // Прекъсната заявка при бърза смяна на списъка — нищо за правене.
      })
    return () => контрол.abort()
  }, [ключ])

  if (!ids.length) return null

  return (
    <ol
      style={{
        margin: 'calc(var(--base) / 2) 0 0',
        paddingLeft: 'calc(var(--base) * 1.25)',
        fontSize: '13px',
        lineHeight: 1.5,
        color: 'var(--theme-elevation-600)',
      }}
    >
      {ids.map((id, i) => {
        const р = редове[id]
        return (
          <li key={`${id}-${i}`}>
            <strong style={{ color: 'var(--theme-elevation-800)', fontWeight: 500 }}>
              {р?.title ?? `Продукт № ${id}`}
            </strong>
            {i === 0 ? ' · голяма карта' : ''}
            {р?.tagline ? ` — ${р.tagline}` : ''}
            {цена(р?.price) ? ` · ${цена(р?.price)}` : ''}
            {р?._status === 'draft' ? ' · чернова, не се показва' : ''}
          </li>
        )
      })}
    </ol>
  )
}
