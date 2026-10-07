'use client'

import { FieldLabel, useField, useForm, useFormFields } from '@payloadcms/ui'
import { useEffect, useRef, useState } from 'react'

import { parseDiscount } from '@/lib/offers/draft-restore'

/**
 * „Обща отстъпка %" над редовете на офертата — на живо, без „Запази".
 *
 * - Нова стойност веднага отива в редовете без отстъпка и в тези, които
 *   досега следваха общата (имаха старата обща стойност).
 * - Редове с ДРУГА отстъпка не се пипат без въпрос: „Всички редове" ги
 *   сменя, „Само празните" ги оставя.
 * - Нов ред (ръчно или с продукт) получава общата.
 * - Изтрита обща — редовете остават каквито са.
 *
 * Сървърът НЕ прилага общата върху редовете — записва това, което е във
 * формата, за да няма разминаване между екрана и базата.
 */
export const OfferGeneralDiscount = ({ path = 'generalDiscount' }: { path?: string }) => {
  const { value, setValue } = useField<number | null>({ path })
  const { dispatchFields, setModified } = useForm()
  const count = useFormFields(([f]) => Number(f.items?.value ?? 0)) || 0
  const discounts = useFormFields(([f]) => {
    const n = Number(f.items?.value ?? 0) || 0
    return JSON.stringify(Array.from({ length: n }, (_, i) => f[`items.${i}.discount`]?.value ?? null))
  })
  const rows = JSON.parse(discounts) as (number | null)[]

  const [text, setText] = useState(value === null || value === undefined ? '' : String(value).replace('.', ','))
  const [invalid, setInvalid] = useState(false)
  const [differing, setDiffering] = useState<number[]>([])
  const prev = useRef<number | null>(typeof value === 'number' ? value : null)
  const prevCount = useRef(count)

  const setRow = (i: number, d: number) => dispatchFields({ type: 'UPDATE', path: `items.${i}.discount`, value: d })

  // Стойност, сменена отвън (върната от резервното копие).
  useEffect(() => {
    const v = typeof value === 'number' ? value : null
    if (!invalid && parseDiscount(text) !== v) {
      setText(v === null ? '' : String(v).replace('.', ','))
      prev.current = v
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  // Нов ред → общата отстъпка.
  useEffect(() => {
    if (count > prevCount.current && typeof value === 'number') {
      for (let i = prevCount.current; i < count; i++) if (rows[i] === null || rows[i] === undefined) setRow(i, value)
    }
    prevCount.current = count
  }, [count]) // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = (raw: string) => {
    setText(raw)
    const n = parseDiscount(raw)
    if (Number.isNaN(n)) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    setValue(n)
    if (n === null) {
      prev.current = null
      setDiffering([])
      return
    }
    const other: number[] = []
    rows.forEach((d, i) => {
      if (d === null || d === undefined || d === prev.current) setRow(i, n)
      else if (d !== n) other.push(i)
    })
    prev.current = n
    setDiffering(other)
    setModified(true)
  }

  const applyAll = () => {
    if (typeof value === 'number') differing.forEach((i) => setRow(i, value))
    setDiffering([])
    setModified(true)
  }

  const btn = { padding: '4px 12px', fontSize: 13, cursor: 'pointer', borderRadius: 4, border: '1px solid var(--theme-elevation-300)', background: 'var(--theme-elevation-50)' } as const

  return (
    <div className={`field-type number${invalid ? ' error' : ''}`} style={{ marginBottom: 24, maxWidth: 360 }}>
      <FieldLabel label="Обща отстъпка %" path={path} />
      <div className="field-type__wrap" style={{ maxWidth: 160 }}>
      <input
        id={`field-${path}`}
        type="text"
        inputMode="decimal"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
      />
      </div>
      {invalid && <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--theme-error-500)' }}>От 0 до 100, през 0,5 (напр. 7,5).</p>}
      <p className="field-description" style={{ margin: '6px 0 0' }}>
        Попълва отстъпката на всички редове. После всеки ред може да се смени поотделно.
      </p>
      {differing.length > 0 && (
        <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 4, background: 'var(--theme-warning-100, #fff4e6)', fontSize: 13 }}>
          <p style={{ margin: '0 0 8px' }}>
            {differing.length === 1 ? '1 ред има друга отстъпка' : `${differing.length} реда имат друга отстъпка`}. Да се смени ли и при тях?
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" style={btn} onClick={applyAll}>Всички редове</button>
            <button type="button" style={btn} onClick={() => setDiffering([])}>Само празните</button>
          </div>
        </div>
      )}
    </div>
  )
}
