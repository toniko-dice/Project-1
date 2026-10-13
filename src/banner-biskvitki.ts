/**
 * Еднократно (`task-banner-biskvitki.md`, т. 4 и 7):
 *
 * - „Футър" → колона „Правна информация": линк „Настройки на бисквитките"
 *   (`#nastroyki-biskvitki` — отваря настройките на банера отвсякъде), след
 *   „Бисквитки". Колоната се намира по заглавие; няма ли я — само съобщение;
 * - страница `/biskvitki`: отметка „Таблица с бисквитките (автоматично)".
 *
 * Пипа САМО тези две места; останалото се сравнява преди и след записа.
 * Спира, ако страницата има непубликувани промени (записът публикува).
 * Повторяем. Архив преди записа (без архив върху копие).
 *
 *   npm run banner:biskvitki [-- --dry-run]
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import type { Footer, Page } from './payload-types'
import { createBackup } from './lib/backup'
import { CONSENT_SETTINGS_HASH } from './lib/consent'
import { revalidateServer } from './import-product-core'

const dryRun = process.argv.includes('--dry-run')
const копие = String(process.env.DATABASE_URI ?? '').includes('tmp-')
const payload = await getPayload({ config })
const log = (m: string) => console.log(m)
const чисто = (x: unknown) => JSON.stringify(x).replace(/"id":"[^"]*",?/g, '')
const ЛИНК = { label: 'Настройки на бисквитките', url: CONSENT_SETTINGS_HASH }

const footer = (await payload.findGlobal({ slug: 'footer', depth: 0 })) as Footer
const колони = structuredClone(footer.columns ?? [])
const правна = колони.find((c) => /правн/i.test(c.heading ?? ''))
let футърПромяна = false
if (!правна) log('⚠ Футър: няма колона „Правна информация" — линкът не е добавен (сложете го от админа: адрес #nastroyki-biskvitki).')
else if ((правна.links ?? []).some((l) => l.url === ЛИНК.url)) log('Футър: линкът вече е там.')
else {
  const links = правна.links ?? []
  const i = links.findIndex((l) => l.url === '/biskvitki')
  links.splice(i >= 0 ? i + 1 : links.length, 0, { ...ЛИНК })
  правна.links = links
  футърПромяна = true
  log(`Футър: + „${ЛИНК.label}" в „${правна.heading}" (${links.map((l) => l.label).join(' · ')})`)
}

const стр = (await payload.find({ collection: 'pages', where: { slug: { equals: 'biskvitki' } }, depth: 0, draft: true, limit: 1 })).docs[0] as Page | undefined
let страницаПромяна = false
if (!стр) log('⚠ Няма страница biskvitki.')
else if (стр.cookieTable) log('/biskvitki: таблицата вече е включена.')
else {
  const pub = (await payload.findByID({ collection: 'pages', id: стр.id, depth: 0, draft: false })) as Page
  if (pub._status === 'published' && стр._status !== 'published') throw new Error('biskvitki: има непубликувани промени — спирам')
  страницаПромяна = true
  log('/biskvitki: + „Таблица с бисквитките (автоматично)"')
}

if (!футърПромяна && !страницаПромяна) {
  log('няма какво да се сменя')
  process.exit(0)
}
if (dryRun) process.exit(0)

if (копие) log('копие на базата — без архив')
else {
  const { doc } = await createBackup(payload, { label: 'Преди банера за бисквитки (футър, /biskvitki)', trigger: 'ръчно' })
  log(`архив № ${doc.id}`)
}

if (футърПромяна) {
  const безЛинка = (f: Footer) => чисто({ ...f, columns: (f.columns ?? []).map((c) => ({ ...c, links: (c.links ?? []).filter((l) => l.url !== ЛИНК.url) })), updatedAt: undefined })
  const преди = безЛинка(footer)
  await payload.updateGlobal({ slug: 'footer', data: { columns: колони }, depth: 0 })
  const след = (await payload.findGlobal({ slug: 'footer', depth: 0 })) as Footer
  log(`футър: ${безЛинка(след) === преди ? 'останалото — без промяна' : '⚠ друго също се различава'}`)
}
if (страницаПромяна && стр) {
  const без = (p: Page) => чисто({ ...p, cookieTable: undefined, updatedAt: undefined, _status: undefined })
  const преди = без(стр)
  await payload.update({ collection: 'pages', id: стр.id, data: { cookieTable: true, _status: 'published' }, depth: 0 })
  const след = (await payload.findByID({ collection: 'pages', id: стр.id, depth: 0, draft: false })) as Page
  log(`/biskvitki: ${без(след) === преди ? 'останалото — без промяна' : '⚠ друго поле също се различава'}`)
}
log(await revalidateServer())
process.exit(0)
