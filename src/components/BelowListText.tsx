import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'
import { RichText } from '@payloadcms/richtext-lexical/react'

import type { Category } from '@/payload-types'
import { ShowMore } from './ShowMore'

/** Над толкова думи текстът се свива до три реда. */
const ДУМИ = 150

/**
 * „Текст под списъка" на категорията (`belowList`, т. 13) — под продуктите
 * и под линка „Аксесоари за …". Ширината е тази на описанието под
 * заглавието — удобен за четене ред, не цялата мрежа с карти.
 */
export const BelowListText = ({ data }: { data: Category['belowList'] }) => {
  if (!data?.root?.children?.length) return null
  const думи = convertLexicalToPlaintext({ data }).split(/\s+/).filter(Boolean).length
  if (!думи) return null

  return (
    <section className="mx-auto mt-14 max-w-[56rem] text-[15px] leading-relaxed text-ink-muted [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-medium [&_h2]:text-ink [&_h3]:mb-1 [&_h3]:mt-4 [&_h3]:font-medium [&_h3]:text-ink [&_li]:mt-1 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-3 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-6 [&>div>div>*:first-child]:mt-0">
      <ShowMore collapsed={думи > ДУМИ}>
        <RichText data={data} disableContainer />
      </ShowMore>
    </section>
  )
}
