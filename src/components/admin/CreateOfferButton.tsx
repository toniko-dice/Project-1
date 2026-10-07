'use client'

import { Button, useConfig, useDocumentInfo, useFormModified } from '@payloadcms/ui'
import { useState } from 'react'

/**
 * „Създай оферта" в записа на заявката — нова оферта с данните на
 * клиента, продуктите и бройките (със снимката на заявката) и условията
 * по подразбиране от „Данни за офертите" (`POST /api/offers/from-request/:id`).
 * Отваря новата оферта. Една заявка може да има няколко оферти — виж
 * „Оферти" по-долу.
 */
export const CreateOfferButton = () => {
  const { id } = useDocumentInfo()
  const modified = useFormModified()
  const { config } = useConfig()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (!id) return null

  const create = async () => {
    setBusy(true)
    setError('')
    try {
      const r = await fetch(`${config.serverURL ?? ''}${config.routes.api}/offers/from-request/${id}`, {
        method: 'POST',
        credentials: 'include',
      })
      const j = (await r.json().catch(() => ({}))) as { id?: number; error?: string }
      if (!r.ok || !j.id) return setError(j.error ?? 'Офертата не се създаде.')
      window.location.href = `${config.routes.admin}/collections/offers/${j.id}`
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ padding: '4px 0 20px', borderBottom: '1px solid var(--theme-elevation-100)', marginBottom: 20 }}>
      <Button buttonStyle="primary" size="small" margin={false} onClick={() => void create()} disabled={busy || modified}>
        {busy ? 'Създаване…' : 'Създай оферта'}
      </Button>
      {modified ? (
        <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--theme-elevation-500)' }}>Запазете промените по заявката преди това.</p>
      ) : null}
      {error ? <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--theme-error-500)' }}>{error}</p> : null}
    </div>
  )
}
