'use client'

import { Button, useConfig, useDocumentEvents, useDocumentInfo, useFormModified } from '@payloadcms/ui'
import { useState } from 'react'
import { createPortal } from 'react-dom'

type Preview = { to: string; cc: string; subject: string; text: string; sentAt: string | null }

const box: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '16px 0 20px',
  borderBottom: '1px solid var(--theme-elevation-100)',
  marginBottom: 20,
}
const input: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 4,
  background: 'var(--theme-input-bg, var(--theme-elevation-0))',
  color: 'var(--theme-text)',
  font: 'inherit',
}
const label: React.CSSProperties = { display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--theme-elevation-600)' }

/**
 * Бутоните на офертата: „Преглед" (PDF в нов таб), „Свали PDF" и
 * „Изпрати на клиента" — прозорец с получател, тема и текст (по
 * подразбиране от `GET /api/offers/:id/send-preview`, редактират се).
 *
 * PDF-ът и писмото са от ЗАПИСАНАТА оферта — при незаписани промени
 * изпращането е спряно, докато не се натисне „Запази".
 *
 * След изпращане: офертата става „Изпратена", заявката — „Изпратена
 * оферта"; броячът „Нови заявки" се опреснява веднага (`reportUpdate`).
 */
export const OfferActions = () => {
  const { id } = useDocumentInfo()
  const modified = useFormModified()
  const { config } = useConfig()
  const { reportUpdate } = useDocumentEvents()
  const api = `${config.serverURL ?? ''}${config.routes.api}`

  const [preview, setPreview] = useState<Preview | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!id) {
    return (
      <div style={box}>
        <p style={{ margin: 0, color: 'var(--theme-elevation-500)' }}>
          Запазете офертата — тогава се появяват „Преглед", „Свали PDF" и „Изпрати на клиента".
        </p>
      </div>
    )
  }

  /*
    PDF-ът първо се тегли: ако сървърът върне грешка, тя излиза тук, вместо
    празен таб с JSON. После — отваряне в нов таб или сваляне.
  */
  const pdf = async (download: boolean) => {
    setError('')
    // Табът се отваря веднага (в отговор на клика) — иначе браузърът го спира като изскачащ прозорец.
    const tab = download ? null : window.open('', '_blank')
    try {
      const r = await fetch(`${api}/offers/${id}/pdf`, { credentials: 'include' })
      if (!r.ok || !r.headers.get('content-type')?.includes('application/pdf')) {
        const j = (await r.json().catch(() => ({}))) as { error?: string }
        tab?.close()
        return setError(j.error ?? `PDF-ът не се генерира (код ${r.status}).`)
      }
      const name = /filename="([^"]+)"/.exec(r.headers.get('content-disposition') ?? '')?.[1] ?? 'oferta.pdf'
      const url = URL.createObjectURL(await r.blob())
      if (tab) tab.location.href = url
      else {
        const a = document.createElement('a')
        a.href = url
        a.download = name
        a.click()
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch {
      tab?.close()
      setError('Няма връзка със сървъра — PDF-ът не се зареди.')
    }
  }

  const open = async () => {
    setError('')
    const r = await fetch(`${api}/offers/${id}/send-preview`, { credentials: 'include' })
    if (!r.ok) return setError('Данните за писмото не се заредиха.')
    setPreview((await r.json()) as Preview)
  }

  const send = async (force = false): Promise<void> => {
    if (!preview) return
    setBusy(true)
    setError('')
    try {
      const r = await fetch(`${api}/offers/${id}/send`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: preview.to, subject: preview.subject, text: preview.text, force }),
      })
      const j = (await r.json().catch(() => ({}))) as {
        ok?: boolean
        needConfirm?: boolean
        message?: string
        error?: string
        requestId?: number | null
        sentAt?: string
      }
      if (r.status === 409 && j.needConfirm) {
        setBusy(false)
        if (window.confirm(j.message ?? 'Офертата вече е изпратена. Изпрати отново?')) return send(true)
        return
      }
      if (!r.ok || !j.ok) {
        setError(j.error ?? 'Изпращането не мина.')
        return
      }
      if (j.requestId) reportUpdate({ entitySlug: 'quote-requests', id: j.requestId, operation: 'update', updatedAt: j.sentAt ?? new Date().toISOString() })
      setPreview(null)
      // Статусът и „Изпратена на" са сменени на сървъра — формата се зарежда наново.
      window.location.reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={box}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button buttonStyle="secondary" size="small" margin={false} onClick={() => void pdf(false)} disabled={busy}>
          Преглед
        </Button>
        <Button buttonStyle="secondary" size="small" margin={false} onClick={() => void pdf(true)} disabled={busy}>
          Свали PDF
        </Button>
      </div>
      <Button buttonStyle="primary" size="small" margin={false} onClick={() => void open()} disabled={modified}>
        Изпрати на клиента
      </Button>
      {modified ? (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--theme-elevation-500)' }}>
          PDF-ът е от последния запис — натиснете „Запази", за да влязат промените.
        </p>
      ) : null}
      {error ? <p style={{ margin: 0, fontSize: 13, color: 'var(--theme-error-500)' }}>{error}</p> : null}

      {/*
        Прозорецът — в `body`, над всичко: залепената лента на записа и
        иконите на полетата за дата иначе излизат отгоре.
      */}
      {preview && typeof document !== 'undefined' ? createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Изпращане на офертата"
          style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) setPreview(null)
          }}
        >
          <div style={{ width: '100%', maxWidth: 620, maxHeight: '90vh', overflow: 'auto', background: 'var(--theme-elevation-0)', color: 'var(--theme-text)', borderRadius: 8, padding: 24, boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 16px' }}>Изпращане на офертата</h3>
            {preview.sentAt ? (
              <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--theme-warning-600, #b35a00)' }}>
                Вече е изпращана — при изпращане ще бъдете попитани дали да се изпрати отново.
              </p>
            ) : null}
            <div style={{ marginBottom: 12 }}>
              <label style={label} htmlFor="offer-to">До</label>
              <input id="offer-to" style={input} value={preview.to} onChange={(e) => setPreview({ ...preview, to: e.target.value })} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <span style={label}>Копие</span>
              <span>{preview.cc || '—'}</span>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={label} htmlFor="offer-subject">Тема</label>
              <input id="offer-subject" style={input} value={preview.subject} onChange={(e) => setPreview({ ...preview, subject: e.target.value })} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={label} htmlFor="offer-text">Текст</label>
              <textarea id="offer-text" style={{ ...input, minHeight: 220, resize: 'vertical' }} value={preview.text} onChange={(e) => setPreview({ ...preview, text: e.target.value })} />
            </div>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--theme-elevation-500)' }}>PDF-ът на офертата се прилага към писмото. Отговорът отива на {preview.cc || 'фирмения имейл'}.</p>
            {error ? <p style={{ margin: '0 0 12px', color: 'var(--theme-error-500)' }}>{error}</p> : null}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button buttonStyle="secondary" size="small" margin={false} onClick={() => setPreview(null)} disabled={busy}>
                Отказ
              </Button>
              <Button buttonStyle="primary" size="small" margin={false} onClick={() => void send()} disabled={busy}>
                {busy ? 'Изпращане…' : 'Изпрати'}
              </Button>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  )
}
