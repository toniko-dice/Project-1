/**
 * Еднократно (13 ноември 2026) — плочката „Виж още" на два реда от
 * началната:
 *
 * - „EcoFlow Rapid външни батерии": включена; адрес → категорията
 *   „Външни батерии Rapid". Снимката остава № 44 (неутрален сив градиент
 *   с „Виж още" — без PowerOcean).
 * - „EcoFlow DELTA Pro Ultra Power Станция": включена; адрес →
 *   категорията на DELTA Pro Ultra; снимка → `delta-pro-ultra-1.png`
 *   (вече е в Медия — нищо не се сваля).
 *
 * 16 ноември 2026: Rapid — текстът на плочката „Всички външни батерии RAPID"
 * (вместо „Сравнете всички решения за дома" от PowerOcean), снимката —
 * банерната на реда (№ 1269); „Брой продукти" обратно на 5 — плочката
 * вече сама отнема един продукт (`bannerRowProducts`).
 *
 * Пипа САМО `showMoreTile`, `moreTile.url`, `moreTile.image` (и при Rapid —
 * `autoCount`, `moreTile.description`) на тези два реда; останалото се сравнява преди и след записа. Повторяем. Архив
 * преди записа (без архив върху копие — `tmp-` в DATABASE_URI). Спира,
 * ако началната има непубликувани промени.
 *
 *   npm run vizh:oshte [-- --dry-run]
 */
import config from '@payload-config'
import { getPayload, type Where } from 'payload'

import type { Page } from './payload-types'
import { createBackup } from './lib/backup'
import { categoryUrl } from './lib/urls'
import { revalidateServer } from './import-product-core'

const флагове = process.argv.slice(2).filter((a) => a.startsWith('-') && a !== '--')
const непознати = флагове.filter((f) => f !== '--dry-run')
if (непознати.length) {
  console.error(`Непознат флаг: ${непознати.join(', ')}. Позволен е само --dry-run.`)
  process.exit(1)
}
const dryRun = флагове.includes('--dry-run')
const копие = String(process.env.DATABASE_URI ?? '').includes('tmp-')
const payload = await getPayload({ config })
const log = (m: string) => console.log(m)
const чисто = (x: unknown) => JSON.stringify(x)
const номер = (v: unknown): number | null =>
  typeof v === 'number' ? v : ((v as { id?: number } | null)?.id ?? null)

type Блок = NonNullable<Page['layout']>[number]
type РедБанер = Extract<Блок, { blockType: 'bannerProductRow' }>

const категория = async (where: Where) => {
  const c = (await payload.find({ collection: 'categories', where, depth: 2, limit: 1 })).docs[0]
  if (!c) throw new Error(`няма категория ${чисто(where)}`)
  return c
}
const снимка = async (filename: string) => {
  const m = (await payload.find({ collection: 'media', where: { filename: { equals: filename } }, depth: 0, limit: 1 })).docs[0]
  if (!m) throw new Error(`няма снимка ${filename} в Медия`)
  return m
}

const home = (await payload.find({ collection: 'pages', where: { slug: { equals: 'home' } }, depth: 0, draft: true, limit: 1 })).docs[0]
if (!home) throw new Error('няма страница home')
const публикувана = await payload.findByID({ collection: 'pages', id: home.id, depth: 0, draft: false })
if (чисто(публикувана.layout) !== чисто(home.layout)) {
  throw new Error('Началната има непубликувани промени в админа — публикувайте ги или ги отхвърлете и пуснете пак.')
}

const rapid = await категория({ slug: { equals: 'vanshni-baterii-rapid' } })
const dpu = (await payload.find({ collection: 'products', where: { slug: { equals: 'delta-pro-ultra' } }, depth: 0, limit: 1 })).docs[0]
if (!dpu) throw new Error('няма продукт delta-pro-ultra')
const dpuКат = await категория({ id: { equals: номер(dpu.category) } })
const dpuСнимка = await снимка('delta-pro-ultra-1.png')

const rapidСнимка = await снимка('Mountain cabin remote work, powered.png')

const цели: { заглавие: string; url: string; image?: number; autoCount?: number; описание?: string }[] = [
  // „Брой продукти" остава 5: с включена плочка редът сам показва с един
  // по-малко (4 + плочката, `bannerRowProducts`). Описанието от PowerOcean
  // „Сравнете всички решения за дома" → собствено; снимката — банерната
  // на реда (№ 1269), вместо сивия квадрат № 44.
  { заглавие: 'EcoFlow Rapid външни батерии', url: categoryUrl(rapid)!, image: rapidСнимка.id, autoCount: 5, описание: 'Всички външни батерии RAPID' },
  { заглавие: 'EcoFlow DELTA Pro Ultra Power Станция', url: categoryUrl(dpuКат)!, image: dpuСнимка.id },
]

const преди = (home.layout ?? []) as Блок[]
const layout = преди.map((b) => ({ ...b })) as Блок[]
const сменени = new Set<number>()
const промени: string[] = []

for (const ц of цели) {
  const i = layout.findIndex((b) => b.blockType === 'bannerProductRow' && b.sectionTitle === ц.заглавие)
  if (i < 0) throw new Error(`няма ред „${ц.заглавие}" на началната`)
  const b = layout[i] as РедБанер
  const образ = ц.image ?? номер(b.moreTile?.image)
  if (!b.showMoreTile) промени.push(`„${ц.заглавие}": „Виж още" — включена`)
  if (b.moreTile?.url !== ц.url) промени.push(`„${ц.заглавие}": адрес ${b.moreTile?.url ?? '(празно)'} → ${ц.url}`)
  if (номер(b.moreTile?.image) !== образ) промени.push(`„${ц.заглавие}": снимка ${номер(b.moreTile?.image) ?? '(няма)'} → № ${образ}`)
  if (ц.autoCount !== undefined && b.autoCount !== ц.autoCount) промени.push(`„${ц.заглавие}": брой продукти ${b.autoCount ?? '—'} → ${ц.autoCount}`)
  if (ц.описание !== undefined && b.moreTile?.description !== ц.описание) промени.push(`„${ц.заглавие}": текст „${b.moreTile?.description ?? ''}" → „${ц.описание}"`)
  if (!образ) throw new Error(`„${ц.заглавие}": плочката остава без снимка`)
  const нов = {
    ...b,
    showMoreTile: true,
    ...(ц.autoCount !== undefined ? { autoCount: ц.autoCount } : {}),
    moreTile: { ...b.moreTile, url: ц.url, image: образ, ...(ц.описание !== undefined ? { description: ц.описание } : {}) },
  }
  if (чисто(нов) !== чисто({ ...b, moreTile: { ...b.moreTile, image: номер(b.moreTile?.image) } })) {
    layout[i] = нов
    сменени.add(i)
  }
}

if (!промени.length) {
  log('без промяна — плочките вече са настроени')
  process.exit(0)
}
промени.forEach((p) => log(`• ${p}`))
if (dryRun) process.exit(0)

if (копие) log('копие на базата — без архив')
else {
  const { doc } = await createBackup(payload, { label: 'Преди „Виж още" на редовете Rapid и DELTA Pro Ultra (началната)', trigger: 'ръчно' })
  log(`архив № ${doc.id}`)
}

const след = await payload.update({ collection: 'pages', id: home.id, data: { layout, _status: 'published' }, depth: 0 })
const сега = (след.layout ?? []) as Блок[]
if (сега.length !== преди.length) throw new Error('началната: броят секции се промени')
const норм = (x: Блок) => {
  const r = x as РедБанер
  return {
    ...x,
    products: r.products?.map(номер),
    pinnedProducts: r.pinnedProducts?.map(номер),
    moreTile: r.moreTile ? { ...r.moreTile, image: номер(r.moreTile.image) } : r.moreTile,
  }
}
преди.forEach((b, i) => {
  const очаквано = сменени.has(i) ? layout[i] : b
  if (чисто(норм(очаквано)) !== чисто(норм(сега[i]))) throw new Error(`началната: секция ${i + 1} (${b.blockType}) не е каквато трябва`)
})
log(`✓ началната: сменени секции ${[...сменени].map((i) => i + 1).join(', ')}; останалите — без промяна`)

log(await revalidateServer())
process.exit(0)
