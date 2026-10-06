/**
 * SEO отчет (`task-seo-tehnichesko.md`, т. 11) — `npm run seo:check`.
 *
 * Минава през публикуваните продукти, категориите и страниците и изписва:
 * - мета заглавие над 60 знака — КАКТО ЩЕ ИЗЛЕЗЕ (`finalTitle`: с
 *   наставката, ако се събира);
 * - мета описание под 110 или над 158 знака, или празно (при категория
 *   празното се допълва автоматично — изписва се колко ще излезе);
 * - еднакви мета заглавия или описания;
 * - празните категории (без публикуван продукт → `noindex`, извън sitemap);
 * - вътрешни линкове към 404 — от менюто, футъра и страниците в sitemap.
 *
 * Линковете се проверяват през живия сървър (`NEXT_PUBLIC_SERVER_URL` или
 * localhost:3000): менюто и футърът — по данните (панелите в менюто не са в
 * HTML-а, докато не се отворят), страниците — по `<a href>` в HTML-а.
 * Нищо не се записва.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import type { Category } from '@/payload-types'
import { type CatalogEntry, makeCatalog } from './lib/catalog'
import {
  autoCategoryDescription,
  categoryMetaTitle,
  isEmptyCategory,
  productsInBranch,
} from './lib/seo'
import { levelOf } from './lib/tree'
import { DESCRIPTION_LIMIT, finalTitle, TITLE_LIMIT } from './lib/title'
import { categoryPath } from './lib/urls'

const SERVER = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/+$/, '')
const ОПИСАНИЕ_МИН = 110
const ОПИСАНИЕ_МАКС = 158

const payload = await getPayload({ config })

const tree = (
  await payload.find({ collection: 'categories', pagination: false, depth: 0, sort: '_order' })
).docs as Category[]
const продукти = (
  await payload.find({
    collection: 'products',
    where: { _status: { equals: 'published' } },
    pagination: false,
    depth: 0,
    sort: ['_order', 'title'],
    select: { slug: true, title: true, metaTitle: true, metaDescription: true, tagline: true, categories: true, _order: true },
  })
).docs

const номер = (v: unknown) => (typeof v === 'number' ? v : ((v as { id?: number } | null)?.id ?? null))
const entries: CatalogEntry[] = продукти.map((p) => ({
  id: p.id,
  slug: p.slug,
  title: p.title,
  categories: (p.categories ?? []).map(номер).filter((x): x is number => x !== null),
  compatCategories: [],
  compatProducts: [],
  attributes: [],
  price: null,
  availability: null,
  order: p._order ?? '',
  updatedAt: null,
}))
const catalog = makeCatalog(tree, entries)

type Ред = { вид: 'продукт' | 'категория' | 'страница'; slug: string; заглавие: string; описание: string; авто: boolean }
const редове: Ред[] = []

for (const p of продукти) {
  const описание = (p.metaDescription || p.tagline || '').trim()
  редове.push({ вид: 'продукт', slug: p.slug, заглавие: finalTitle(p.metaTitle || p.title), описание, авто: !p.metaDescription })
}
/* Категориите със страница — главните и сериите (подсериите са раздели). */
const сСтраница = tree.filter((c) => levelOf(tree, c) <= 1)
for (const c of сСтраница) {
  const own = c.metaDescription?.trim()
  редове.push({
    вид: 'категория',
    slug: c.slug,
    заглавие: finalTitle(categoryMetaTitle(catalog, c)),
    описание: own || autoCategoryDescription(c.title, productsInBranch(catalog, c.id)),
    авто: !own,
  })
}

/* Страниците — без началната: тя е „/" и заглавието ѝ идва от „Общи настройки". */
const страниците = (
  await payload.find({
    collection: 'pages',
    where: { and: [{ _status: { equals: 'published' } }, { slug: { not_equals: 'home' } }] },
    pagination: false,
    depth: 0,
    select: { slug: true, title: true, metaTitle: true, metaDescription: true },
  })
).docs
for (const p of страниците) {
  редове.push({
    вид: 'страница',
    slug: p.slug,
    заглавие: finalTitle(p.metaTitle || p.title),
    описание: (p.metaDescription || '').trim(),
    авто: false,
  })
}

const изход: string[] = []
const раздел = (заглавие: string, линии: string[]) => {
  изход.push(`\n${заглавие}: ${линии.length}`)
  for (const л of линии) изход.push(`  ${л}`)
}

раздел(
  `МЕТА ЗАГЛАВИЕ НАД ${TITLE_LIMIT} ЗНАКА (както ще излезе)`,
  редове.filter((р) => р.заглавие.length > TITLE_LIMIT).map((р) => `${р.вид} ${р.slug} — ${р.заглавие.length}: ${р.заглавие}`),
)

раздел(
  `МЕТА ОПИСАНИЕ ПРАЗНО, ПОД ${ОПИСАНИЕ_МИН} ИЛИ НАД ${ОПИСАНИЕ_МАКС} ЗНАКА`,
  редове
    .filter((р) => !р.описание || р.описание.length < ОПИСАНИЕ_МИН || р.описание.length > ОПИСАНИЕ_МАКС || (р.вид === 'категория' && р.авто))
    .map((р) => {
      if (!р.описание) return `${р.вид} ${р.slug} — празно`
      const бележка =
        р.вид === 'категория' && р.авто
          ? `празно → автоматично ${р.описание.length}${р.описание.length > DESCRIPTION_LIMIT ? ' (над 155)' : ''}`
          : р.вид === 'продукт' && р.авто
            ? `празно → кратката спецификация, ${р.описание.length}`
            : `${р.описание.length}`
      return `${р.вид} ${р.slug} — ${бележка}`
    }),
)

const повторения = (поле: 'заглавие' | 'описание') => {
  const групи = new Map<string, string[]>()
  for (const р of редове) {
    const к = р[поле].trim().toLocaleLowerCase('bg')
    if (!к) continue
    групи.set(к, [...(групи.get(к) ?? []), `${р.вид} ${р.slug}`])
  }
  return [...групи].filter(([, l]) => l.length > 1).map(([к, l]) => `„${к.slice(0, 80)}" — ${l.join(', ')}`)
}
раздел('ЕДНАКВИ МЕТА ЗАГЛАВИЯ', повторения('заглавие'))
раздел('ЕДНАКВИ МЕТА ОПИСАНИЯ', повторения('описание'))

раздел(
  'ПРАЗНИ КАТЕГОРИИ (noindex, извън sitemap)',
  tree.filter((c) => isEmptyCategory(catalog, c.id)).map((c) => `${c.slug} — ${c.title}`),
)

/* ─────────── вътрешни линкове към 404 ─────────── */

/** Адрес → откъде е (първото място). */
const линкове = new Map<string, string>()
const добави = (href: unknown, откъде: string) => {
  if (typeof href !== 'string') return
  const h = href.trim()
  if (!h.startsWith('/') || h.startsWith('//') || h.startsWith('/api/') || h.startsWith('/admin')) return
  const чист = h.split('#')[0]!
  if (чист && !линкове.has(чист)) линкове.set(чист, откъде)
}
const категорияПоId = new Map(tree.map((c) => [c.id, c]))
const обходи = (node: unknown, откъде: string): void => {
  if (Array.isArray(node)) return node.forEach((n) => обходи(n, откъде))
  if (!node || typeof node !== 'object') return
  for (const [k, v] of Object.entries(node)) {
    if ((k === 'category' || k === 'viewAllCategory') && номер(v) !== null) {
      const c = категорияПоId.get(номер(v)!)
      if (c) добави(categoryPath(c.slug), откъде)
      else линкове.set(`(категория № ${номер(v)} — изтрита)`, откъде)
    } else if ((k === 'url' || k === 'viewAllUrl' || k === 'href') && typeof v === 'string') {
      добави(v, откъде)
    } else обходи(v, откъде)
  }
}
обходи(await payload.findGlobal({ slug: 'header', depth: 0 }), 'менюто')
обходи((await payload.find({ collection: 'menu-panels', pagination: false, depth: 0 })).docs, 'панел в менюто')
обходи(await payload.findGlobal({ slug: 'footer', depth: 0 }), 'футъра')

let страници: string[] = []
try {
  const sitemap = await (await fetch(`${SERVER}/sitemap.xml`)).text()
  страници = ['/', ...[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname)]
} catch {
  изход.push(`\n⚠ Сървърът ${SERVER} не отговаря — линковете от страниците не са проверени.`)
}
const поПартиди = async (задачи: (() => Promise<void>)[], n = 4) => {
  let i = 0
  await Promise.all(Array.from({ length: n }, async () => { while (i < задачи.length) await задачи[i++]!() }))
}
await поПартиди(
  [...new Set(страници)].map((страница) => async () => {
    try {
      const html = await (await fetch(SERVER + страница)).text()
      for (const m of html.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)) добави(m[1]!.replace(/&amp;/g, '&'), страница)
    } catch {
      // Страницата не отговаря — отчита се долу като линк.
    }
  }),
)

const счупени: string[] = []
await поПартиди(
  [...линкове].map(([href, откъде]) => async () => {
    if (href.startsWith('(')) return void счупени.push(`${href} — в ${откъде}`)
    try {
      let r = await fetch(SERVER + href)
      if (r.status >= 500) r = await fetch(SERVER + href) // dev сървърът понякога пада при паралелни заявки
      if (r.status === 404) счупени.push(`${href} — от ${откъде}`)
    } catch (e) {
      счупени.push(`${href} — грешка ${(e as Error).message} (от ${откъде})`)
    }
  }),
)
раздел(`ВЪТРЕШНИ ЛИНКОВЕ КЪМ 404 (проверени ${линкове.size})`, счупени.sort())

console.log(
  `SEO ОТЧЕТ — ${продукти.length} публикувани продукта, ${сСтраница.length} категории със страница, ${страниците.length} страници, ${страници.length} адреса от sitemap`,
)
console.log(изход.join('\n'))
process.exit(0)
