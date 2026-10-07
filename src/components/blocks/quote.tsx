import type { ReactNode } from 'react'

import type { Category, Page } from '@/payload-types'
import { parentId } from '@/lib/tree'
import { productCardData, tileImage } from '@/lib/media'
import { getCatalog, getGlobal, getProductsByIds } from '@/lib/payload'
import { QuoteFormClient, type QuoteProduct, type QuoteTab } from '../QuoteForm'

type Layout = NonNullable<Page['layout']>
type BlockOf<T extends string> = Extract<Layout[number], { blockType: T }>

/* ─────────── Заглавие на страницата (H1) ─────────── */

export const PageIntroBlock = ({ block }: { block: BlockOf<'pageIntro'> }) => (
  <section className="container-site pb-4 pt-10 lg:pb-6 lg:pt-14">
    <div className="max-w-3xl">
      <h1 className="text-[28px] font-semibold leading-tight tracking-tight sm:text-4xl lg:text-[44px]">
        {block.heading}
      </h1>
      {block.body ? (
        <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-ink-muted sm:text-lg">{block.body}</p>
      ) : null}
      {block.ctaLabel && block.ctaUrl ? (
        <a
          href={block.ctaUrl}
          className="mt-6 inline-flex h-12 cursor-pointer items-center justify-center rounded-full bg-ink px-7 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-night"
        >
          {block.ctaLabel}
        </a>
      ) : null}
    </div>
  </section>
)

/* ─────────── Форма за оферта ─────────── */

/** „{телефон}" и „{имейл}" → линкове с данните от „Общи настройки" (същите като във футъра). */
const withContacts = (text: string, phone: string, email: string): ReactNode[] =>
  text.split(/(\{телефон\}|\{имейл\})/).map((part, i) => {
    if (part === '{телефон}') {
      return phone ? (
        <a key={i} href={`tel:${phone.replace(/\s/g, '')}`} className="font-medium text-ink underline underline-offset-4">
          {phone}
        </a>
      ) : null
    }
    if (part === '{имейл}') {
      return email ? (
        <a key={i} href={`mailto:${email}`} className="font-medium text-ink underline underline-offset-4">
          {email}
        </a>
      ) : null
    }
    return part
  })

/**
 * Продуктите на формата — ВСИЧКИ публикувани (`getCatalog`), по реда на
 * категориите: дървото обходено отгоре надолу по `_order`, после `_order`
 * на продукта. Табът е категория с разклонението ѝ; продукт в две
 * категории е и в двата таба. Снимката е изрязаният вариант (`trimmed`).
 */
export const QuoteFormBlock = async ({ block }: { block: BlockOf<'quoteForm'> }) => {
  const [catalog, settings] = await Promise.all([getCatalog(), getGlobal('site-settings')])

  // Редът на категориите: обхождане на дървото в дълбочина.
  const място = new Map<number, number>()
  const деца = (id: number | null) => catalog.tree.filter((c) => parentId(c) === id)
  const обходи = (id: number | null) => {
    for (const c of деца(id)) {
      място.set(c.id, място.size)
      обходи(c.id)
    }
  }
  обходи(null)
  const ключ = (cats: number[]) => Math.min(...cats.map((c) => място.get(c) ?? 1e9))

  const entries = [...catalog.entries].sort(
    (a, b) => ключ(a.categories) - ключ(b.categories) || a.order.localeCompare(b.order),
  )

  // Табовете от блока; празно — главните категории.
  const зададени = (block.tabs ?? [])
    .map((t) => ({ label: t.label?.trim() ?? '', category: t.category && typeof t.category === 'object' ? (t.category as Category) : null }))
    .filter((t) => t.category)
  const табове = зададени.length
    ? зададени.map((t) => ({ label: t.label || t.category!.title, id: t.category!.id }))
    : деца(null).map((c) => ({ label: c.title, id: c.id }))

  const tabs: QuoteTab[] = табове
    .map((t) => {
      const клон = catalog.branch(t.id)
      return { label: t.label, ids: entries.filter((e) => e.categories.some((c) => клон.has(c))).map((e) => e.id) }
    })
    .filter((t) => t.ids.length)

  const всички = [...new Set(tabs.flatMap((t) => t.ids))]
  const cards = await getProductsByIds(всички)
  const products: QuoteProduct[] = всички
    .filter((id) => cards[id])
    .map((id) => {
      const p = cards[id]!
      const d = productCardData(p)
      // Готов малък файл (до 240 px) — без оптимизатора на Next.
      const img = tileImage(p.image)
      return {
        id,
        title: d.title,
        image: img.url,
        trimmed: img.trimmed,
        // Търсенето е в браузъра: име, ред със спецификации, адрес, SKU — с малки букви.
        search: [d.title, p.tagline, p.slug, p.sku].filter(Boolean).join(' ').toLowerCase(),
      }
    })
  const налични = new Set(products.map((p) => p.id))

  const phone = settings.phone ?? ''
  const email = settings.email ?? ''
  const anchor = block.formAnchor?.trim() || 'zayavka'

  return (
    <section id={anchor} className="container-site scroll-mt-4 py-8 lg:py-12">
      <div className="mx-auto max-w-5xl">
        {block.heading ? (
          <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{block.heading}</h2>
        ) : null}
        {block.intro ? <p className="mt-2 text-[15px] text-ink-muted">{block.intro}</p> : null}

        <QuoteFormClient
          products={products}
          tabs={tabs.map((t) => ({ ...t, ids: t.ids.filter((id) => налични.has(id)) }))}
          privacyUrl={block.privacyUrl || '/poveritelnost'}
          texts={{
            successTitle: block.successTitle || 'Благодарим! Заявка № {номер} е получена.',
            successText: block.successText || '',
            successCopy: block.successCopy || '',
            successButton: block.successButton || 'Към началната страница',
          }}
        />

        {block.below ? (
          <p className="mt-6 text-center text-[15px] text-ink-muted">{withContacts(block.below, phone, email)}</p>
        ) : null}
      </div>
    </section>
  )
}
