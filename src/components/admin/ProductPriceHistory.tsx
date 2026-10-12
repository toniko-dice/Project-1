'use client'

import { useAuth, useConfig, useDocumentInfo } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

import { formatEur } from '@/lib/format'

/**
 * „Последни промени на цената" в продукта, група „dice.bg"
 * (`task-dice-odobrenie-ceni.md`, т. 4) — последните 5 от „История на
 * цените" и линк към цялата история на продукта. Само за Администратор и
 * Продажби (историята не е за редактора).
 */
type Запис = {
  id: number
  priceOld?: number | null
  priceNew?: number | null
  compareOld?: number | null
  compareNew?: number | null
  changedPrice?: boolean | null
  changedCompare?: boolean | null
  source?: string | null
  user?: string | null
  createdAt: string
}
const ИЗТОЧНИК: Record<string, string> = {
  approval: 'одобрение', sync: 'синхронизация', admin: 'админ', import: 'внос / скрипт', revert: 'връщане',
}
const пари = (n: number | null | undefined) => (typeof n === 'number' ? formatEur(n) : '—')

export const ProductPriceHistory = () => {
  const { id } = useDocumentInfo()
  const { config } = useConfig()
  const { user } = useAuth<{ role?: string | null }>()
  const вижда = user?.role === 'admin' || user?.role === 'sales'
  const [rows, setRows] = useState<Запис[] | null>(null)
  const admin = config.routes.admin
  const api = `${config.serverURL ?? ''}${config.routes.api}`

  useEffect(() => {
    if (!id || !вижда) return
    fetch(`${api}/price-history?where[product][equals]=${id}&sort=-createdAt&limit=5&depth=0`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((j: { docs: Запис[] }) => setRows(j.docs))
      .catch(() => setRows([]))
  }, [api, id, вижда])

  if (!id || !вижда) return null
  return (
    <div style={{ margin: '8px 0 16px' }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Последни промени на цената</div>
      {rows === null ? (
        <p style={{ margin: 0, fontSize: 13 }}>Зареждане…</p>
      ) : !rows.length ? (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--theme-elevation-600)' }}>Няма записани промени.</p>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
          {rows.map((r) => (
            <li key={r.id} style={{ marginBottom: 4 }}>
              <a href={`${admin}/collections/price-history/${r.id}`}>
                {new Date(r.createdAt).toLocaleString('bg-BG', { timeZone: 'Europe/Sofia', dateStyle: 'short', timeStyle: 'short' })}
              </a>{' '}
              — {r.changedPrice ? `${пари(r.priceOld)} → ${пари(r.priceNew)}` : ''}
              {r.changedPrice && r.changedCompare ? '; ' : ''}
              {r.changedCompare ? `зачертана ${пари(r.compareOld)} → ${пари(r.compareNew)}` : ''} ({ИЗТОЧНИК[r.source ?? ''] ?? r.source}
              {r.user ? `, ${r.user}` : ''})
            </li>
          ))}
        </ul>
      )}
      <a href={`${admin}/collections/price-history?where[product][equals]=${id}`} style={{ fontSize: 13 }}>
        Цялата история на цените →
      </a>
    </div>
  )
}
