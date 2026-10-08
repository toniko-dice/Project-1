/**
 * Еднократно (8 октомври 2026, по поръка на собственика) — „За ДИ СИ 2008"
 * в базата, както `content/stranici/za-di-si-2008/sadarzhanie.json`:
 *
 * - „Фирмени данни": без реда „Управител";
 * - „Магазини": Dice.bg София — „Неделя: почивен ден" (както Асеновград).
 *
 * Пипа САМО тези два блока; останалото се сравнява преди и след записа.
 * Спира при непубликувани промени в админа. Повторяем. Архив преди записа.
 *
 *   npm run za-di-si:popravki [-- --dry-run]
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import type { Page } from './payload-types'
import { createBackup } from './lib/backup'
import { revalidateServer } from './import-product-core'

const dryRun = process.argv.includes('--dry-run')
const payload = await getPayload({ config })
const log = (m: string) => console.log(m)
const чисто = (x: unknown) => JSON.stringify(x).replace(/"id":"[^"]*",?/g, '')

const страница = (
  await payload.find({ collection: 'pages', where: { slug: { equals: 'za-di-si-2008' } }, depth: 0, draft: true, limit: 1 })
).docs[0]
if (!страница) throw new Error('няма страница za-di-si-2008')

type Блок = NonNullable<Page['layout']>[number]
const layout = structuredClone(страница.layout ?? []) as Блок[]
const сменени = new Set<number>()

layout.forEach((b, i) => {
  if (b.blockType === 'simpleTable') {
    const редове = b.rows ?? []
    const без = редове.filter((r) => r.cells?.[0]?.value?.trim() !== 'Управител')
    if (без.length !== редове.length) {
      b.rows = без
      сменени.add(i)
      log('• „Фирмени данни": махам реда „Управител"')
    }
  }
  if (b.blockType === 'stores') {
    for (const s of b.stores ?? []) {
      if (s.name !== 'Dice.bg София') continue
      const часове = s.hours ?? []
      if (!часове.some((h) => h.fromDay === 'Sunday' || h.toDay === 'Sunday')) {
        s.hours = [...часове, { fromDay: 'Sunday', closed: true } as (typeof часове)[number]]
        сменени.add(i)
        log('• „Магазини": Dice.bg София — неделя: почивен ден')
      }
    }
  }
})

if (!сменени.size) {
  log('без промяна')
  process.exit(0)
}
const публикувана = await payload.findByID({ collection: 'pages', id: страница.id, depth: 0, draft: false })
if (чисто(публикувана.layout) !== чисто(страница.layout)) {
  throw new Error('страницата има непубликувани промени в админа — публикувайте ги или ги отхвърлете и пуснете пак')
}
if (dryRun) process.exit(0)

if (String(process.env.DATABASE_URI ?? '').includes('tmp-')) log('копие на базата — без архив')
else {
  const { doc } = await createBackup(payload, { label: 'Преди поправките на „За ДИ СИ 2008"', trigger: 'ръчно' })
  log(`Архив: „${doc.label}" (№ ${doc.id})`)
}

const след = await payload.update({ collection: 'pages', id: страница.id, data: { layout, _status: 'published' }, depth: 0 })
const преди = страница.layout ?? []
const сега = след.layout ?? []
if (преди.length !== сега.length) throw new Error('броят секции се промени')
преди.forEach((b, i) => {
  if (сменени.has(i)) return
  if (чисто(b) !== чисто(сега[i])) throw new Error(`секция ${i + 1} (${b.blockType}) се промени`)
})
log('✓ /za-di-si-2008')
log(await revalidateServer())
process.exit(0)
