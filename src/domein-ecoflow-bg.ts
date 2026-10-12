/**
 * Еднократно (`task-kachvane-server.md`, т. 11) — домейнът е `ecoflow.bg`,
 * не `bg-ecoflow.com`. В базата старият стои само в трите правни страници:
 * мета описанието и увода (`pageIntro`) — същото като в
 * `content/stranici/<slug>/sadarzhanie.json`.
 *
 * Пипа САМО тези полета; останалото се сравнява преди и след. Спира при
 * непубликувани промени. Старите ВЕРСИИ не се пипат (история), както и
 * офертите — те са документи, част от тях изпратени. Повторяем. Архив
 * преди записа (без архив върху копие).
 *
 *   npm run domein:ecoflow-bg [-- --dry-run]
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import type { Page } from './payload-types'
import { createBackup } from './lib/backup'
import { revalidateServer } from './import-product-core'

const СТАР = /(https?:\/\/)?bg-ecoflow\.com/g
const нов = (s: string) => s.replace(СТАР, (_, proto) => (proto ? 'https://ecoflow.bg' : 'ecoflow.bg'))
const dryRun = process.argv.includes('--dry-run')
const копие = String(process.env.DATABASE_URI ?? '').includes('tmp-')
const payload = await getPayload({ config })
const log = (m: string) => console.log(m)
const чисто = (x: unknown) => JSON.stringify(x).replace(/"id":"[^"]*",?/g, '')

type Блок = NonNullable<Page['layout']>[number]
const промени: { страница: Page; data: Partial<Page>; описание: string[] }[] = []

for (const slug of ['obshti-usloviya', 'poveritelnost', 'biskvitki']) {
  const p = (await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, depth: 0, draft: true, limit: 1 })).docs[0]
  if (!p) continue
  const pub = await payload.findByID({ collection: 'pages', id: p.id, depth: 0, draft: false })
  if (pub._status === 'published' && p._status !== 'published') throw new Error(`${slug}: има непубликувани промени — спирам`)
  const описание: string[] = []
  const data: Partial<Page> = {}
  const мета = p.metaDescription ?? ''
  if (СТАР.test(мета)) {
    data.metaDescription = нов(мета)
    описание.push(`мета описание: „${мета}" → „${нов(мета)}"`)
  }
  СТАР.lastIndex = 0
  const layout = structuredClone(p.layout ?? []) as Блок[]
  let сменен = false
  for (const b of layout) {
    if (b.blockType === 'pageIntro' && typeof b.body === 'string' && b.body.includes('bg-ecoflow.com')) {
      описание.push(`увод: „${b.body}" → „${нов(b.body)}"`)
      b.body = нов(b.body)
      сменен = true
    }
  }
  if (сменен) data.layout = layout
  if (описание.length) промени.push({ страница: p, data, описание })
}

if (!промени.length) {
  log('няма какво да се сменя')
  process.exit(0)
}
for (const п of промени) log(`• ${п.страница.slug}:\n    ${п.описание.join('\n    ')}`)
if (dryRun) process.exit(0)

if (копие) log('копие на базата — без архив')
else {
  const { doc } = await createBackup(payload, { label: 'Преди смяната на домейна в правните страници (ecoflow.bg)', trigger: 'ръчно' })
  log(`архив № ${doc.id}`)
}

for (const п of промени) {
  const без = (d: Page) => чисто({ ...d, metaDescription: undefined, layout: (d.layout ?? []).map((b) => (b.blockType === 'pageIntro' ? { ...b, body: undefined } : b)), updatedAt: undefined })
  const преди = без(п.страница)
  await payload.update({ collection: 'pages', id: п.страница.id, data: { ...п.data, _status: 'published' }, depth: 0 })
  const след = await payload.findByID({ collection: 'pages', id: п.страница.id, depth: 0, draft: false })
  log(`${п.страница.slug}: ${без(след) === преди ? 'останалото — без промяна' : '⚠ друго поле също се различава'}`)
}
log(await revalidateServer())
process.exit(0)
