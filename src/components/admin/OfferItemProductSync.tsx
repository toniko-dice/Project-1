'use client'

import { useForm, useFormFields } from '@payloadcms/ui'
import { useEffect, useRef, useState } from 'react'

import { restoredProductPaths } from '@/lib/offers/draft-restore'

/**
 * Ред в офертата: при ИЗБОР или смяна на продукт попълва веднага име, SKU,
 * EAN, снимка и цена (с ДДС, от сайта), отстъпката — с общата, ако е
 * попълнена, количеството — 1, ако е празно. Без „Запази".
 *
 * При отваряне на записана оферта нищо не се пипа (продуктът при монтиране
 * е „предишният"). Изчистен продукт — полетата остават за ръчна редакция.
 * Сървърната кука `prepare` в `Offers.ts` остава резерва за празните полета.
 *
 * `ui` поле в реда (както `CardProductSync`); `path` е „items.2.productSync".
 */
type Продукт = {
  id: number
  title?: string | null
  sku?: string | null
  ean?: string | null
  image?: number | { id: number } | null
  price?: number | null
}

const номер = (v: unknown): number | null => {
  if (typeof v === 'number') return v
  if (v && typeof v === 'object' && 'id' in v && typeof (v as { id: unknown }).id === 'number') return (v as { id: number }).id
  return null
}

export const OfferItemProductSync = ({ path }: { path: string }) => {
  const ред = path.split('.').slice(0, -1).join('.')
  const productId = useFormFields(([f]) => номер(f[`${ред}.product`]?.value))
  const { dispatchFields, setModified, getDataByPath } = useForm()
  const предишен = useRef<number | null>(productId)
  const [грешка, setГрешка] = useState(false)
  const [опит, setОпит] = useState(0)

  useEffect(() => {
    if (productId === null || productId === предишен.current) {
      предишен.current = productId
      return
    }
    if (restoredProductPaths.delete(`${ред}.product`)) {
      предишен.current = productId
      return
    }
    const контрол = new AbortController()
    const params = new URLSearchParams({ depth: '0', draft: 'true' })
    for (const f of ['title', 'sku', 'ean', 'image', 'price']) params.set(`select[${f}]`, 'true')
    fetch(`/api/products/${productId}?${params}`, { credentials: 'include', signal: контрол.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((p: Продукт) => {
        предишен.current = productId
        setГрешка(false)
        const set = (поле: string, value: unknown) => dispatchFields({ type: 'UPDATE', path: `${ред}.${поле}`, value })
        set('title', p.title ?? null)
        set('sku', p.sku ?? null)
        set('ean', p.ean ?? null)
        set('image', номер(p.image))
        set('unitPrice', typeof p.price === 'number' ? p.price : null)
        const общa = getDataByPath('generalDiscount')
        if (typeof общa === 'number') set('discount', общa)
        const qty = getDataByPath(`${ред}.quantity`)
        if (qty === null || qty === undefined || qty === '') set('quantity', 1)
        setModified(true)
      })
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setГрешка(true)
      })
    return () => контрол.abort()
  }, [productId, ред, опит, dispatchFields, setModified, getDataByPath])

  if (!грешка || productId === null) return null
  return (
    <p style={{ margin: 'calc(var(--base) / -2) 0 var(--base)', fontSize: 13, color: 'var(--theme-error-500)' }}>
      Данните на продукта не се заредиха. Попълнете ги ръчно или{' '}
      <button type="button" onClick={() => setОпит((n) => n + 1)} style={{ all: 'unset', cursor: 'pointer', textDecoration: 'underline' }}>
        опитайте отново
      </button>
      .
    </p>
  )
}
