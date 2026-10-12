'use client'

import { useConfig, useDocumentEvents } from '@payloadcms/ui'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { formatEur } from '@/lib/format'

/**
 * Изгледът на списъка „Цени за одобрение" (`task-dice-odobrenie-ceni.md`, т. 3) —
 * вместо стандартния: оцветени редове, отметки, „Одобри избраните" /
 * „Откажи избраните". Данните — `GET /api/price-approvals/rows`.
 *
 * Оцветяването е само тук: над 10 % → оранжево; над 30 % или новата цена
 * под половината от зачертаната → червено с „⚠ провери". „Избери всички"
 * НЕ избира червените — те се отбелязват един по един, за да няма
 * „одобри всичко без преглед".
 */
type Row = {
  id: number
  productId: number | null
  title: string
  image: string | null
  siteUrl: string | null
  adminUrl: string | null
  sku: string
  currentPrice: number | null
  newPrice: number | null
  currentCompare: number | null
  newCompare: number | null
  changePct: number | null
  changeAbs: number | null
  level: 'ok' | 'orange' | 'red'
  warn: boolean
  xmlDate: string | null
  status: 'pending' | 'approved' | 'rejected'
  decidedBy: string
  decidedAt: string | null
  note: string
  batch: string
}

const СТАТУС: Record<Row['status'], string> = { pending: 'Чака', approved: 'Одобрена', rejected: 'Отказана' }
const ФОН: Record<Row['level'], string> = {
  ok: 'transparent',
  orange: 'rgba(251, 146, 60, 0.16)',
  red: 'rgba(239, 68, 68, 0.16)',
}
const пари = (n: number | null) => (typeof n === 'number' ? formatEur(n) : '—')
const дата = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('bg-BG', { timeZone: 'Europe/Sofia', dateStyle: 'short', timeStyle: 'short' }) : '—'
const промяна = (r: Row) =>
  r.currentPrice === r.newPrice
    ? 'само зачертаната'
    : r.changePct === null
    ? '—'
    : `${r.changePct > 0 ? '+' : ''}${r.changePct.toFixed(1).replace('.', ',')} % (${(r.changeAbs ?? 0) > 0 ? '+' : ''}${пари(r.changeAbs)})`

const cell = { padding: '8px 10px', borderBottom: '1px solid var(--theme-elevation-100)', textAlign: 'left' as const, verticalAlign: 'middle' as const }
const бутон = (primary = false, danger = false) =>
  ({
    padding: '8px 14px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 14,
    border: `1px solid ${danger ? 'var(--theme-error-500)' : 'var(--theme-elevation-800)'}`,
    background: primary ? 'var(--theme-elevation-800)' : 'transparent',
    color: primary ? 'var(--theme-elevation-0)' : danger ? 'var(--theme-error-500)' : 'var(--theme-elevation-800)',
  }) as const

export const PriceApprovalsList = () => {
  const { config } = useConfig()
  const { reportUpdate } = useDocumentEvents()
  const api = `${config.serverURL ?? ''}${config.routes.api}/price-approvals`
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [warn, setWarn] = useState(false)
  const [rows, setRows] = useState<Row[] | null>(null)
  const [избрани, setИзбрани] = useState<Set<number>>(new Set())
  const [бележка, setБележка] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  // `версия` презарежда таблицата след одобрение/отказ.
  const [версия, setВерсия] = useState(0)
  const зареди = useCallback(() => setВерсия((v) => v + 1), [])

  useEffect(() => {
    let жив = true
    const q = new URLSearchParams({ status, ...(from ? { from } : {}), ...(to ? { to } : {}), ...(warn ? { warn: '1' } : {}) })
    fetch(`${api}/rows?${q}`, { credentials: 'include' })
      .then(async (r) => {
        const j = await r.json()
        if (!r.ok) throw new Error(j.error ?? `Грешка ${r.status}`)
        if (!жив) return
        setRows(j.rows)
        setИзбрани(new Set())
        setErr('')
      })
      .catch((e: Error) => жив && setErr(e.message))
    return () => {
      жив = false
    }
  }, [api, status, from, to, warn, версия])

  const чакащи = useMemo(() => (rows ?? []).filter((r) => r.status === 'pending'), [rows])
  const безЧервени = чакащи.filter((r) => r.level !== 'red')
  const всичкиИзбрани = безЧервени.length > 0 && безЧервени.every((r) => избрани.has(r.id))

  const превключи = (id: number) =>
    setИзбрани((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const действие = async (вид: 'approve' | 'reject') => {
    if (!избрани.size) return
    setBusy(true)
    setErr('')
    setMsg('')
    try {
      const r = await fetch(`${api}/${вид}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...избрани], note: бележка }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error ?? `Грешка ${r.status}`)
      setMsg(
        вид === 'approve'
          ? `Одобрени ${j.approved} — цените са на сайта. Номер на одобрението: ${j.batch} (в „История на цените").` +
              (j.errors?.length ? ` ${j.errors.join(' ')}` : '')
          : `Отказани ${j.rejected}. Същата цена от dice няма да излезе отново.`,
      )
      setБележка('')
      // Броячът в менюто се опреснява веднага.
      reportUpdate({ entitySlug: 'price-approvals', operation: 'update', updatedAt: new Date().toISOString() })
      зареди()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="gutter--left gutter--right" style={{ paddingTop: 24, paddingBottom: 48 }}>
      <h1 style={{ margin: '0 0 4px' }}>Цени за одобрение</h1>
      <p style={{ margin: '0 0 18px', color: 'var(--theme-elevation-600)', maxWidth: 820 }}>
        Новите цени от dice.bg в тестов режим. Излизат на сайта чак след „Одобри избраните“. Оранжево — промяна над 10 %;
        червено — над 30 % или новата цена е под половината от зачертаната: отбелязват се само поотделно.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end', marginBottom: 16 }}>
        <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
          Статус
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} style={{ padding: 6 }}>
            <option value="pending">Чака</option>
            <option value="approved">Одобрена</option>
            <option value="rejected">Отказана</option>
            <option value="all">Всички</option>
          </select>
        </label>
        <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
          От дата
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ padding: 5 }} />
        </label>
        <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
          До дата
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ padding: 5 }} />
        </label>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, paddingBottom: 6 }}>
          <input type="checkbox" checked={warn} onChange={(e) => setWarn(e.target.checked)} />
          Само с ⚠
        </label>
      </div>

      {чакащи.length ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
          <button type="button" style={бутон(true)} disabled={busy || !избрани.size} onClick={() => действие('approve')}>
            Одобри избраните ({избрани.size})
          </button>
          <button type="button" style={бутон(false, true)} disabled={busy || !избрани.size} onClick={() => действие('reject')}>
            Откажи избраните
          </button>
          <input
            type="text"
            value={бележка}
            onChange={(e) => setБележка(e.target.value)}
            placeholder="Бележка при отказ (по избор)"
            style={{ padding: 7, minWidth: 260, flex: '0 1 360px' }}
          />
        </div>
      ) : null}
      {msg ? <p style={{ margin: '0 0 12px' }}>{msg}</p> : null}
      {err ? <p style={{ margin: '0 0 12px', color: 'var(--theme-error-500)' }}>{err}</p> : null}

      {rows === null ? (
        <p>Зареждане…</p>
      ) : !rows.length ? (
        <p>{status === 'pending' ? 'Няма цени, които чакат одобрение.' : 'Няма записи по тези филтри.'}</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ color: 'var(--theme-elevation-500)', fontSize: 13 }}>
                <th style={cell}>
                  {безЧервени.length ? (
                    <input
                      type="checkbox"
                      aria-label="Избери всички (без червените)"
                      title="Избери всички — без червените"
                      checked={всичкиИзбрани}
                      onChange={() => setИзбрани(всичкиИзбрани ? new Set() : new Set(безЧервени.map((r) => r.id)))}
                    />
                  ) : null}
                </th>
                <th style={cell}>Продукт</th>
                <th style={cell}>SKU</th>
                <th style={cell}>Сега на сайта</th>
                <th style={cell}>Нова от dice</th>
                <th style={cell}>Промяна</th>
                <th style={cell}>Зачертана: сега → нова</th>
                <th style={cell}>Дата от XML</th>
                <th style={cell}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ background: ФОН[r.level] }}>
                  <td style={cell}>
                    {r.status === 'pending' ? (
                      <input type="checkbox" aria-label={`Избери ${r.title}`} checked={избрани.has(r.id)} onChange={() => превключи(r.id)} />
                    ) : null}
                  </td>
                  <td style={cell}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 240 }}>
                      {r.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.image} alt="" width={44} height={44} style={{ objectFit: 'contain', borderRadius: 4, background: '#fff' }} />
                      ) : (
                        <span style={{ width: 44 }} />
                      )}
                      <div>
                        {r.adminUrl ? <a href={r.adminUrl}>{r.title}</a> : r.title}
                        {r.siteUrl ? (
                          <a href={r.siteUrl} target="_blank" rel="noreferrer" style={{ marginLeft: 8, fontSize: 12 }}>
                            на сайта ↗
                          </a>
                        ) : null}
                        {r.level === 'red' ? <div style={{ color: 'var(--theme-error-500)', fontSize: 12, fontWeight: 600 }}>⚠ провери</div> : null}
                      </div>
                    </div>
                  </td>
                  <td style={cell}>{r.sku || '—'}</td>
                  <td style={cell}>{пари(r.currentPrice)}</td>
                  <td style={{ ...cell, fontWeight: 600 }}>{пари(r.newPrice)}</td>
                  <td style={{ ...cell, fontWeight: 600, whiteSpace: 'nowrap' }}>{промяна(r)}</td>
                  <td style={{ ...cell, whiteSpace: 'nowrap' }}>
                    {пари(r.currentCompare)} → {пари(r.newCompare)}
                  </td>
                  <td style={{ ...cell, whiteSpace: 'nowrap' }}>{дата(r.xmlDate)}</td>
                  <td style={cell}>
                    {СТАТУС[r.status]}
                    {r.status !== 'pending' ? (
                      <div style={{ fontSize: 12, color: 'var(--theme-elevation-600)' }}>
                        {r.decidedBy} · {дата(r.decidedAt)}
                        {r.batch ? ` · ${r.batch}` : ''}
                        {r.note ? <div>„{r.note}“</div> : null}
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
