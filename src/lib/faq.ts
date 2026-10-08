/**
 * „Често задавани въпроси" (`/vaprosi`, `task-futar.md`) — всички въпроси от
 * блоковете „Въпроси и отговори", събрани от базата при всяко пресъздаване:
 *
 * - продуктите — публикуваните; групата е серията на основната категория
 *   (второто ниво, както в адреса — `seriesSlug` в `urls.ts`);
 * - категориите — към серията си;
 * - страниците — видимите блокове, в група „Общи въпроси".
 *
 * Сериите са по реда на дървото (`_order`, отгоре надолу — както в менюто),
 * „Общи въпроси" е последна. В една група еднаквият въпрос е ВЕДНЪЖ
 * (сравнява се текст без главни букви и препинателни знаци); различните
 * отговори остават — всеки с продуктите, от които е.
 *
 * Сървърен модул. Връща малък обект — в кеша на четенията влиза само той,
 * не секциите на продуктите (`unstable_cache` не пази над 2 MB, т. 14).
 */
import type { Category } from '@/payload-types'

import { categoryPath, productPath } from './urls'
import { slugify } from './slug'

export type FaqSource = { title: string; url: string; kind: 'product' | 'page' | 'category' }
export type FaqAnswer = { text: string; sources: FaqSource[] }
export type FaqItem = { id: string; question: string; answers: FaqAnswer[] }
export type FaqGroup = { id: string; title: string; items: FaqItem[] }

type Въпрос = { question?: string | null; answer?: string | null }
type Блок = { blockType?: string; hidden?: boolean | null; items?: Въпрос[] | null }

/** Ключът за сравнение: малки букви, без препинателни знаци и излишни интервали. */
export const нормален = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

const ОБЩИ = 'obshti-vaprosi'

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

  /* Редът на дървото: обхождане отгоре надолу по `_order` (дървото вече е подредено). */
  const ред = new Map<number, number>()
  const деца = (id: number | null) => tree.filter((c) => родител(c) === id)
  const обходи = (id: number | null) => {
    for (const c of деца(id)) {
      ред.set(c.id, ред.size)
      обходи(c.id)
    }
  }
  обходи(null)

  /* Серията над категория: подсерия → родителят; серия или главна — самата тя. */
  const серияНа = (id: number | null | undefined): Category | null => {
    const c = id != null ? поНомер.get(id) : undefined
    if (!c) return null
    const p = родител(c) != null ? поНомер.get(родител(c)!) : undefined
    if (p && родител(p) != null) return p
    return c
  }

  type Сбор = { title: string; order: number; въпроси: Map<string, { question: string; answers: Map<string, FaqAnswer> }> }
  const групи = new Map<string, Сбор>()
  const добави = (ключ: string, title: string, order: number, q: { question: string; answer: string }, src: FaqSource) => {
    const g = групи.get(ключ) ?? { title, order, въпроси: new Map() }
    групи.set(ключ, g)
    const k = нормален(q.question)
    const item = g.въпроси.get(k) ?? { question: q.question, answers: new Map() }
    g.въпроси.set(k, item)
    const a: FaqAnswer = item.answers.get(нормален(q.answer)) ?? { text: q.answer, sources: [] }
    item.answers.set(нормален(q.answer), a)
    if (!a.sources.some((s) => s.url === src.url)) a.sources.push(src)
  }

  for (const p of products) {
    const въпроси = въпросиОт(p.sections)
    if (!въпроси.length) continue
    const catId = typeof p.category === 'object' ? p.category?.id : p.category
    const серия = серияНа(catId)
    const src: FaqSource = { title: p.title, url: productPath(p as never), kind: 'product' }
    for (const q of въпроси) {
      if (серия) добави(`c${серия.id}`, серия.title, ред.get(серия.id) ?? 9999, q, src)
      else добави(ОБЩИ, 'Общи въпроси', Infinity, q, src)
    }
  }
  for (const c of categories) {
    const серия = серияНа(c.id)
    const src: FaqSource = { title: c.title, url: categoryPath(c.slug), kind: 'category' }
    for (const q of въпросиОт(c.layout)) {
      if (серия) добави(`c${серия.id}`, серия.title, ред.get(серия.id) ?? 9999, q, src)
      else добави(ОБЩИ, 'Общи въпроси', Infinity, q, src)
    }
  }
  for (const p of pages) {
    const src: FaqSource = { title: p.title, url: p.slug === 'home' ? '/' : `/${p.slug}`, kind: 'page' }
    for (const q of въпросиОт(p.layout)) добави(ОБЩИ, 'Общи въпроси', Infinity, q, src)
  }

  /* Котвите: `delta-kak-se-zarezhda` — серията без „серия", после въпросът. */
  const заети = new Set<string>()
  const уникален = (база: string) => {
    let id = база || 'vapros'
    for (let n = 2; заети.has(id); n += 1) id = `${база}-${n}`
    заети.add(id)
    return id
  }

  return [...групи.entries()]
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([ключ, g]) => {
      const groupId = уникален(ключ === ОБЩИ ? ОБЩИ : slugify(g.title))
      const префикс = ключ === ОБЩИ ? 'obshti' : groupId.replace(/-seriya$/, '').replace(/-+$/, '')
      return {
        id: groupId,
        title: g.title,
        items: [...g.въпроси.values()].map((q) => ({
          id: уникален(`${префикс}-${slugify(q.question).slice(0, 60).replace(/-+$/, '')}`),
          question: q.question,
          answers: [...q.answers.values()],
        })),
      }
    })
}

/** Текстът на отговора за JSON-LD — при няколко отговора всеки е с продуктите отпред. */
export const текстЗаСхема = (item: FaqItem) =>
  item.answers.length === 1
    ? item.answers[0]!.text
    : item.answers.map((a) => `${a.sources.map((s) => s.title).join(', ')}: ${a.text}`).join('\n\n')
