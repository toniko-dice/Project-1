/**
 * „Често задавани въпроси" (`/vaprosi`) — всички въпроси от блоковете
 * „Въпроси и отговори", събрани от базата при всяко пресъздаване:
 * публикуваните продукти, категориите и страниците.
 *
 * Групите и подгрупите са в `src/lib/faq-groups.ts` (6 групи в лентата,
 * подробното деление — подгрупи с H3; `task-vaprosi-lenta-6-grupi.md`).
 * Еднакъв въпрос (без главни букви и препинателни знаци) е ВЕДНЪЖ на
 * страницата — в първата група и подгрупа по реда от конфигурацията. В една
 * подгрупа различните отговори на същия въпрос остават — всеки с
 * продуктите, от които е.
 *
 * Сървърен модул. Връща малък обект — в кеша на четенията влиза само той,
 * не секциите на продуктите (`unstable_cache` не пази над 2 MB, т. 14).
 */
import type { Category } from '@/payload-types'

import { FAQ_GROUPS } from './faq-groups'
import { categoryPath, productPath } from './urls'
import { slugify } from './slug'

export type FaqSource = { title: string; url: string; kind: 'product' | 'page' | 'category' }
export type FaqAnswer = { text: string; sources: FaqSource[] }
export type FaqItem = { id: string; question: string; answers: FaqAnswer[] }
/** Подгрупа — `title` празно, когато групата е само тя (без H3). */
export type FaqSubgroup = { id: string; title: string; items: FaqItem[] }
export type FaqGroup = { id: string; title: string; subgroups: FaqSubgroup[] }

type Въпрос = { question?: string | null; answer?: string | null }
type Блок = { blockType?: string; hidden?: boolean | null; items?: Въпрос[] | null }

/** Ключът за сравнение: малки букви, без препинателни знаци и излишни интервали. */
export const нормален = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

/** Всички въпроси на групата, по реда на подгрупите. */
export const въпросиНа = (g: FaqGroup): FaqItem[] => g.subgroups.flatMap((s) => s.items)

/** Въпросите от видимите блокове „Въпроси и отговори". */
const въпросиОт = (блокове: Блок[] | null | undefined): { question: string; answer: string }[] =>
  (блокове ?? []).flatMap((b) =>
    b.blockType === 'faqBlock' && !b.hidden
      ? (b.items ?? [])
          .filter((q) => q.question?.trim() && q.answer?.trim())
          .map((q) => ({ question: q.question!.trim(), answer: q.answer!.trim() }))
      : [],
  )

/**
 * Сглобява групите — без заявки: продуктите, страниците, категориите и
 * дървото идват отвън (`getFaqGroups` в `payload.ts`).
 */
export const сглобиВъпроси = ({
  tree,
  products,
  pages,
  categories,
}: {
  tree: Category[]
  products: {
    title: string
    slug: string
    category?: number | { id: number } | null
    categorySlug?: string | null
    categoryParentSlug?: string | null
    categoryGrandparentSlug?: string | null
    sections?: Блок[] | null
  }[]
  pages: { title: string; slug: string; layout?: Блок[] | null }[]
  categories: { id: number; title: string; slug: string; layout?: Блок[] | null }[]
}): FaqGroup[] => {
  const поНомер = new Map(tree.map((c) => [c.id, c]))
  const родител = (c: Category) => (typeof c.parent === 'object' ? c.parent?.id : c.parent) ?? null
  /** Категорията и всичко над нея — slug-овете, отдолу нагоре. */
  const верига = (id: number | null | undefined): string[] => {
    const out: string[] = []
    for (let c = id != null ? поНомер.get(id) : undefined; c; c = родител(c) != null ? поНомер.get(родител(c)!) : undefined) {
      out.push(c.slug)
    }
    return out
  }

  /* Ключ на подгрупа: `<група>/<подгрупа>`; резервните — `<група>/+<slug>`. */
  const резервна = FAQ_GROUPS.find((g) => g.fallback) ?? FAQ_GROUPS.at(-1)!
  const заКатегория = (id: number | null | undefined): { ключ: string; заглавие: string } => {
    const slugs = верига(id)
    for (const g of FAQ_GROUPS) {
      for (const s of g.subgroups) {
        if (s.categories?.some((c) => slugs.includes(c))) return { ключ: `${g.id}/${s.id}`, заглавие: s.title }
      }
    }
    const c = id != null ? поНомер.get(id) : undefined
    return { ключ: `${резервна.id}/+${c?.slug ?? 'drugi'}`, заглавие: c?.title ?? 'Други' }
  }
  const заСтраница = (slug: string, title: string): { ключ: string; заглавие: string } => {
    for (const g of FAQ_GROUPS) {
      for (const s of g.subgroups) if (s.pages?.includes(slug)) return { ключ: `${g.id}/${s.id}`, заглавие: s.title }
    }
    return { ключ: `${резервна.id}/+${slug}`, заглавие: title }
  }

  type Сбор = { заглавие: string; въпроси: Map<string, { question: string; answers: Map<string, FaqAnswer> }> }
  const подгрупи = new Map<string, Сбор>()
  const добави = (къде: { ключ: string; заглавие: string }, q: { question: string; answer: string }, src: FaqSource) => {
    const g = подгрупи.get(къде.ключ) ?? { заглавие: къде.заглавие, въпроси: new Map() }
    подгрупи.set(къде.ключ, g)
    const k = нормален(q.question)
    const item = g.въпроси.get(k) ?? { question: q.question, answers: new Map() }
    g.въпроси.set(k, item)
    const a: FaqAnswer = item.answers.get(нормален(q.answer)) ?? { text: q.answer, sources: [] }
    item.answers.set(нормален(q.answer), a)
    if (!a.sources.some((s) => s.url === src.url)) a.sources.push(src)
  }

  for (const p of products) {
    const catId = typeof p.category === 'object' ? p.category?.id : p.category
    const къде = заКатегория(catId)
    const src: FaqSource = { title: p.title, url: productPath(p as never), kind: 'product' }
    for (const q of въпросиОт(p.sections)) добави(къде, q, src)
  }
  for (const c of categories) {
    const къде = заКатегория(c.id)
    const src: FaqSource = { title: c.title, url: categoryPath(c.slug), kind: 'category' }
    for (const q of въпросиОт(c.layout)) добави(къде, q, src)
  }
  for (const p of pages) {
    const къде = заСтраница(p.slug, p.title)
    const src: FaqSource = { title: p.title, url: p.slug === 'home' ? '/' : `/${p.slug}`, kind: 'page' }
    for (const q of въпросиОт(p.layout)) добави(къде, q, src)
  }

  /* Котвите на въпросите: `delta-kak-se-zarezhda` — групата без „seriya", после въпросът. */
  const заети = new Set<string>(FAQ_GROUPS.map((g) => g.id))
  const уникален = (база: string) => {
    let id = база || 'vapros'
    for (let n = 2; заети.has(id); n += 1) id = `${база}-${n}`
    заети.add(id)
    return id
  }

  /* По реда на конфигурацията; резервните подгрупи — накрая на групата си. */
  const видени = new Set<string>()
  const групи: FaqGroup[] = []
  for (const g of FAQ_GROUPS) {
    const ключове = [
      ...g.subgroups.map((s) => `${g.id}/${s.id}`),
      ...[...подгрупи.keys()].filter((k) => k.startsWith(`${g.id}/+`)),
    ]
    const префикс = g.id.replace(/-(seriya|vaprosi|klimatik|hladilnik)$/, '')
    const subgroups: FaqSubgroup[] = []
    for (const ключ of ключове) {
      const сбор = подгрупи.get(ключ)
      if (!сбор) continue
      const items: FaqItem[] = []
      for (const [k, q] of сбор.въпроси) {
        // Същият въпрос вече е по-горе — в по-ранна група или подгрупа.
        if (видени.has(k)) continue
        видени.add(k)
        items.push({
          id: уникален(`${префикс}-${slugify(q.question).slice(0, 60).replace(/-+$/, '')}`),
          question: q.question,
          answers: [...q.answers.values()],
        })
      }
      if (!items.length) continue
      const sid = ключ.split('/')[1]!.replace(/^\+/, '')
      subgroups.push({ id: sid ? уникален(`${g.id}-${sid}`) : '', title: сбор.заглавие, items })
    }
    if (subgroups.length) групи.push({ id: g.id, title: g.title, subgroups })
  }
  return групи
}

/** Текстът на отговора за JSON-LD — при няколко отговора всеки е с продуктите отпред. */
export const текстЗаСхема = (item: FaqItem) =>
  item.answers.length === 1
    ? item.answers[0]!.text
    : item.answers.map((a) => `${a.sources.map((s) => s.title).join(', ')}: ${a.text}`).join('\n\n')
