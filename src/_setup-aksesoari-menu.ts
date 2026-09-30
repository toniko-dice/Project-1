/* Еднократно: task-aksesoari-menu.md — категория, панел, раздели „Аксесоари". */
import config from '@payload-config'
import path from 'path'
import { pathToFileURL } from 'url'
import { getPayload } from 'payload'

import { createBackup } from './lib/backup'

const { generateNKeysBetween } = (await import(
  pathToFileURL(
    path.resolve(process.cwd(), 'node_modules/payload/dist/config/orderable/fractional-indexing.js'),
  ).href
)) as { generateNKeysBetween: (a: string | null, b: string | null, n: number) => string[] }

const payload = await getPayload({ config })
const { doc: архив } = await createBackup(payload, {
  label: 'Преди аксесоарите в менюто и „Свързване към ел. таблото"',
  trigger: 'ръчно',
})
console.log(`Архив: „${архив.label}" (№ ${архив.id})`)

const TITLE = 'Свързване към ел. таблото'
const SLUG = 'svarzvane-kam-el-tabloto'

const cats = await payload.find({ collection: 'categories', pagination: false, depth: 0 })
const bySlug = (s: string) => cats.docs.find((c) => c.slug === s)
const домашни = bySlug('domashni-sistemi')!
const микро = bySlug('mikroinvertori-i-montazh')!
const аксесоари = bySlug('aksesoari')!

/* 1. Категорията — след „Микроинвертори и монтаж за балкон". */
let категория = bySlug(SLUG)
if (!категория) {
  const ключ = (c: unknown) => (c as { _order?: string })._order ?? ''
  const след = ключ(микро)
  const следващ =
    cats.docs
      .map(ключ)
      .filter((k) => k > след)
      .sort()[0] ?? null
  const [_order] = generateNKeysBetween(след, следващ, 1)
  категория = await payload.create({
    collection: 'categories',
    data: { title: TITLE, slug: SLUG, parent: домашни.id, showInStrip: false, _order } as never,
  })
  console.log(`+ категория № ${категория.id} ${TITLE} (_order ${_order})`)
} else {
  console.log(`= категория № ${категория.id} вече я има`)
}

const разделАксесоари = {
  heading: 'Аксесоари',
  viewAllCategory: аксесоари.id,
  accessories: true,
  showViewAllTile: true,
  cards: [],
}

/* 2. Панелът. */
const panels = await payload.find({ collection: 'menu-panels', pagination: false, depth: 0 })
let панел = panels.docs.find((p) =>
  (p.sections ?? []).some((s) => !s.accessories && s.viewAllCategory === категория!.id),
)
if (!панел) {
  панел = await payload.create({
    collection: 'menu-panels',
    data: {
      title: TITLE,
      slug: panels.docs.some((p) => p.slug === SLUG) ? `${SLUG}-2` : SLUG,
      sections: [
        { heading: TITLE, viewAllCategory: категория.id, cards: [], showViewAllTile: true },
        разделАксесоари,
      ],
    } as never,
  })
  console.log(`+ панел № ${панел.id} ${TITLE}`)
} else {
  console.log(`= панел № ${панел.id} вече го има`)
}

/* 3. Точката в менюто — в групата на „Домашни и балконски системи", след микроинверторите. */
const header = await payload.findGlobal({ slug: 'header', depth: 0 })
const panelId = (e: { panel?: unknown }) =>
  typeof e.panel === 'number' ? e.panel : (e.panel as { id?: number } | null)?.id
const микроПанел = panels.docs.find((p) =>
  (p.sections ?? []).some((s) => !s.accessories && s.viewAllCategory === микро.id),
)!
let вМенюто = false
for (const item of header.items ?? []) {
  for (const group of item.groups ?? []) {
    const entries = group.entries ?? []
    if (entries.some((e) => panelId(e) === панел.id)) вМенюто = true
    const i = entries.findIndex((e) => panelId(e) === микроПанел.id)
    if (i >= 0 && !вМенюто) {
      entries.splice(i + 1, 0, { panel: панел.id } as never)
      group.entries = entries
      вМенюто = true
      await payload.updateGlobal({ slug: 'header', data: { items: header.items } as never, depth: 0 })
      console.log(`+ точка в менюто: „${item.label}" › „${group.heading}", след „${микроПанел.title}"`)
    }
  }
}
if (!вМенюто) console.log('⚠ не намерих групата с микроинверторите — точката не е добавена')

/* 4. Раздел „Аксесоари" на панелите на устройства. */
const устройства = [
  'delta-seriya',
  'river-seriya',
  'stream-seriya-2',
  'powerocean-2',
  'wave-klimatici',
  'glacier-hladilnici',
  'vanshni-baterii-rapid',
  'umen-dom',
  'stacionarni-paneli',
  'sgavaemi-paneli',
]
for (const slug of устройства) {
  const p = panels.docs.find((x) => x.slug === slug)
  if (!p) {
    console.log(`⚠ няма панел ${slug}`)
    continue
  }
  const sections = p.sections ?? []
  // DELTA и RIVER вече имат празен раздел „Аксесоари" — само се отбелязва.
  const наличен = sections.find(
    (s) => s.accessories || (s.heading.trim() === 'Аксесоари' && !(s.cards ?? []).length),
  )
  if (наличен?.accessories) {
    console.log(`= ${p.title}: разделът е отбелязан`)
    continue
  }
  if (наличен) {
    наличен.accessories = true
    if (!наличен.viewAllCategory) наличен.viewAllCategory = аксесоари.id
  } else {
    sections.push(разделАксесоари as never)
  }
  await payload.update({
    collection: 'menu-panels',
    id: p.id,
    data: { sections } as never,
    depth: 0,
  })
  console.log(`${наличен ? '~' : '+'} ${p.title}: раздел „Аксесоари"`)
}
process.exit(0)
