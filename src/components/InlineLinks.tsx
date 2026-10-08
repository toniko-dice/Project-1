import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * Текст от админа с линкове като `[Пишете ни](/kontakti)` — за кратките
 * уводи в „Въпроси и Контакти". Вътрешен адрес — `Link`; външен — нов таб.
 */
export const InlineLinks = ({ text, className = 'font-medium text-ink underline underline-offset-4' }: { text: string; className?: string }) => {
  const части: ReactNode[] = []
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g
  let last = 0
  for (const m of text.matchAll(re)) {
    if (m.index > last) части.push(text.slice(last, m.index))
    const [, label, href] = m
    части.push(
      href!.startsWith('/') ? (
        <Link key={m.index} href={href!} className={className}>
          {label}
        </Link>
      ) : (
        <a key={m.index} href={href} target="_blank" rel="noopener noreferrer" className={className}>
          {label}
        </a>
      ),
    )
    last = m.index + m[0].length
  }
  if (last < text.length) части.push(text.slice(last))
  return <>{части}</>
}
