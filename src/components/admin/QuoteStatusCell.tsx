'use client'

import { STATUSES } from '@/lib/quote/options'

/**
 * Статусът на заявката в списъка — цветно хапче: нова — оранжево, в
 * работа — синьо, изпратена — сиво, спечелена — зелено, отказана — червено.
 * Цветовете са в `STATUSES` (`src/lib/quote/options.ts`).
 */
export const QuoteStatusCell = ({ cellData }: { cellData?: unknown }) => {
  const s = STATUSES.find((x) => x.value === cellData)
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
