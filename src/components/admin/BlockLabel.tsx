'use client'

import { useRowLabel } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

/*
  Имената на файловете по номер от Медия, общи за целия екран.

  Формата в админа се зарежда с `depth: 0` — полето „Изображение" носи само
  номера. За надписа на реда трябва името на файла, затова се дотегля
  веднъж на снимка и се помни: списък с двайсет секции иначе би направил
  двайсет еднакви заявки при всяко превключване.
*/
const имена = new Map<number, string>()

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

  /*
    Снимката като последен опит за надпис.

    Секция само със снимка (главният банер) няма нито заглавие, нито
    надпис в менюто — в списъка всички такива изглеждат еднакво.
  */
  const изображение = ctx?.data?.image
  const снимка =
    typeof изображение === 'number'
      ? изображение
      : изображение && typeof изображение === 'object'
        ? ((изображение as { id?: number }).id ?? null)
        : null
  const вградено =
    изображение && typeof изображение === 'object'
      ? ((изображение as { filename?: string }).filename ?? null)
      : null

  const [файл, setФайл] = useState<string | null>(вградено ?? (снимка ? (имена.get(снимка) ?? null) : null))

  useEffect(() => {
    if (вградено || снимка === null || имена.has(снимка)) return
    let жив = true
    fetch(`/api/media/${снимка}?depth=0`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { filename?: string } | null) => {
        if (!d?.filename) return
        имена.set(снимка, d.filename)
        if (жив) setФайл(d.filename)
      })
      .catch(() => {
        // Без име на файл надписът остава само с номера на реда.
      })
    return () => {
      жив = false
    }
  }, [снимка, вградено])

  const index = String((ctx?.rowNumber ?? rowNumber ?? 0) + 1).padStart(2, '0')
  const name = rowLabel ?? ''

  const raw = field ? ctx?.data?.[field] : undefined
  const text = typeof raw === 'string' ? raw.trim() : ''

  // Надписът в менюто на страницата е по-полезен от заглавието, ако е зададен.
  const anchor = ctx?.data?.anchorLabel
  const suffix =
    text || (typeof anchor === 'string' && anchor.trim() ? anchor.trim() : (файл ?? ''))

  /*
    Скритата секция трябва да личи от списъка. Иначе собственикът вижда
    секция, търси я на сайта и не я намира — а причината е една отметка,
    която е вътре в блока.
  */
  const скрит = ctx?.data?.hidden === true ? ' (скрит)' : ''

  return (
    <span>
      {suffix ? `${index} · ${name} — ${suffix}` : `${index} · ${name}`}
      {скрит ? <em style={{ opacity: 0.7 }}>{скрит}</em> : null}
    </span>
  )
}

export default BlockLabel
