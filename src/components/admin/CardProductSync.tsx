'use client'

import { useForm, useFormFields } from '@payloadcms/ui'
import { useEffect, useRef, useState } from 'react'

/**
 * Ред в секция на панел: попълва полетата от продукта и показва цената.
 *
 * Когато собственикът ИЗБЕРЕ продукт (или смени избрания), името,
 * подзаглавието и снимката на реда се попълват от него веднага — не стоят
 * празни и после може да се променят. При отваряне на вече записан ред
 * нищо не се пипа: там полетата са каквито собственикът ги е оставил.
 *
 * Цената не се копира в реда — показва се тук само за четене. На сайта тя
 * винаги идва от продукта, затова копие в панела би остаряло при първата
 * промяна на цената.
 *
 * Слага се като `ui` поле в реда; `path` е „sections.0.cards.2.productSync",
 * а съседните полета са на същия път без последния сегмент.
 *
 * След добавяне или преместване трябва `npm run generate:importmap`.
 */
type Продукт = {
  id: number
  title?: string | null
  tagline?: string | null
  image?: number | { id: number } | null
  price?: number | null
  compareAtPrice?: number | null
}

const евро = (n?: number | null) =>
  typeof n === 'number'
    ? new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR' }).format(n)
    : null

const номер = (v: unknown): number | null => {
  if (typeof v === 'number') return v
  if (v && typeof v === 'object' && 'id' in v && typeof (v as { id: unknown }).id === 'number') {
    return (v as { id: number }).id
  }
  return null
}

export const CardProductSync = ({ path }: { path: string }) => {
  const ред = path.split('.').slice(0, -1).join('.')
  const productId = useFormFields(([fields]) => номер(fields[`${ред}.product`]?.value))
  const { dispatchFields, setModified } = useForm()

  const [продукт, setПродукт] = useState<Продукт | null>(null)
  // Продуктът при отваряне — него не попълваме наново.
  const предишен = useRef<number | null>(productId)

  useEffect(() => {
    if (productId === null) {
      предишен.current = null
      return
    }

    const смяна = productId !== предишен.current
    предишен.current = productId

    const контрол = new AbortController()
    const params = new URLSearchParams({
      depth: '0',
      draft: 'true',
      'select[title]': 'true',
      'select[tagline]': 'true',
      'select[image]': 'true',
      'select[price]': 'true',
      'select[compareAtPrice]': 'true',
    })
    fetch(`/api/products/${productId}?${params}`, {
      credentials: 'include',
      signal: контрол.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((p: Продукт | null) => {
        setПродукт(p)
        if (!p || !смяна) return
        const полета: [string, unknown][] = [
          ['title', p.title ?? null],
          ['specLine', p.tagline ?? null],
          ['image', номер(p.image)],
        ]
        for (const [поле, value] of полета) {
          dispatchFields({ type: 'UPDATE', path: `${ред}.${поле}`, value })
        }
        setModified(true)
      })
      .catch(() => {
        // Прекъсната заявка при бърза смяна — нищо за правене.
      })
    return () => контрол.abort()
  }, [productId, ред, dispatchFields, setModified])

  // Показва се само цената на ТЕКУЩО избрания продукт.
  if (!продукт || продукт.id !== productId) return null

  return (
    <p
      style={{
        margin: 'calc(var(--base) / -2) 0 var(--base)',
        fontSize: '13px',
        color: 'var(--theme-elevation-600)',
      }}
    >
      Цена от продукта: <strong>{евро(продукт.price) ?? '—'}</strong>
      {продукт.compareAtPrice ? <s style={{ marginLeft: 6 }}>{евро(продукт.compareAtPrice)}</s> : null}
      {' '}— не се копира, на сайта винаги е текущата.
    </p>
  )
}
