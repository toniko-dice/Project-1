/**
 * Еднократно (`task-dostavka-i-trail.md`, 13 октомври 2026):
 *
 * 1. „Общи настройки" → тъмната лента: линкът `/dostavka` (404) се маха —
 *    лентата остава, но е само текст;
 * 2. категорията „TRAIL серия" (`trail-seriya`) → „Скрита";
 * 3. „Пренасочвания": `/kategorii/trail-seriya` и
 *    `/kategorii/trail-seriya/aksesoari` → `/kategorii/chanti-i-kalafi` (301).
 *
 * Чантата за TRAIL остава в „Чанти и калъфи" — връзката ѝ „Съвместим с"
 * към TRAIL не се трие, просто не се показва (категорията е скрита).
 *
 * Пипа САМО тези места; останалото се сравнява преди и след записа.
 * Повторяем. Архив преди записа (без архив върху копие).
 *
 *   npm run trail:skrivane [-- --dry-run]
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import type { Category, SiteSetting } from './payload-types'
import { createBackup } from './lib/backup'
import { revalidateServer } from './import-product-core'

const dryRun = process.argv.includes('--dry-run')
const копие = String(process.env.DATABASE_URI ?? '').includes('tmp-')
const payload = await getPayload({ config })
const log = (m: string) => console.log(m)
const чисто = (x: unknown) => JSON.stringify(x).replace(/"id":"[^"]*",?/g, '')

const ЦЕЛ = '/kategorii/chanti-i-kalafi'
const ПРЕНАСОЧВАНИЯ = ['/kategorii/trail-seriya', '/kategorii/trail-seriya/aksesoari']

const settings = (await payload.findGlobal({ slug: 'site-settings', depth: 0 })) as SiteSetting & {
  announcementUrl?: string | null
}
const лента = Boolean(settings.announcementUrl)
log(лента ? `лента: линк „${settings.announcementUrl}" → без линк` : 'лента: вече без линк')

const trail = (await payload.find({ collection: 'categories', where: { slug: { equals: 'trail-seriya' } }, depth: 0, limit: 1 }))
  .docs[0] as Category | undefined
if (!trail) log('⚠ няма категория trail-seriya')
const скрий = Boolean(trail && !trail.hidden)
log(trail ? (скрий ? `категория № ${trail.id} „${trail.title}" → Скрита` : 'категория trail-seriya: вече скрита') : '')

const ново: string[] = []
for (const from of ПРЕНАСОЧВАНИЯ) {
  const ex = (await payload.find({ collection: 'redirects', where: { from: { equals: from } }, depth: 0, limit: 1 })).docs[0] as
    | { to: string }
    | undefined
  if (ex?.to === ЦЕЛ) log(`пренасочване ${from}: вече → ${ЦЕЛ}`)
  else {
    ново.push(from)
    log(`пренасочване ${from} → ${ЦЕЛ}${ex ? ` (беше → ${ex.to})` : ''}`)
  }
}

if (!лента && !скрий && !ново.length) {
  log('няма какво да се сменя')
  process.exit(0)
}
if (dryRun) process.exit(0)

if (копие) log('копие на базата — без архив')
else {
  const { doc } = await createBackup(payload, { label: 'Преди: лентата без /dostavka, скриване на TRAIL', trigger: 'ръчно' })
  log(`архив № ${doc.id}`)
}

if (лента) {
  const без = (s: typeof settings) => чисто({ ...s, announcementUrl: undefined, updatedAt: undefined })
  const преди = без(settings)
  await payload.updateGlobal({ slug: 'site-settings', data: { announcementUrl: '' } as never, depth: 0 })
  const след = (await payload.findGlobal({ slug: 'site-settings', depth: 0 })) as typeof settings
  log(`лента: „${след.announcementUrl ?? ''}"; останалото — ${без(след) === преди ? 'без промяна' : '⚠ различно'}`)
}

if (скрий && trail) {
  const без = (c: Category) => чисто({ ...c, hidden: undefined, updatedAt: undefined })
  const преди = без(trail)
  await payload.update({ collection: 'categories', id: trail.id, data: { hidden: true }, depth: 0 })
  const след = (await payload.findByID({ collection: 'categories', id: trail.id, depth: 0 })) as Category
  log(`категория: hidden=${след.hidden}; останалото — ${без(след) === преди ? 'без промяна' : '⚠ различно'}`)
}

// След скриването: при запис на скрита категория пренасочването от адреса ѝ не се трие.
for (const from of ново) {
  const ex = (await payload.find({ collection: 'redirects', where: { from: { equals: from } }, depth: 0, limit: 1 })).docs[0]
  const data = { from, to: ЦЕЛ, reason: 'TRAIL серия е скрита — серията не се продава; чантата е в „Чанти и калъфи"' }
  const r = ex
    ? await payload.update({ collection: 'redirects', id: ex.id, data, depth: 0 })
    : await payload.create({ collection: 'redirects', data, depth: 0 })
  log(`пренасочване № ${r.id}: ${from} → ${ЦЕЛ}`)
}

log(await revalidateServer())
process.exit(0)
