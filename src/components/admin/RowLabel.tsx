'use client'

import { useRowLabel } from '@payloadcms/ui'

type Props = {
  /** Поле от реда, чиято стойност да се покаже. Може да е и връзка — тогава се взима заглавието ѝ. */
  field?: string
  /** Дума за реда, когато полето е празно. Напр. „Точка" → „Точка 03". */
  fallback?: string
}

/** Измъква четим надпис от стойност, която може да е текст или свързан документ. */
const readable = (value: unknown): string => {
  if (typeof value === 'string') return value.trim()
  if (value && typeof value === 'object') {
    const doc = value as Record<string, unknown>
    for (const key of ['title', 'label', 'heading', 'name']) {
      if (typeof doc[key] === 'string' && (doc[key] as string).trim()) {
        return (doc[key] as string).trim()
      }
    }
  }
  return ''
}

/**
 * Надпис на ред в масив вътре в админа.
 *
 * Без него Payload изписва „Точка 01", „Точка 02" и трябва да отваряш всеки ред,
 * за да разбереш кой е. Тук показваме номера плюс истинското име.
 */
export const RowLabel = ({ field, fallback = 'Ред' }: Props) => {
  const { data, rowNumber } = useRowLabel<Record<string, unknown>>()

  const index = String((rowNumber ?? 0) + 1).padStart(2, '0')
  const text = field ? readable(data?.[field]) : ''

  return <span>{text ? `${index} · ${text}` : `${fallback} ${index}`}</span>
}

export default RowLabel
