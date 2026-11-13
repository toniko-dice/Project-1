/**
 * Еднократно (`task-novi-produkti-avtomatichno.md`, 12 ноември 2026) —
 * настройките на „новите отпред" след миграцията `novi_otpred`:
 *
 * 1. Началната › „EcoFlow Rapid външни батерии": „Автоматично", категория
 *    „Външни батерии Rapid"; адресът на плочката „Виж още" `/kategorii/
 *    powerocean` (404) → адреса на категорията. Ръчният списък остава в
 *    базата (вижда се пак при „Ръчно").
 * 2. Началната › „EcoFlow DELTA Pro Ultra Power Станция": остава „Ръчно";
 *    `delta-pro-ultra-extra-battery` се добавя след досегашните продукти;
 *    празният адрес на „Виж още" → адреса на категорията на DELTA Pro Ultra.
 * 3. Панелът „Външни батерии": вторият ред за `rapid-pro-power-bank-27650`
 *    (дубликат) се маха — първият остава.
 *
 * Панелите вече са „Автоматично" от миграцията — тук само се изписват.
 * „Захранване на открито" и „Най-търсени продукти" не се пипат.
 *
 * Пипа САМО тези места; останалото се сравнява преди и след записа.
 * Повторяем: второ пускане не сменя нищо. Архив преди записа (без архив
 * върху копие — `tmp-` в DATABASE_URI). Спира, ако началната има
 * непубликувани промени в админа.
 *
 *   npm run novi:otpred [-- --dry-run]
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import type { MenuPanel, Page } from './payload-types'
import { createBackup } from './lib/backup'
import { categoryUrl } from './lib/urls'
import { revalidateServer } from './import-product-core'

const флагове = process.argv.slice(2).filter((a) => a.startsWith('-'))
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

const РЕД_RAPID = 'EcoFlow Rapid външни батерии'
const РЕД_DPU = 'EcoFlow DELTA Pro Ultra Power Станция'

const категория = async (slug: string) => {
  const c = (await payload.find({ collection: 'categories', where: { slug: { equals: slug } }, depth: 2, limit: 1 })).docs[0]
  if (!c) throw new Error(`няма категория ${slug}`)
  return c
}
const продукт = async (slug: string) => {
  const p = (await payload.find({ collection: 'products', where: { slug: { equals: slug } }, depth: 0, draft: true, limit: 1 })).docs[0]
  if (!p) throw new Error(`няма продукт ${slug}`)
  return p
}

/* ─────────── началната ─────────── */

type Блок = NonNullable<Page['layout']>[number]
type РедБанер = Extract<Блок, { blockType: 'bannerProductRow' }>

const home = (await payload.find({ collection: 'pages', where: { slug: { equals: 'home' } }, depth: 0, draft: true, limit: 1 })).docs[0]
if (!home) throw new Error('няма страница home')
const публикувана = await payload.findByID({ collection: 'pages', id: home.id, depth: 0, draft: false })
if (чисто(публикувана.layout) !== чисто(home.layout)) {
  throw new Error('Началната има непубликувани промени в админа — публикувайте ги или ги отхвърлете и пуснете пак.')
}

const преди = (home.layout ?? []) as Блок[]
const layout = преди.map((b) => ({ ...b })) as Блок[]
const сменени = new Set<number>()
const промени: string[] = []
const ред = (заглавие: string) => {
  const i = layout.findIndex((b) => b.blockType === 'bannerProductRow' && b.sectionTitle === заглавие)
  if (i < 0) throw new Error(`няма ред „${заглавие}" на началната`)
  return { i, b: layout[i] as РедБанер }
}

{
  const { i, b } = ред(РЕД_RAPID)
  const rapid = await категория('vanshni-baterii-rapid')
  const url = categoryUrl(rapid)!
  if (b.mode !== 'auto') промени.push(`„${РЕД_RAPID}": ${b.mode ?? '—'} → Автоматично`)
  if (номер(b.fromCategory) !== rapid.id) промени.push(`„${РЕД_RAPID}": категория → „${rapid.title}"`)
  if (b.moreTile?.url !== url) промени.push(`„${РЕД_RAPID}": „Виж още" ${b.moreTile?.url ?? '(празно)'} → ${url}`)
  const нов = { ...b, mode: 'auto' as const, fromCategory: rapid.id, moreTile: { ...b.moreTile, url } }
  if (чисто(нов) !== чисто(b)) {
    layout[i] = нов
    сменени.add(i)
  }
}

{
  const { i, b } = ред(РЕД_DPU)
  const батерия = await продукт('delta-pro-ultra-extra-battery')
  const dpu = await продукт('delta-pro-ultra')
  const кат = await категория(
    (await payload.findByID({ collection: 'categories', id: номер(dpu.category)!, depth: 0 })).slug,
  )
  const url = categoryUrl(кат)!
  const ids = (b.products ?? []).map(номер).filter((x): x is number => x !== null)
  if (b.mode !== 'manual') промени.push(`„${РЕД_DPU}": ${b.mode ?? '—'} → Ръчно`)
  if (!ids.includes(батерия.id)) промени.push(`„${РЕД_DPU}": + ${батерия.slug} (№ ${батерия.id})`)
  if (b.moreTile?.url !== url) промени.push(`„${РЕД_DPU}": „Виж още" ${b.moreTile?.url ?? '(празно)'} → ${url}`)
  const нов = {
    ...b,
    mode: 'manual' as const,
    products: ids.includes(батерия.id) ? ids : [...ids, батерия.id],
    moreTile: { ...b.moreTile, url },
  }
  if (чисто(нов) !== чисто({ ...b, products: ids })) {
    layout[i] = нов
    сменени.add(i)
  }
}

/* ─────────── панелите ─────────── */

const панели = (await payload.find({ collection: 'menu-panels', pagination: false, depth: 0 })).docs as MenuPanel[]
for (const p of панели) {
  for (const s of p.sections ?? []) {
    if (!s.accessories) log(`  панел „${p.title}" › „${s.heading}": ${s.mode === 'manual' ? 'Ръчно' : 'Автоматично'}`)
  }
}
const външни = панели.find((p) => p.slug === 'vanshni-baterii' || p.title === 'Външни батерии')
if (!външни) throw new Error('няма панел „Външни батерии"')
const дубликат = await продукт('rapid-pro-power-bank-27650')
const секцииПреди = чисто(външни.sections)
const секции = (външни.sections ?? []).map((s) => {
  let видян = false
  return {
    ...s,
    cards: (s.cards ?? []).filter((c) => {
      if (номер(c.product) !== дубликат.id) return true
      if (!видян) return (видян = true)
      промени.push(`панел „${външни.title}" › „${s.heading}": махнат дублиран ред за ${дубликат.slug}`)
      return false
    }),
  }
})
const панелСмяна = чисто(секции) !== секцииПреди

if (!промени.length) {
  log('без промяна — всичко вече е настроено')
  process.exit(0)
}
промени.forEach((p) => log(`• ${p}`))
if (dryRun) process.exit(0)

if (копие) log('копие на базата — без архив')
else {
  const { doc } = await createBackup(payload, { label: 'Преди „новите отпред" (началната, панел „Външни батерии")', trigger: 'ръчно' })
  log(`архив № ${doc.id}`)
}

if (сменени.size) {
  const след = await payload.update({ collection: 'pages', id: home.id, data: { layout, _status: 'published' }, depth: 0 })
  const сега = (след.layout ?? []) as Блок[]
  if (сега.length !== преди.length) throw new Error('началната: броят секции се промени')
  преди.forEach((b, i) => {
    const очаквано = сменени.has(i) ? layout[i] : b
    const норм = (x: Блок) => ({ ...x, products: (x as РедБанер).products?.map(номер), pinnedProducts: (x as РедБанер).pinnedProducts?.map(номер) })
    if (чисто(норм(очаквано)) !== чисто(норм(сега[i]))) throw new Error(`началната: секция ${i + 1} (${b.blockType}) не е каквато трябва`)
  })
  log(`✓ началната: сменени секции ${[...сменени].map((i) => i + 1).join(', ')}; останалите — без промяна`)
}

if (панелСмяна) {
  await payload.update({ collection: 'menu-panels', id: външни.id, data: { sections: секции } as never, depth: 0 })
  const след = (await payload.findByID({ collection: 'menu-panels', id: външни.id, depth: 0 })) as MenuPanel
  const карти = (след.sections ?? []).flatMap((s) => s.cards ?? []).map((c) => номер(c.product))
  if (карти.filter((x) => x === дубликат.id).length !== 1) throw new Error('панелът: дубликатът не е махнат')
  // Редовете (номер + продукт) и полетата на секциите — същите като в записаното.
  const скелет = (ss: MenuPanel['sections']) =>
    чисто((ss ?? []).map(({ cards, ...s }) => ({ ...s, cards: (cards ?? []).map((c) => [c.id, номер(c.product), c.label ?? null]) })))
  if (скелет(след.sections) !== скелет(секции as MenuPanel['sections'])) throw new Error('панелът: друго се промени')
  log(`✓ панел „${външни.title}": ${карти.length} реда, без дубликати`)
}

log(await revalidateServer())
process.exit(0)
