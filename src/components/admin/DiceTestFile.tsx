'use client'

import { useConfig, useFormFields } from '@payloadcms/ui'
import { useRef, useState } from 'react'

/**
 * „Качи XML файл за тест" в „Връзка с dice.bg" (`task-dice-odobrenie-ceni.md`,
 * т. 1). Файлът отива в настройките (`POST /api/dice-syncs/upload`) и
 * „Провери" / „Синхронизирай сега" го ползват вместо адреса, докато не се
 * махне („Махни качения файл"). Записва се веднага — без „Запази".
 */
export const DiceTestFile = () => {
  const { config } = useConfig()
  const api = `${config.serverURL ?? ''}${config.routes.api}/dice-syncs`
  const име = useFormFields(([f]) => f.testFileName?.value as string | undefined)
  const кога = useFormFields(([f]) => f.testFileAt?.value as string | undefined)
  const [файл, setФайл] = useState<{ name: string; at: string } | null>(null)
  const [махнат, setМахнат] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const input = useRef<HTMLInputElement>(null)

  const текущ = махнат ? null : (файл ?? (име ? { name: име, at: кога ?? '' } : null))

  const качи = async (f: File) => {
    setBusy(true)
    setErr('')
    setMsg('')
    try {
      const r = await fetch(`${api}/upload`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/xml', 'x-file-name': encodeURIComponent(f.name) },
        body: await f.text(),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error ?? `Грешка ${r.status}`)
      setФайл({ name: j.name, at: j.at })
      setМахнат(false)
      setMsg(
        `Качен — „Провери" и „Синхронизирай сега" ползват този файл.` +
          (j.warning ? ` Внимание: ${j.warning} (с такъв файл синхронизацията спира без промени).` : ''),
      )
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  const махни = async () => {
    setBusy(true)
    setErr('')
    try {
      const r = await fetch(`${api}/clear-upload`, { method: 'POST', credentials: 'include' })
      if (!r.ok) throw new Error((await r.json()).error ?? `Грешка ${r.status}`)
      setФайл(null)
      setМахнат(true)
      setMsg('Каченият файл е махнат — ползва се адресът.')
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ margin: '0 0 24px', padding: 14, borderRadius: 4, border: '1px dashed var(--theme-elevation-250)' }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Качи XML файл за тест</div>
      <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--theme-elevation-600)' }}>
        Вместо адреса, докато файлът още не е публикуван онлайн. Автоматичният режим ползва само адреса.
      </p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          ref={input}
          type="file"
          accept=".xml,application/xml,text/xml"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void качи(f)
          }}
        />
        {текущ ? (
          <button
            type="button"
            onClick={махни}
            disabled={busy}
            style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid var(--theme-elevation-400)', background: 'transparent', cursor: 'pointer' }}
          >
            Махни качения файл
          </button>
        ) : null}
      </div>
      <p style={{ margin: '8px 0 0', fontSize: 13 }}>
        {текущ ? (
          <>
            Ползва се: <b>{текущ.name}</b> (качен {текущ.at})
          </>
        ) : (
          'Няма качен файл — ползва се адресът.'
        )}
      </p>
      {msg ? <p style={{ margin: '6px 0 0', fontSize: 13 }}>{msg}</p> : null}
      {err ? <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--theme-error-500)' }}>{err}</p> : null}
    </div>
  )
}
