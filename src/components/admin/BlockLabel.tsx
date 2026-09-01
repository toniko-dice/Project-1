'use client'

import { useRowLabel } from '@payloadcms/ui'

type Props = {
  /** Поле от блока, чиято стойност да се покаже след името на блока. */
  field?: string
  /** Име на блока, подадено от Payload. */
  blockType?: string
  rowLabel?: string
  rowNumber?: number
}

/**
 * Надпис на блок в списъка „Секции на страницата".
 *
 * Без него два блока от един и същи вид изглеждат еднакво и трябва да
 * отвориш всеки, за да разбереш кой е. Тук след името на блока се показва
 * заглавието му, ако е попълнено.
 */
export const BlockLabel = ({ field, rowLabel, rowNumber }: Props) => {
  const ctx = useRowLabel<Record<string, unknown>>()

  const index = String((ctx?.rowNumber ?? rowNumber ?? 0) + 1).padStart(2, '0')
  const name = rowLabel ?? ''

  const raw = field ? ctx?.data?.[field] : undefined
  const text = typeof raw === 'string' ? raw.trim() : ''

  // Надписът в менюто на страницата е по-полезен от заглавието, ако е зададен.
  const anchor = ctx?.data?.anchorLabel
  const suffix = text || (typeof anchor === 'string' ? anchor.trim() : '')

  return <span>{suffix ? `${index} · ${name} — ${suffix}` : `${index} · ${name}`}</span>
}

export default BlockLabel
