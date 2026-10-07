'use client'

import { useDocumentInfo, useForm, useFormFields, useFormModified } from '@payloadcms/ui'
import { useEffect, useRef, useState } from 'react'

import { restoredProductPaths } from '@/lib/offers/draft-restore'

const FIELDS = ['product', 'quantity', 'unitPrice', 'discount', 'title', 'sku', 'ean', 'image'] as const

/**
 * Резервно копие на незаписаните редове на офертата (`sessionStorage`, по
 * номера на офертата).
 *
 * Защо: в режим за разработка `next dev` презарежда админа при всяка
 * промяна на файл в проекта (прекомпилиране, `generate:importmap`) — и
 * незаписаните отстъпки и цени изчезваха. В продукция няма такова
 * презареждане, но копието пази и при случайно презареждане на таба.
 *
 * Докато формата е с незаписани промени, стойностите на редовете се пазят;
 * при отваряне на офертата с копие, различно от записаното, се връщат и
 * излиза „Възстановени са незаписани промени". След „Запази" копието се
 * трие (формата вече не е „променена").
 */
export const OfferDraftGuard = () => {
  const { id } = useDocumentInfo()
  const modified = useFormModified()
  const { dispatchFields, setModified } = useForm()
  const fields = useFormFields(([f]) => f)
  const key = id ? `offer-draft-${id}` : null
  const restored = useRef(false)
  const [notice, setNotice] = useState(false)

  const count = Number(fields.items?.value ?? 0)
  const snapshot: Record<string, unknown> = { generalDiscount: fields.generalDiscount?.value ?? null }
  for (let i = 0; i < count; i++) for (const f of FIELDS) snapshot[`items.${i}.${f}`] = fields[`items.${i}.${f}`]?.value ?? null

  // Връщане — веднъж, при отваряне.
  useEffect(() => {
    if (!key || restored.current || !count) return
    restored.current = true
    let saved: { count: number; values: Record<string, unknown> } | null = null
    try {
      saved = JSON.parse(sessionStorage.getItem(key) ?? 'null')
    } catch {
      saved = null
    }
    if (!saved || saved.count !== count) return
    const diff = Object.entries(saved.values).filter(([p, v]) => fields[p] && (fields[p]?.value ?? null) !== v)
    if (!diff.length) return
    for (const [path] of diff) if (path.endsWith('.product')) restoredProductPaths.add(path)
    for (const [path, value] of diff) dispatchFields({ type: 'UPDATE', path, value })
    setModified(true)
    setNotice(true)
  }, [key, count]) // eslint-disable-line react-hooks/exhaustive-deps

  // Запис при всяка промяна, докато има незаписано; изтриване след „Запази".
  const json = JSON.stringify(snapshot)
  useEffect(() => {
    if (!key) return
    try {
      if (modified) sessionStorage.setItem(key, JSON.stringify({ count, values: snapshot }))
      else if (restored.current) sessionStorage.removeItem(key)
    } catch {
      // Без хранилище (частен режим) — без резервно копие.
    }
  }, [key, modified, json]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!notice) return null
  return (
    <p style={{ margin: '0 0 16px', padding: '8px 12px', borderRadius: 4, background: 'var(--theme-warning-100, #fff4e6)', fontSize: 13 }}>
      Възстановени са незаписани промени. Натиснете „Запази", за да ги запишете.
    </p>
  )
}
