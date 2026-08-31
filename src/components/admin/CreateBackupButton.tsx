'use client'

import { Button, toast, useConfig } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

/**
 * Бутон над списъка с архиви.
 *
 * Архивирането минава през endpoint-а на колекцията, защото самото сглобяване
 * (снимка на базата + zip на снимките) е сървърна работа.
 */
export const CreateBackupButton = () => {
  const { config } = useConfig()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [label, setLabel] = useState('')
  const [includeMedia, setIncludeMedia] = useState(true)

  const run = async () => {
    setBusy(true)
    try {
      const res = await fetch(`${config.routes.api}/backups/create-now`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, includeMedia }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string; removed?: number }

      if (!res.ok || !data.ok) {
        toast.error(data.error ?? 'Архивирането се провали.')
        return
      }

      toast.success(
        data.removed
          ? `Архивът е готов. Изтрити стари архиви: ${data.removed}.`
          : 'Архивът е готов.',
      )
      setLabel('')
      router.refresh()
    } catch (err) {
      toast.error(`Архивирането се провали: ${(err as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        padding: '1rem',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: '4px',
        background: 'var(--theme-elevation-50)',
      }}
    >
      <div style={{ flex: '1 1 18rem', minWidth: 0 }}>
        <label
          htmlFor="backup-label"
          style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem' }}
        >
          Име на архива (по желание)
        </label>
        <input
          id="backup-label"
          type="text"
          value={label}
          disabled={busy}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Напр. Преди пренареждане на менюто"
          style={{
            width: '100%',
            minHeight: '2.75rem',
            padding: '0 0.75rem',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: '4px',
            background: 'var(--theme-input-bg)',
            color: 'var(--theme-elevation-800)',
          }}
        />
      </div>

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          minHeight: '2.75rem',
          fontSize: '0.85rem',
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={includeMedia}
          disabled={busy}
          onChange={(e) => setIncludeMedia(e.target.checked)}
        />
        Включи снимките
      </label>

      <Button onClick={run} disabled={busy} buttonStyle="primary">
        {busy ? 'Архивира се…' : 'Създай архив сега'}
      </Button>
    </div>
  )
}

export default CreateBackupButton
