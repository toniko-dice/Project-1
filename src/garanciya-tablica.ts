/**
 * Еднократно (15 октомври 2026, по поръка на собственика) — таблицата
 * „Гаранционни срокове" на /garanciya в базата, както
 * `content/stranici/garanciya/sadarzhanie.json`: продуктите един под друг
 * (нов ред в клетката), 450W Rigid — 12 години, 500W Rigid — 15 години.
 *
 * Пипа САМО редовете на тази таблица; заглавието, колоните, бележката и
 * всички други секции се сравняват преди и след записа. Спира при
 * непубликувани промени в админа и ако страницата е записвана след
 * проверката (8.10.2026, 12:30). Повторяем. Архив преди записа.
 *
 *   npm run garanciya:tablica [-- --dry-run]
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'

import config from '@payload-config'
import { getPayload } from 'payload'

import type { Page } from './payload-types'
import { createBackup } from './lib/backup'
import { revalidateServer } from './import-product-core'

const dryRun = process.argv.includes('--dry-run')
const ПРОВЕРЕНА = '2026-10-08T12:30:43.427Z'
const ЗАГЛАВИЕ = 'Гаранционни срокове'
const payload = await getPayload({ config })
const log = (m: string) => console.log(m)
const чисто = (x: unknown) => JSON.stringify(x).replace(/"id":"[^"]*",?/g, '')
const ред = (cells: string[]) => cells.map((c) => c.replace(/\n/g, ' ⏎ ')).join(' | ')

// Редовете — от файла в git (не от content-server: той е само за вноса).
const файл = JSON.parse(
  readFileSync(path.join(/* turbopackIgnore: true */ process.cwd(), 'content/stranici/garanciya/sadarzhanie.json'), 'utf8'),
) as { sekcii: { blockType: string; heading?: string; rows?: { cells: string[] }[] }[] }
const отФайла = файл.sekcii.filter((b) => b.blockType === 'simpleTable' && b.heading === ЗАГЛАВИЕ)
if (отФайла.length !== 1 || !отФайла[0]!.rows?.length) throw new Error(`във файла няма една таблица „${ЗАГЛАВИЕ}"`)
const нови = отФайла[0]!.rows!.map((r) => r.cells.map(String))

const страница = (
  await payload.find({ collection: 'pages', where: { slug: { equals: 'garanciya' } }, depth: 0, draft: true, limit: 1 })
).docs[0]
if (!страница) throw new Error('няма страница garanciya')

type Блок = NonNullable<Page['layout']>[number]
const layout = structuredClone(страница.layout ?? []) as Блок[]
const индекси = layout.flatMap((b, i) => (b.blockType === 'simpleTable' && b.heading === ЗАГЛАВИЕ ? [i] : []))
if (индекси.length !== 1) throw new Error(`на страницата има ${индекси.length} таблици „${ЗАГЛАВИЕ}" (очаква се 1)`)
const и = индекси[0]!
const таблица = layout[и] as Extract<Блок, { blockType: 'simpleTable' }>
const сегашни = (таблица.rows ?? []).map((r) => (r.cells ?? []).map((c) => c.value ?? ''))

if (JSON.stringify(сегашни) === JSON.stringify(нови)) {
  log('без промяна — таблицата вече е новата')
  process.exit(0)
}
if (страница.updatedAt !== ПРОВЕРЕНА) {
  throw new Error(`страницата е записвана след проверката (${страница.updatedAt}) — спирам, сравнете отново с файла`)
}
const публикувана = await payload.findByID({ collection: 'pages', id: страница.id, depth: 0, draft: false })
if (чисто(публикувана.layout) !== чисто(страница.layout)) {
  throw new Error('страницата има непубликувани промени в админа — публикувайте ги или ги отхвърлете и пуснете пак')
}

log(`ПРЕДИ (${сегашни.length} реда):`)
сегашни.forEach((r, i) => log(`  ${i + 1}. ${ред(r)}`))
log(`СЛЕД (${нови.length} реда):`)
нови.forEach((r, i) => log(`  ${i + 1}. ${ред(r)}`))
if (dryRun) process.exit(0)

if (String(process.env.DATABASE_URI ?? '').includes('tmp-')) log('копие на базата — без архив')
else {
  const { doc } = await createBackup(payload, { label: 'Преди таблицата „Гаранционни срокове"', trigger: 'ръчно' })
  log(`Архив: „${doc.label}" (№ ${doc.id})`)
}

таблица.rows = нови.map((cells) => ({ cells: cells.map((value) => ({ value })) }))
const след = await payload.update({ collection: 'pages', id: страница.id, data: { layout, _status: 'published' }, depth: 0 })

const преди = страница.layout ?? []
const сега = след.layout ?? []
if (преди.length !== сега.length) throw new Error('броят секции се промени')
преди.forEach((b, i) => {
  if (i === и) return
  if (чисто(b) !== чисто(сега[i])) throw new Error(`секция ${i + 1} (${b.blockType}) се промени`)
})
const т = сега[и] as Extract<Блок, { blockType: 'simpleTable' }>
const стара = преди[и] as Extract<Блок, { blockType: 'simpleTable' }>
if (т.heading !== стара.heading || т.note !== стара.note || чисто(т.columns) !== чисто(стара.columns)) {
  throw new Error('заглавието, колоните или бележката на таблицата се промениха')
}
const записани = (т.rows ?? []).map((r) => (r.cells ?? []).map((c) => c.value ?? ''))
if (JSON.stringify(записани) !== JSON.stringify(нови)) throw new Error('записаните редове не съвпадат с файла')
log(`✓ /garanciya — ${записани.length} реда; другите ${преди.length - 1} секции без промяна`)
log(await revalidateServer())
process.exit(0)
