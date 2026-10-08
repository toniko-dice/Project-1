import { uniqueAnchor } from './anchors'

type Възел = { type?: string; tag?: string; text?: string; children?: Възел[] }

/** Видимият текст на възел от rich text — с всичките му деца. */
export const текстНа = (n: Възел): string => n.text ?? (n.children ?? []).map(текстНа).join('')

/**
 * Заглавията H2 на един блок „Текст" с котвите им — по реда в текста.
 *
 * Едно правило за двете места: блокът слага `id` на H2 (`RichTextSection`),
 * а съдържанието на правните страници води към същите котви. Котвата е от
 * текста („1. Общи положения" → `#1-obshti-polozheniya`), уникална в
 * блока.
 */
export const заглавияH2 = (content: unknown): { id: string; text: string }[] => {
  const root = (content as { root?: Възел } | null | undefined)?.root
  const used = new Set<string>()
  return (root?.children ?? [])
    .filter((n) => n.type === 'heading' && n.tag === 'h2')
    .map((n) => {
      const text = текстНа(n).trim()
      return { id: uniqueAnchor(text, used), text }
    })
  // Празно заглавие също заема място — иначе котвите на следващите се разместват.
}
