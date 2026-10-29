'use client'

import { MagnifyingGlass } from '@phosphor-icons/react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { DocumentRow } from '@/components/DocumentList'
import { type DocItem, DOCUMENT_KINDS } from '@/lib/documents'

export type ExplorerDoc = DocItem & {
  products: { title: string; path: string }[]
  categories: string[]
  series: string[]
}

type Option = { value: string; label: string }

/**
 * `/dokumenti` — филтри по категория / серия / вид и търсене (`task-dokumenti.md`).
 * Целият списък е в HTML-а; филтрирането е в браузъра, изборът — в адреса
 * (`?kategoriya=…&seriya=…&vid=…&q=…`), както при филтрите и „Въпроси".
 */
export const DocumentsExplorer = ({
  docs,
  categories,
  series,
}: {
  docs: ExplorerDoc[]
  categories: Option[]
  series: (Option & { category: string })[]
}) => {
  const [kat, setKat] = useState('')
  const [ser, setSer] = useState('')
  const [vid, setVid] = useState('')
  const [q, setQ] = useState('')

  // Изборът от адреса — при първото зареждане.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setKat(p.get('kategoriya') ?? '')
    setSer(p.get('seriya') ?? '')
    setVid(p.get('vid') ?? '')
    setQ(p.get('q') ?? '')
  }, [])

  // Изборът → адреса (без нов запис в историята).
  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams()
      if (kat) p.set('kategoriya', kat)
      if (ser) p.set('seriya', ser)
      if (vid) p.set('vid', vid)
      if (q.trim()) p.set('q', q.trim())
      const s = p.toString()
      window.history.replaceState(null, '', s ? `?${s}` : window.location.pathname)
    }, 150)
    return () => clearTimeout(t)
  }, [kat, ser, vid, q])

  const seriesFor = useMemo(() => series.filter((s) => !kat || s.category === kat), [series, kat])
  const думи = q.trim().toLowerCase().split(/\s+/).filter(Boolean)

  const visible = docs.filter(
    (d) =>
      (!kat || d.categories.includes(kat)) &&
      (!ser || d.series.includes(ser)) &&
      (!vid || d.kind === vid) &&
      думи.every((w) => `${d.title} ${d.products.map((p) => p.title).join(' ')}`.toLowerCase().includes(w)),
  )

  const select = 'min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-base sm:text-sm'

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="relative block lg:col-span-1">
          <span className="sr-only">Търсене</span>
          <MagnifyingGlass aria-hidden size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Търсене: продукт или документ"
            className={`${select} pl-9`}
          />
        </label>
        <label className="block">
          <span className="sr-only">Категория</span>
          <select value={kat} onChange={(e) => { setKat(e.target.value); setSer('') }} className={select}>
            <option value="">Всички категории</option>
            {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Серия</span>
          <select value={ser} onChange={(e) => setSer(e.target.value)} className={select}>
            <option value="">Всички серии</option>
            {seriesFor.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Вид</span>
          <select value={vid} onChange={(e) => setVid(e.target.value)} className={select}>
            <option value="">Всички видове</option>
            {DOCUMENT_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
        </label>
      </div>

      <p className="mt-6 text-sm text-ink-muted" aria-live="polite">
        {visible.length === 1 ? '1 документ' : `${visible.length} документа`}
      </p>

      {visible.length ? (
        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
          {visible.map((d) => (
            <DocumentRow
              key={d.id}
              doc={d}
              extra={
                d.products.length ? (
                  <p className="mt-1.5 text-[13px] text-ink-muted">
                    {d.products.map((p, i) => (
                      <span key={p.path}>
                        {i ? ', ' : ''}
                        <Link href={p.path} className="underline underline-offset-4 hover:text-ink">{p.title}</Link>
                      </span>
                    ))}
                  </p>
                ) : null
              }
            />
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-lg border border-line bg-surface px-4 py-8 text-center text-ink-muted">
          Няма документи по този избор.{' '}
          <button type="button" className="underline underline-offset-4" onClick={() => { setKat(''); setSer(''); setVid(''); setQ('') }}>
            Изчисти филтрите
          </button>
        </p>
      )}
    </div>
  )
}
