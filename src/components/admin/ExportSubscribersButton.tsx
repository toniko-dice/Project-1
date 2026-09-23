'use client'

import { useState } from 'react'

type Subscriber = {
  email?: string
  subscribedAt?: string
  status?: string
  source?: string
}

/** Обгражда с кавички стойност, която съдържа запетая, кавичка или нов ред. */
const csvCell = (value: unknown): string => {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/**
 * Бутон „Изтегли CSV" над списъка с абонати.
 *
 * Тегли активните през същото API, което ползва и админът — правата се
 * проверяват от сървъра по бисквитката на сесията, тук няма отделен достъп.
 *
 * Файлът се сглобява в браузъра. Нарочно: сървърен път за износ би бил
 * още едно място, което трябва да пази списъка от чужди очи.
 *
 * Разделителят е точка и запетая, а файлът започва с BOM — иначе Excel на
 * български Windows отваря кирилицата като въпросителни и слага целия ред
 * в една клетка.
 */
export const ExportSubscribersButton = () => {
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const download = async () => {
    setWorking(true)
    setError(null)

    try {
      const rows: Subscriber[] = []
      let page = 1

      // Списъкът може да надхвърли една страница — теглим, докато има още.
      for (;;) {
        const res = await fetch(
          `/api/subscribers?where[status][equals]=active&limit=500&page=${page}&depth=0&sort=-subscribedAt`,
          { credentials: 'include' },
        )
        if (!res.ok) throw new Error(`Сървърът върна ${res.status}`)

        const data = (await res.json()) as { docs?: Subscriber[]; hasNextPage?: boolean }
        rows.push(...(data.docs ?? []))
        if (!data.hasNextPage) break
        page += 1
      }

      const header = ['email', 'subscribedAt', 'status', 'source']
      const body = rows.map((r) =>
        [r.email, r.subscribedAt, r.status, r.source].map(csvCell).join(';'),
      )
      const csv = '﻿' + [header.join(';'), ...body].join('\r\n')

      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `abonati-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setWorking(false)
    }
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <button type="button" className="btn btn--style-secondary" onClick={download} disabled={working}>
        {working ? 'Подготвя се…' : 'Изтегли CSV'}
      </button>
      {error ? (
        <p style={{ marginTop: '0.5rem', color: 'var(--theme-error-500)' }}>
          Износът се провали: {error}
        </p>
      ) : null}
    </div>
  )
}

export default ExportSubscribersButton
