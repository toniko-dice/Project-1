'use client'

/**
 * Клетка за връзка в списъчния изглед.
 *
 * Вграденият изглед на Payload изписва „‹Няма Категория›“ дори когато връзката
 * е попълнена. Тази клетка чете подадения документ и показва заглавието му.
 */
export const RelationshipCell = ({ cellData }: { cellData?: unknown }) => {
  if (cellData && typeof cellData === 'object') {
    const doc = cellData as Record<string, unknown>
    for (const key of ['title', 'label', 'name']) {
      if (typeof doc[key] === 'string' && (doc[key] as string).trim()) {
        return <span>{(doc[key] as string).trim()}</span>
      }
    }
  }

  if (typeof cellData === 'string' && cellData.trim()) return <span>{cellData}</span>
  if (typeof cellData === 'number') return <span>#{cellData}</span>

  return <span style={{ opacity: 0.5 }}>—</span>
}

export default RelationshipCell
