import { RichText } from '@payloadcms/richtext-lexical/react'

import type { Page } from '@/payload-types'

type Layout = NonNullable<Page['layout']>
type BlockOf<T extends string> = Extract<Layout[number], { blockType: T }>

/** Стилът на текстовете — като „Текст под списъка" в категориите. */
const PROSE =
  'text-[15px] leading-relaxed text-ink-muted [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_h3]:mb-1 [&_h3]:mt-5 [&_h3]:font-semibold [&_h3]:text-ink [&_li]:mt-1 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-3 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-6 [&>*:first-child]:mt-0'

/* ─────────── Текст ─────────── */

export const RichTextSection = ({ block }: { block: BlockOf<'richText'> }) => {
  if (!block.content?.root?.children?.length && !block.heading) return null
  return (
    <section className="container-site py-6 lg:py-8">
      <div className="mx-auto max-w-[760px]">
        {block.heading ? <h2 className="mb-3 text-xl font-semibold sm:text-2xl">{block.heading}</h2> : null}
        {block.content ? (
          <div className={PROSE}>
            <RichText data={block.content} disableContainer />
          </div>
        ) : null}
      </div>
    </section>
  )
}

/* ─────────── Таблица ─────────── */

/**
 * На компютър — таблица с тънки линии и сив горен ред; еднаквите стойности
 * в първата колона една под друга са една клетка (`rowSpan`). На телефон —
 * картички по първата колона (серия → редове „продукти — срок"): широка
 * таблица с дълги имена там се чете трудно дори със скрол.
 */
export const SimpleTableSection = ({ block }: { block: BlockOf<'simpleTable'> }) => {
  const cols = (block.columns ?? []).map((c) => c.label ?? '')
  const rows = (block.rows ?? []).map((r) => (r.cells ?? []).map((c) => c.value ?? ''))
  if (!rows.length) return null

  // Колко реда обхваща всяка група с еднаква първа клетка.
  const span = rows.map((r, i) => {
    if (i > 0 && rows[i - 1]![0] === r[0]) return 0
    let n = 1
    while (rows[i + n] && rows[i + n]![0] === r[0]) n++
    return n
  })
  const groups = rows.reduce<{ key: string; rows: string[][] }[]>((g, r) => {
    const last = g[g.length - 1]
    if (last && last.key === r[0]) last.rows.push(r)
    else g.push({ key: r[0] ?? '', rows: [r] })
    return g
  }, [])

  return (
    <section className="container-site py-6 lg:py-8">
      <div className="mx-auto max-w-[960px]">
        {block.heading ? <h2 className="mb-4 text-xl font-semibold sm:text-2xl">{block.heading}</h2> : null}

        <table className="hidden w-full border-collapse overflow-hidden rounded-lg bg-surface text-[14px] md:table">
          {cols.length ? (
            <thead>
              <tr className="bg-tile text-left text-ink">
                {cols.map((c, i) => (
                  <th key={i} className="border border-line px-4 py-2.5 font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
          ) : null}
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="align-top">
                {r.map((cell, j) =>
                  j === 0 ? (
                    span[i] ? (
                      <th key={j} rowSpan={span[i]} scope="rowgroup" className="w-[18%] border border-line px-4 py-2.5 text-left font-semibold text-ink">
                        {cell}
                      </th>
                    ) : null
                  ) : (
                    <td key={j} className={`border border-line px-4 py-2.5 ${j === r.length - 1 ? 'w-[30%] font-medium text-ink' : 'text-ink-muted'}`}>
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex flex-col gap-3 md:hidden">
          {groups.map((g, gi) => (
            <div key={gi} className="rounded-lg border border-line bg-surface">
              <p className="border-b border-line bg-tile px-4 py-2 font-semibold">{g.key}</p>
              <ul className="divide-y divide-line">
                {g.rows.map((r, ri) => (
                  <li key={ri} className="flex items-start justify-between gap-3 px-4 py-2.5 text-[14px]">
                    <span className="text-ink-muted">{r.slice(1, -1).join(' · ')}</span>
                    <span className="max-w-[45%] text-right font-medium">{r[r.length - 1]}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {block.note ? <p className="mt-3 text-[13px] text-ink-muted">{block.note}</p> : null}
      </div>
    </section>
  )
}
