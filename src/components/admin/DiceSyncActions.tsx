'use client'

import { useConfig, useFormModified } from '@payloadcms/ui'
import { useState } from 'react'

/**
 * Бутоните в „Връзка с dice.bg": „Провери (без запис)" и „Синхронизирай
 * сега" (`POST /api/dice-syncs/check` и `/run`). Проверката показва какво БИ
 * се сменило; нищо не записва.
 */
type Change = { product: string; field: string; old: string; new: string }
type Price = {
  title: string
  currentPrice: number | null
  newPrice: number
  currentCompare: number | null
  newCompare: number | null
  pct: number | null
  level: 'ok' | 'orange' | 'red'
  rejected: boolean
}
type Check = {
  mode: 'test' | 'auto'
  source: string
  prices: Price[]
  rows: number
  matched: number
  toUpdate: number
  unchanged: number
  skippedNoSync: number
  changes: Change[]
  notFound: { sku: string; ean: string; name: string }[]
  missingInFile: { title: string }[]
  withoutIds: { title: string }[]
  errors: string[]
  warnings: string[]
  skipped: string[]
  irregular: { sku: string; name: string; ean: string; problem: string }[]
  abort: string | null
}

const евро = new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })
const пари = (n: number | null) => (typeof n === 'number' ? евро.format(n) : '—')
const процент = (p: Price) => (p.pct === null ? '—' : `${p.pct > 0 ? '+' : ''}${p.pct.toFixed(1).replace('.', ',')} %`)

const cell = { padding: '4px 8px', borderBottom: '1px solid var(--theme-elevation-100)', textAlign: 'left' as const, verticalAlign: 'top' as const }

const Table = ({ title, head, rows }: { title: string; head: string[]; rows: string[][] }) =>
  rows.length ? (
    <details open={rows.length <= 30} style={{ marginTop: 16 }}>
      <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
        {title} ({rows.length})
      </summary>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 6 }}>
        <thead>
          <tr style={{ color: 'var(--theme-elevation-500)' }}>
            {head.map((h) => (
              <th key={h} style={cell}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} style={cell}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  ) : null

export const DiceSyncActions = () => {
  const { config } = useConfig()
  const modified = useFormModified()
  const api = `${config.serverURL ?? ''}${config.routes.api}/dice-syncs`
  const [busy, setBusy] = useState<'' | 'check' | 'run'>('')
  const [check, setCheck] = useState<Check | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const call = async (kind: 'check' | 'run') => {
    if (kind === 'run' && !window.confirm('Да се обновят ли цените и наличностите от файла на dice.bg сега?')) return
    setBusy(kind)
    setError('')
    setMessage('')
    if (kind === 'check') setCheck(null)
    try {
      const r = await fetch(`${api}/${kind}`, { method: 'POST', credentials: 'include' })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error ?? `Грешка ${r.status}`)
      if (kind === 'check') setCheck(j as Check)
      else setMessage(`${j.message} Подробностите са в „Синхронизации с dice". Презаредете страницата за „Последна синхронизация".`)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy('')
    }
  }

  const btn = (primary: boolean) =>
    ({
      padding: '8px 16px',
      borderRadius: 4,
      cursor: busy ? 'wait' : 'pointer',
      fontSize: 14,
      border: '1px solid var(--theme-elevation-800)',
      background: primary ? 'var(--theme-elevation-800)' : 'transparent',
      color: primary ? 'var(--theme-elevation-0)' : 'var(--theme-elevation-800)',
    }) as const

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" style={btn(false)} disabled={Boolean(busy)} onClick={() => call('check')}>
          {busy === 'check' ? 'Проверка…' : 'Провери (без запис)'}
        </button>
        <button type="button" style={btn(true)} disabled={Boolean(busy)} onClick={() => call('run')}>
          {busy === 'run' ? 'Синхронизиране…' : 'Синхронизирай сега'}
        </button>
      </div>
      {modified ? (
        <p style={{ fontSize: 13, color: 'var(--theme-warning-600, #b45309)', margin: '8px 0 0' }}>
          Има незаписани промени — бутоните ползват записаните настройки. Натиснете „Запази“ първо.
        </p>
      ) : null}
      {error ? <p style={{ color: 'var(--theme-error-500)', margin: '10px 0 0' }}>{error}</p> : null}
      {message ? <p style={{ margin: '10px 0 0' }}>{message}</p> : null}
      {check ? (
        <div style={{ marginTop: 14, padding: 14, borderRadius: 4, background: 'var(--theme-elevation-50)' }}>
          {check.abort ? (
            <p style={{ color: 'var(--theme-error-500)', fontWeight: 600, margin: '0 0 8px' }}>
              Истинското пускане би спряло без промени: {check.abort}
            </p>
          ) : null}
          <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--theme-elevation-600)' }}>
            Режим: <b>{check.mode === 'auto' ? 'Автоматичен' : 'Тестов'}</b> · файл: {check.source}
          </p>
          <p style={{ margin: 0 }}>
            Редове във файла: <b>{check.rows}</b> · съвпаднали: <b>{check.matched}</b> · биха се обновили:{' '}
            <b>{check.toUpdate}</b> · без промяна: <b>{check.unchanged}</b>
            {check.skippedNoSync ? (
              <>
                {' '}
                · „Не синхронизирай“: <b>{check.skippedNoSync}</b>
              </>
            ) : null}
          </p>
          <Table
            title={check.mode === 'auto' ? 'Нови цени (записват се направо)' : 'Цени, които биха влезли за одобрение'}
            head={['Продукт', 'Сега', 'Нова', 'Промяна', 'Зачертана: сега → нова', '']}
            rows={check.prices.map((p) => [
              p.title,
              пари(p.currentPrice),
              пари(p.newPrice),
              процент(p),
              `${пари(p.currentCompare)} → ${пари(p.newCompare)}`,
              p.rejected ? 'вече отказана — няма да излезе' : p.level === 'red' ? '⚠ провери' : p.level === 'orange' ? 'над 10 %' : '',
            ])}
          />
          <Table
            title={check.mode === 'auto' ? 'Промени' : 'Наличност и брой (записват се веднага)'}
            head={['Продукт', 'Поле', 'Сега', 'Ще стане']}
            rows={check.changes.map((c) => [c.product, c.field, c.old, c.new])}
          />
          <Table title="Грешки" head={['Описание']} rows={check.errors.map((e) => [e])} />
          <Table title="Предупреждения" head={['Описание']} rows={check.warnings.map((e) => [e])} />
          <Table title="Ненамерени в сайта (EcoFlow)" head={['Име', 'Identifier', 'EAN']} rows={check.notFound.map((r) => [r.name, r.sku, r.ean])} />
          <Table title="Пропуснати редове (друг артикул в dice със същия EAN)" head={['Описание']} rows={check.skipped.map((e) => [e])} />
          <Table title="Нередности във файла на dice" head={['Име', 'Identifier', 'EAN', 'Нередност']} rows={check.irregular.map((r) => [r.name, r.sku, r.ean, r.problem])} />
          <Table title="Наши продукти без SKU и EAN" head={['Продукт']} rows={check.withoutIds.map((p) => [p.title])} />
          <Table title="Наши продукти, които липсват във файла" head={['Продукт']} rows={check.missingInFile.map((p) => [p.title])} />
        </div>
      ) : null}
    </div>
  )
}
