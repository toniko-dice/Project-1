import type { ReactNode } from 'react'

type Част = { type: 'p'; text: string } | { type: 'ol'; start: number; items: string[] }

const НОМЕР = /^(\d+)[.)]\s+/

/**
 * Отговорът от „Въпроси и отговори" — обикновен текст от админа:
 * всеки ред е абзац, а поредни редове „1. …", „2. …" — номериран списък.
 */
export const частиНаОтговор = (text: string): Част[] => {
  const части: Част[] = []
  for (const ред of text.split(/\r?\n/).map((r) => r.trim()).filter(Boolean)) {
    const m = ред.match(НОМЕР)
    const последна = части.at(-1)
    if (m && последна?.type === 'ol') последна.items.push(ред.slice(m[0].length))
    else if (m) части.push({ type: 'ol', start: Number(m[1]), items: [ред.slice(m[0].length)] })
    else части.push({ type: 'p', text: ред })
  }
  return части
}

/**
 * Показва отговора — на продуктовата страница (`FaqList`) и на `/vaprosi`.
 * `mark` маркира съвпаденията при търсене; `prefix` е пред първия абзац
 * (продуктите, когато отговорите се различават).
 */
export const FaqAnswer = ({
  text,
  mark = (s) => s,
  prefix,
}: {
  text: string
  mark?: (s: string) => ReactNode
  prefix?: ReactNode
}) => {
  const части = частиНаОтговор(text)
  return (
    <div className="space-y-2 text-sm leading-relaxed text-ink-muted">
      {части.map((ч, i) =>
        ч.type === 'p' ? (
          <p key={i}>
            {i === 0 ? prefix : null}
            {mark(ч.text)}
          </p>
        ) : (
          <div key={i}>
            {i === 0 && prefix ? <p>{prefix}</p> : null}
            <ol start={ч.start} className="list-decimal space-y-1 pl-5 marker:text-ink-muted">
              {ч.items.map((t, j) => (
                <li key={j}>{mark(t)}</li>
              ))}
            </ol>
          </div>
        ),
      )}
    </div>
  )
}
