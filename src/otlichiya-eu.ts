/**
 * Еднократно (`task-otlicheni-ot.md`) — „Отличени от" на началната с
 * логата от „Endorsed By" на eu.ecoflow.com:
 *
 * - шестте лога в Медия (`content/_originali/`, иначе се свалят);
 * - шест записа в „Отличия" — по име, съществуващият не се пипа;
 * - в блока „Лога и отличия" на началната — само тези шест, в този ред.
 *
 * Старите пет (iF Design, Red Dot…) остават в колекцията — само излизат
 * от блока. Пипа САМО списъка в блока; останалото се сравнява преди и
 * след записа. Повторяем. Архив преди записа (без архив върху копие).
 *
 *   npm run otlichiya:eu [-- --dry-run]
 */
import config from '@payload-config'
import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'

import { createBackup } from './lib/backup'
import { downloadFile, revalidateServer } from './import-product-core'

const ОТЛИЧИЯ = [
  { name: 'CHIP Highlight 2025', alt: 'CHIP Highlight 2025', file: 'otlichie-chip-highlight-2025.jpg', url: 'https://eu.ecoflow.com/cdn/shop/files/chip.jpg' },
  { name: 'Computer Bild — Testsieger', alt: 'Computer Bild Testsieger — EcoFlow STREAM, оценка 1,4', file: 'otlichie-computer-bild-testsieger.jpg', url: 'https://eu.ecoflow.com/cdn/shop/files/computer.jpg' },
  { name: 'BILD', alt: 'BILD', file: 'otlichie-bild.jpg', url: 'https://eu.ecoflow.com/cdn/shop/files/bild.jpg' },
  { name: 'IMTEST — Testsieger', alt: 'IMTEST Testsieger — EcoFlow STREAM Ultra, оценка „Gut“ (1,90)', file: 'otlichie-imtest-testsieger.jpg', url: 'https://eu.ecoflow.com/cdn/shop/files/IMTEST.jpg' },
  { name: 'connect — Very Good', alt: 'connect Check „Very Good“ — EcoFlow STREAM Ultra и AC Pro', file: 'otlichie-connect-very-good.jpg', url: 'https://eu.ecoflow.com/cdn/shop/files/connect.jpg' },
  { name: 'heise bestenlisten — Beste Innovation', alt: 'heise bestenlisten „Beste Innovation“, „Sehr gut“ — EcoFlow STREAM Ultra', file: 'otlichie-heise-beste-innovation.jpg', url: 'https://eu.ecoflow.com/cdn/shop/files/heise_d262cb47-5fcb-46c7-b260-c070929ae379.jpg' },
]

const dryRun = process.argv.includes('--dry-run')
const копие = String(process.env.DATABASE_URI ?? '').includes('tmp-')
const ПАПКА = path.resolve(process.env.CONTENT_ROOT ?? 'content', '_originali')
const payload = await getPayload({ config })
const log = (m: string) => console.log(m)
const json = (x: unknown) => JSON.stringify(x)
const основа = (f: string) => path.basename(f, path.extname(f))

/* ─── какво би се сменило ─── */

const медия = new Map<string, number>()
const отличия = new Map<string, number>()
for (const о of ОТЛИЧИЯ) {
  const m = await payload.find({ collection: 'media', where: { filename: { like: `${основа(о.file)}.` } }, limit: 5, depth: 0 })
  const точно = m.docs.find((d) => d.filename && основа(d.filename) === основа(о.file))
  if (точно) медия.set(о.file, точно.id)
  const a = await payload.find({ collection: 'awards', where: { name: { equals: о.name } }, limit: 1, depth: 0 })
  if (a.docs[0]) отличия.set(о.name, a.docs[0].id)
  log(`${о.name}: лого ${точно ? `в Медия (№ ${точно.id})` : 'ще се качи'}, запис ${a.docs[0] ? `има (№ ${a.docs[0].id})` : 'ще се създаде'}`)
}

const начална = (
  await payload.find({ collection: 'pages', where: { slug: { equals: 'home' } }, limit: 1, depth: 0, draft: true })
).docs[0]
if (!начална) throw new Error('няма начална страница')
const публикувана = await payload.findByID({ collection: 'pages', id: начална.id, depth: 0, draft: false })
/*
  Записът публикува. Ако в админа има непубликувани промени по началната,
  той би ги публикувал заедно с логата — спира, за да реши собственикът.
*/
const чисто = (x: unknown) => json(x).replace(/"id":"[^"]*",?/g, '')
if (чисто(начална.layout) !== чисто(публикувана.layout)) {
  throw new Error('началната има непубликувани промени в админа — публикувайте ги или ги отхвърлете и пуснете пак')
}

const индекс = (начална.layout ?? []).findIndex((b) => b.blockType === 'logoWall')
if (индекс < 0) throw new Error('на началната няма блок „Лога и отличия"')
const блок = (начална.layout ?? [])[индекс] as { awards?: (number | { id: number })[] | null }
const сега = (блок.awards ?? []).map((x) => (typeof x === 'number' ? x : x.id))
log(`в блока сега: ${json(сега)}`)

const всичкиГотови = ОТЛИЧИЯ.every((о) => отличия.has(о.name))
const желано = всичкиГотови ? ОТЛИЧИЯ.map((о) => отличия.get(о.name)!) : null
if (желано && json(желано) === json(сега)) {
  log('без промяна')
  process.exit(0)
}
if (dryRun) process.exit(0)

/* Върху копие — без архив: той пише в общата папка `backups/` (CLAUDE.md, т. 17). */
if (копие) log('копие на базата — без архив')
else {
  const { doc } = await createBackup(payload, { label: 'Преди логата „Отличени от" от EU', trigger: 'ръчно' })
  log(`Архив: „${doc.label}" (№ ${doc.id})`)
}

/* ─── запис ─── */

for (const о of ОТЛИЧИЯ) {
  if (!медия.has(о.file)) {
    const файл = path.join(ПАПКА, о.file)
    if (!fs.existsSync(файл)) {
      fs.mkdirSync(ПАПКА, { recursive: true })
      await downloadFile(`${о.url}?width=400`, файл)
      log(`свалено: ${о.file}`)
    }
    const m = await payload.create({ collection: 'media', data: { alt: о.alt }, filePath: файл })
    медия.set(о.file, m.id)
    log(`✓ Медия № ${m.id} — ${m.filename}`)
  }
  if (!отличия.has(о.name)) {
    const a = await payload.create({ collection: 'awards', data: { name: о.name, logo: медия.get(о.file)! }, depth: 0 })
    отличия.set(о.name, a.id)
    log(`✓ Отличие № ${a.id} — ${о.name}`)
  }
}

const layout = structuredClone(начална.layout ?? [])
;(layout[индекс] as { awards?: number[] }).awards = ОТЛИЧИЯ.map((о) => отличия.get(о.name)!)
const след = await payload.update({ collection: 'pages', id: начална.id, data: { layout, _status: 'published' }, depth: 0 })

const преди = начална.layout ?? []
const нови = след.layout ?? []
if (преди.length !== нови.length) throw new Error('началната: броят секции се промени')
преди.forEach((b, i) => {
  if (i === индекс) return
  if (чисто(b) !== чисто(нови[i])) throw new Error(`началната: секция ${i + 1} (${b.blockType}) се промени`)
})
const безСписък = (b: unknown) => чисто({ ...(b as object), awards: null })
if (безСписък(преди[индекс]) !== безСписък(нови[индекс])) throw new Error('„Лога и отличия": промени се и друго освен списъка')
log(`✓ началната — „Лога и отличия": ${json((нови[индекс] as { awards?: unknown }).awards)}`)

log(await revalidateServer())
process.exit(0)
