/**
 * Еднократна поправка: снимки в Медия с имена, различни само по регистъра.
 *
 * На Windows `3_1_img.jpg` и `3_1_IMG.jpg` са един файл. На 30 септември
 * 2026 вносът на Wave 3 записа своите снимки върху тези на RIVER 3
 * (виж `caseSafeStem` в `import-product-core.ts`). Скриптът:
 *
 *  1. прави архив;
 *  2. мести ПО-НОВИЯ запис от всяка двойка под `caseSafeStem` — файлът
 *     на диска е неговият (записан е последен), размерите се правят наново;
 *  3. връща файловете на ПО-СТАРИЯ — от папката `RESTORE_DIR` (извадени от
 *     архив отпреди сблъсъка), а каквото там липсва, се прави наново от
 *     оригинала му;
 *  4. трие останалите файлове на по-новия, които вече не са на никого.
 *
 * Пуска се с:  RESTORE_DIR=<папка> npx payload run src/repair-case-collisions.ts
 * Повторяем: двойка, в която по-новият вече е с наставка, не е двойка.
 */
import config from '@payload-config'
import fs from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'

import { caseSafeStem, mediaFileNames, writeImageSizes } from './import-product-core'
import { createBackup } from './lib/backup'

type Doc = { id: number; filename?: string | null; filesize?: number | null; sizes?: unknown }

const MEDIA_DIR = path.resolve(process.cwd(), 'media')
const RESTORE_DIR = process.env.RESTORE_DIR ?? ''
const stemOf = (f: string) => path.basename(f, path.extname(f))

const payload = await getPayload({ config })

const { docs } = (await payload.find({
  collection: 'media',
  limit: 0,
  pagination: false,
  depth: 0,
})) as unknown as { docs: Doc[] }

/* ─── двойките: едно име (без регистъра) на два записа ─── */
const поИме = new Map<string, Set<number>>()
for (const doc of docs) {
  for (const f of mediaFileNames(doc)) {
    const k = f.toLowerCase()
    поИме.set(k, (поИме.get(k) ?? new Set()).add(doc.id))
  }
}
const двойки = new Map<number, number>() // по-нов → по-стар
for (const ids of поИме.values()) {
  if (ids.size < 2) continue
  const [по_стар, ...нови] = [...ids].sort((a, b) => a - b)
  for (const нов of нови) двойки.set(нов, по_стар!)
}

if (!двойки.size) {
  console.log('Няма имена, различни само по регистъра — нищо за поправяне.')
  process.exit(0)
}
console.log(`Двойки (по-нов → по-стар): ${[...двойки].map(([a, b]) => `${a}→${b}`).join(', ')}`)

const { doc: архив } = await createBackup(payload, {
  label: 'Преди поправка на снимки с имена, различни само по регистъра',
  trigger: 'ръчно',
})
console.log(`Архив: „${архив.label}" (№ ${архив.id})`)

const byId = new Map(docs.map((d) => [d.id, d]))

/* ─── 1. по-новите — под наставката ─── */
const стариИменаНаНовите = new Set<string>()
const новиИмена = new Set<string>()
for (const id of new Set(двойки.keys())) {
  const doc = byId.get(id)!
  const стар = doc.filename!
  const данни = await fs.readFile(path.join(MEDIA_DIR, стар))
  if (doc.filesize && данни.length !== doc.filesize) {
    throw new Error(`№ ${id} ${стар}: на диска е ${данни.length} B, записът казва ${doc.filesize} B — спирам`)
  }
  const stem = caseSafeStem(stemOf(стар))
  const filename = `${stem}${path.extname(стар)}`
  await fs.writeFile(path.join(MEDIA_DIR, filename), данни)
  const sizes = await writeImageSizes(payload, stem, данни)
  await payload.update({ collection: 'media', id, data: { filename, sizes } as never, depth: 0 })
  for (const f of mediaFileNames(doc)) стариИменаНаНовите.add(f.toLowerCase())
  for (const f of mediaFileNames({ filename, sizes })) новиИмена.add(f.toLowerCase())
  console.log(`  № ${id}: ${стар} → ${filename}`)
}

/* ─── 2. по-старите — файловете им се връщат ─── */
const имената = new Set<string>()
for (const id of new Set(двойки.values())) {
  const doc = byId.get(id)!
  const main = doc.filename!
  const върнати: string[] = []

  // Оригиналът: от архива, ако е там; иначе остава (не е бил засегнат).
  const отАрхива = path.join(RESTORE_DIR, main)
  if (RESTORE_DIR && (await fs.stat(отАрхива).catch(() => null))) {
    await fs.rm(path.join(MEDIA_DIR, main), { force: true })
    await fs.copyFile(отАрхива, path.join(MEDIA_DIR, main))
    върнати.push(main)
  }

  // Размерите: от архива; ако дори един липсва там — всички наново от оригинала.
  const размери = mediaFileNames(doc).filter((f) => f !== main)
  const наличие = await Promise.all(
    размери.map((f) => fs.stat(path.join(RESTORE_DIR, f)).then(() => true, () => false)),
  )
  // Първо се трият: така записът на диска получава точно регистъра от базата.
  for (const f of размери) await fs.rm(path.join(MEDIA_DIR, f), { force: true })
  if (RESTORE_DIR && наличие.every(Boolean)) {
    for (const f of размери) await fs.copyFile(path.join(RESTORE_DIR, f), path.join(MEDIA_DIR, f))
    /*
      Празен запис — само за ново `updatedAt`. Адресът на снимката носи
      `?v=<updatedAt>`; без него браузър, заредил страницата със
      сгрешената снимка, продължава да я показва от кеша.
    */
    await payload.update({ collection: 'media', id, data: {}, depth: 0 })
    върнати.push(`${размери.length} размера от архива`)
  } else {
    const данни = await fs.readFile(path.join(MEDIA_DIR, main))
    const sizes = await writeImageSizes(payload, stemOf(main), данни)
    await payload.update({ collection: 'media', id, data: { sizes } as never, depth: 0 })
    върнати.push(`${Object.keys(sizes).length} размера наново от оригинала`)
  }
  for (const f of mediaFileNames(doc)) имената.add(f.toLowerCase())
  console.log(`  № ${id} ${main}: ${върнати.join(', ')}`)
}

/* ─── 3. каквото е останало от по-новите и не е на никого ─── */
let изтрити = 0
for (const f of стариИменаНаНовите) {
  if (имената.has(f) || новиИмена.has(f)) continue
  await fs.rm(path.join(MEDIA_DIR, f), { force: true })
  изтрити += 1
}
console.log(`Изтрити осиротели файлове: ${изтрити}`)
process.exit(0)
