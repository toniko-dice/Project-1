'use client'

import { MESSAGE_STATUSES } from '@/lib/contact'

/** Статусът на съобщението в списъка — цветно хапче, като `QuoteStatusCell`. */
export const MessageStatusCell = ({ cellData }: { cellData?: unknown }) => {
  const s = MESSAGE_STATUSES.find((x) => x.value === cellData)
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
