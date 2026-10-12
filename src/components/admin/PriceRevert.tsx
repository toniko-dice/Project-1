'use client'

import { useConfig, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Връщането на цени (`task-dice-odobrenie-ceni.md`, т. 4):
 *
 * - `PriceHistoryRevert` — в записа на „История на цените": „Върни
 *   предишната цена" и „Върни целия пакет";
 * - `DiceSyncRevert` — в „Синхронизации с dice": „Върни цените от тази
 *   синхронизация" (пакетът на пускането, само в автоматичен режим).
 *
 * Първо се пита `revert-preview` — какво ще се върне и дали цената е сменяна
 * след това; потвърждението е в прозорец, не в `confirm` на браузъра.
 */
type Item = { product: number; title: string; описание: string; warning: string }
type Target = { id: number } | { batch: string }

const бутон = (primary = false) =>
  ({
    padding: '8px 14px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 14,
    border: '1px solid var(--theme-elevation-800)',
    background: primary ? 'var(--theme-elevation-800)' : 'transparent',
    color: primary ? 'var(--theme-elevation-0)' : 'var(--theme-elevation-800)',
  }) as const

const useRevert = () => {
  const { config } = useConfig()
  const api = `${config.serverURL ?? ''}${config.routes.api}/price-history`
  const [preview, setPreview] = useState<{ target: Target; items: Item[]; title: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const покажи = async (target: Target, title: string) => {
    setBusy(true)
    setErr('')
    setMsg('')
    try {
      const q = 'batch' in target ? `batch=${encodeURIComponent(target.batch)}` : `id=${target.id}`
      const r = await fetch(`${api}/revert-preview?${q}`, { credentials: 'include' })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error ?? `Грешка ${r.status}`)
      if (!j.items.length) setMsg('Няма какво да се върне — продуктите са изтрити или няма сменени цени.')
      else setPreview({ target, items: j.items, title })
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const потвърди = async () => {
    if (!preview) return
    setBusy(true)
    setErr('')
    try {
      const r = await fetch(`${api}/revert`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preview.target),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error ?? `Грешка ${r.status}`)
      setMsg(
        `Върнати ${j.reverted} продукта (пакет ${j.batch} в „История на цените").` +
          (j.drafts ? ` ${j.drafts} са с непубликувани промени — върнатото е в черновата им.` : '') +
          (j.errors?.length ? ` Грешки: ${j.errors.join('; ')}` : ''),
      )
      setPreview(null)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const прозорец =
    preview && typeof document !== 'undefined'
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => !busy && setPreview(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ background: 'var(--theme-elevation-0)', color: 'var(--theme-elevation-1000)', borderRadius: 8, padding: 24, width: 'min(680px, 100%)', maxHeight: '85vh', overflow: 'auto' }}
            >
              <h3 style={{ margin: '0 0 6px' }}>{preview.title}</h3>
              <p style={{ margin: '0 0 12px' }}>
                Ще се върнат <b>{preview.items.length}</b> продукта — само цената и зачертаната цена. Наличностите не се пипат.
              </p>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
                {preview.items.map((i) => (
                  <li key={i.product} style={{ marginBottom: 6 }}>
                    <b>{i.title}</b> — {i.описание}
                    {i.warning ? <div style={{ color: 'var(--theme-warning-700, #b45309)', fontSize: 13 }}>⚠ {i.warning}</div> : null}
                  </li>
                ))}
              </ul>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
                <button type="button" style={бутон()} disabled={busy} onClick={() => setPreview(null)}>
                  Отказ
                </button>
                <button type="button" style={бутон(true)} disabled={busy} onClick={потвърди}>
                  {busy ? 'Връщане…' : `Върни ${preview.items.length} продукта`}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null

  const съобщения = (
    <>
      {msg ? <p style={{ margin: '8px 0 0', fontSize: 14 }}>{msg}</p> : null}
      {err ? <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--theme-error-500)' }}>{err}</p> : null}
    </>
  )
  return { покажи, busy, прозорец, съобщения }
}

export const PriceHistoryRevert = () => {
  const { id } = useDocumentInfo()
  const batch = useFormFields(([f]) => f.batch?.value as string | undefined)
  const { покажи, busy, прозорец, съобщения } = useRevert()
  if (!id) return null
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" style={бутон(true)} disabled={busy} onClick={() => покажи({ id: Number(id) }, 'Върни предишната цена')}>
          Върни предишната цена
        </button>
        {batch ? (
          <button type="button" style={бутон()} disabled={busy} onClick={() => покажи({ batch }, `Върни целия пакет ${batch}`)}>
            Върни целия пакет
          </button>
        ) : null}
      </div>
      {съобщения}
      {прозорец}
    </div>
  )
}

export const DiceSyncRevert = () => {
  const batch = useFormFields(([f]) => f.priceBatch?.value as string | undefined)
  const { покажи, busy, прозорец, съобщения } = useRevert()
  if (!batch) return null
  return (
    <div style={{ marginBottom: 24 }}>
      <button type="button" style={бутон(true)} disabled={busy} onClick={() => покажи({ batch }, 'Върни цените от тази синхронизация')}>
        Върни цените от тази синхронизация
      </button>
      {съобщения}
      {прозорец}
    </div>
  )
}
