'use client'

import { Banner, Button, toast, useConfig, useDocumentInfo } from '@payloadcms/ui'
import { useState } from 'react'

/**
 * Бутон за възстановяване в самия документ на архива.
 *
 * Възстановяването не става веднага — файлът на базата се държи отворен от
 * работещия сървър. Затова се подготвя настрани и се прилага при следващото
 * пускане. Преди това се прави архив на текущото състояние, за да има връщане.
 */
export const RestoreBackupButton = () => {
  const { config } = useConfig()
  const { id } = useDocumentInfo()
  const [busy, setBusy] = useState(false)
  const [staged, setStaged] = useState(false)
  const [confirming, setConfirming] = useState(false)

  if (!id) {
    return (
      <Banner type="info">
        Запишете архива, за да стане достъпно възстановяването.
      </Banner>
    )
  }

  const run = async () => {
    setBusy(true)
    try {
      const res = await fetch(`${config.routes.api}/backups/${id}/restore`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string }

      if (!res.ok || !data.ok) {
        toast.error(data.error ?? 'Възстановяването се провали.')
        return
      }

      setStaged(true)
      setConfirming(false)
      toast.success('Възстановяването е подготвено.')
    } catch (err) {
      toast.error(`Възстановяването се провали: ${(err as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  if (staged) {
    return (
      <Banner type="success">
        <strong>Възстановяването е подготвено.</strong> Спрете сървъра и го пуснете отново, за да
        влезе в сила. Текущото състояние е запазено като отделен архив — ако размислите, изтрийте
        папката <code>.restore-staging</code> преди рестарта.
      </Banner>
    )
  }

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <Banner type="error">
        <strong>Възстановяването заменя цялото съдържание на сайта</strong> — продукти, категории,
        менюта, страници и снимки — с това от архива. Всичко въведено след него се губи.
      </Banner>

      {confirming ? (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '1rem',
            border: '1px solid var(--theme-error-250)',
            borderRadius: '4px',
          }}
        >
          <p style={{ marginTop: 0, fontSize: '0.9rem' }}>
            Сигурни ли сте? Преди замяната автоматично се прави архив на текущото състояние.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button onClick={run} disabled={busy} buttonStyle="error">
              {busy ? 'Подготвя се…' : 'Да, възстанови от този архив'}
            </Button>
            <Button onClick={() => setConfirming(false)} disabled={busy} buttonStyle="secondary">
              Отказ
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: '0.75rem' }}>
          <Button onClick={() => setConfirming(true)} buttonStyle="secondary">
            Възстанови от този архив
          </Button>
        </div>
      )}
    </div>
  )
}

export default RestoreBackupButton
