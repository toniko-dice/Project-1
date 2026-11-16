/**
 * Еднократно (16 ноември 2026) — два реда на началната:
 *
 * - „EcoFlow Rapid външни батерии": снимката на плочката „Виж още" № 1269
 *   (банерната, 3:1 — излизаше като лента) → основната снимка на
 *   `rapid-pro-power-bank-27650` (квадратна, вече е в Медия). Текстът и
 *   адресът на плочката не се пипат.
 * - „EcoFlow DELTA Pro Ultra Power Станция" → заглавие „Серия EcoFlow
 *   DELTA Pro"; остава „Ръчно"; продуктите — `delta-pro-3`,
 *   `delta-pro-3-smart-extra-battery`, `delta-pro-ultra-extra-battery`,
 *   `trolley-delta-pro-ultra` (в този ред). Банерът и плочката — същите.
 *   Спира, ако някой от четирите е чернова.
 *
 * Пипа САМО тези полета; останалото се сравнява преди и след записа.
 * Повторяем (редът DELTA се намира и по старото, и по новото заглавие).
 * Архив преди записа (без архив върху копие — `tmp-` в DATABASE_URI).
 * Спира, ако началната има непубликувани промени.
 *
 *   npm run nachalna:delta-pro [-- --dry-run]
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import type { Page } from './payload-types'
import { createBackup } from './lib/backup'
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

const РЕД_RAPID = 'EcoFlow Rapid външни батерии'
const РЕД_DELTA_СТАРО = 'EcoFlow DELTA Pro Ultra Power Станция'
const РЕД_DELTA = 'Серия EcoFlow DELTA Pro'
const DELTA_ПРОДУКТИ = ['delta-pro-3', 'delta-pro-3-smart-extra-battery', 'delta-pro-ultra-extra-battery', 'trolley-delta-pro-ultra']

const продукт = async (slug: string) => {
  const p = (await payload.find({ collection: 'products', where: { slug: { equals: slug } }, depth: 0, draft: true, limit: 1 })).docs[0]
  if (!p) throw new Error(`няма продукт ${slug}`)
  return p
}

const home = (await payload.find({ collection: 'pages', where: { slug: { equals: 'home' } }, depth: 0, draft: true, limit: 1 })).docs[0]
if (!home) throw new Error('няма страница home')
const публикувана = await payload.findByID({ collection: 'pages', id: home.id, depth: 0, draft: false })
if (чисто(публикувана.layout) !== чисто(home.layout)) {
  throw new Error('Началната има непубликувани промени в админа — публикувайте ги или ги отхвърлете и пуснете пак.')
}

// Основната снимка на RAPID Pro Power Bank (полето „Снимка" на продукта).
const rapidPro = await продукт('rapid-pro-power-bank-27650')
const rapidСнимка = номер(rapidPro.image)
if (!rapidСнимка) throw new Error('rapid-pro-power-bank-27650 няма основна снимка')

// Четирите продукта — само публикувани (чернова не се показва в реда).
const deltaIds: number[] = []
for (const slug of DELTA_ПРОДУКТИ) {
  const p = await продукт(slug)
  const публикуван = (await payload.find({ collection: 'products', where: { id: { equals: p.id } }, depth: 0, limit: 1 })).docs[0]
  if (p._status !== 'published' || !публикуван) throw new Error(`${slug} е чернова — публикувайте го и пуснете пак`)
  deltaIds.push(p.id)
}

const преди = (home.layout ?? []) as Блок[]
const layout = преди.map((b) => ({ ...b })) as Блок[]
const сменени = new Set<number>()
const промени: string[] = []
const ред = (...заглавия: string[]) => {
  const i = layout.findIndex((b) => b.blockType === 'bannerProductRow' && заглавия.includes(b.sectionTitle ?? ''))
  if (i < 0) throw new Error(`няма ред „${заглавия[0]}" на началната`)
  return { i, b: layout[i] as РедБанер }
}
const норм = (x: Блок) => {
  const r = x as РедБанер
  return {
    ...x,
    products: r.products?.map(номер),
    pinnedProducts: r.pinnedProducts?.map(номер),
    moreTile: r.moreTile ? { ...r.moreTile, image: номер(r.moreTile.image) } : r.moreTile,
  }
}

{
  const { i, b } = ред(РЕД_RAPID)
  if (номер(b.moreTile?.image) !== rapidСнимка) {
    промени.push(`„${РЕД_RAPID}": снимка на „Виж още" № ${номер(b.moreTile?.image) ?? '—'} → № ${rapidСнимка} (основната на ${rapidPro.slug})`)
    layout[i] = { ...b, moreTile: { ...b.moreTile, image: rapidСнимка } }
    сменени.add(i)
  }
}

{
  const { i, b } = ред(РЕД_DELTA_СТАРО, РЕД_DELTA)
  const сега = (b.products ?? []).map(номер)
  if (b.sectionTitle !== РЕД_DELTA) промени.push(`„${b.sectionTitle}": заглавие → „${РЕД_DELTA}"`)
  if (b.mode !== 'manual') промени.push(`„${РЕД_DELTA}": ${b.mode ?? '—'} → Ръчно`)
  if (чисто(сега) !== чисто(deltaIds)) промени.push(`„${РЕД_DELTA}": продукти [${сега.join(', ')}] → [${deltaIds.join(', ')}] (${DELTA_ПРОДУКТИ.join(', ')})`)
  const нов = { ...b, sectionTitle: РЕД_DELTA, mode: 'manual' as const, products: deltaIds }
  if (чисто(норм(нов)) !== чисто(норм(b))) {
    layout[i] = нов
    сменени.add(i)
  }
}

if (!промени.length) {
  log('без промяна — редовете вече са настроени')
  process.exit(0)
}
промени.forEach((p) => log(`• ${p}`))
if (dryRun) process.exit(0)

if (копие) log('копие на базата — без архив')
else {
  const { doc } = await createBackup(payload, { label: 'Преди редовете Rapid и „Серия EcoFlow DELTA Pro" (началната)', trigger: 'ръчно' })
  log(`архив № ${doc.id}`)
}

const след = await payload.update({ collection: 'pages', id: home.id, data: { layout, _status: 'published' }, depth: 0 })
const сега = (след.layout ?? []) as Блок[]
if (сега.length !== преди.length) throw new Error('началната: броят секции се промени')
преди.forEach((b, i) => {
  const очаквано = сменени.has(i) ? layout[i] : b
  if (чисто(норм(очаквано)) !== чисто(норм(сега[i]))) throw new Error(`началната: секция ${i + 1} (${b.blockType}) не е каквато трябва`)
})
log(`✓ началната: сменени секции ${[...сменени].map((i) => i + 1).join(', ')}; останалите — без промяна`)

log(await revalidateServer())
process.exit(0)
