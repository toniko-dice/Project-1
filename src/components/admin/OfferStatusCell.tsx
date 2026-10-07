'use client'

import { OFFER_STATUSES } from '@/lib/offers/calc'

/** Статусът на офертата в списъка — цветно хапче (Чернова / Изпратена / Приета / Отказана). */
export const OfferStatusCell = ({ cellData }: { cellData?: unknown }) => {
  const s = OFFER_STATUSES.find((x) => x.value === cellData)
  if (!s) return <span>{String(cellData ?? '')}</span>
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 999,
        background: `${s.color}1f`,
        color: s.color,
        fontWeight: 600,
        fontSize: 12,
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  )
}
