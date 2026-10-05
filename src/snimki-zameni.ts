/**
 * Подмяна на снимки в Медия с файловете от `content/snimki/`.
 *
 * Пуска се с:  npm run snimki:zameni
 *              npm run snimki:zameni -- --dry-run   (само казва какво би заменил)
 *
 * За всеки файл в `content/snimki/` търси запис в Медия със СЪЩАТА основа
 * на името (без разширението): `61566_1.png` → записът `61566_1.webp`.
 * Записът остава същият (номер, alt, всички продукти, които го сочат);
 * сменят се файлът и размерите. При няколко файла с една основа печели
 * `.png` — обработените снимки с прозрачен фон (`snimki:bql-fon`).
 *
 * Защо отделно от `import:all`: вносът търси в `content/snimki/` по имената
 * от `sadarzhanie.json`, а името в Медия понякога е друго — наставка заради
 * регистъра (`3_1_img-8c4af0`), разделяне на `07.jpg`/`07.png` в
 * `07-jpg`/`07-png`. Тук съпоставянето е по името в Медия, тоест по името,
 * под което `snimki:bql-fon` е копирал снимката.
 *
 * Файл, който вече е в Медия байт по байт, се прескача. Преди първата
 * истинска подмяна се прави архив (оригиналите в `media/` се презаписват),
 * без архив скриптът спира. Накрая — отчет и опресняване на кеша на сървъра.
 */
import config from '@payload-config'
import fs from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'

import { createBackup } from './lib/backup'
import {
  bareStem,
  caseSafeStem,
  replaceMediaContent,
  revalidateServer,
  SNIMKI_DIR,
} from './import-product-core'

const MEDIA_DIR = path.join(process.cwd(), 'media')
const dryRun = process.argv.includes('--dry-run')
const ФОРМАТИ = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif'])

const payload = await getPayload({ config })

/* Файловете по основа; PNG първо. */
const поОснова = new Map<string, string>()
for (const name of (await fs.readdir(SNIMKI_DIR)).sort()) {
  const ext = path.extname(name).toLowerCase()
  if (!ФОРМАТИ.has(ext)) continue
  const stem = bareStem(name)
  const има = поОснова.get(stem)
  if (!има || (ext === '.png' && path.extname(има).toLowerCase() !== '.png')) поОснова.set(stem, name)
}

const медия = await payload.find({
  collection: 'media',
  pagination: false,
  depth: 0,
  select: { filename: true, alt: true, sizes: true },
})
/** Основа на записа → записът; точният регистър (Windows не го различава, базата — да). */
const записи = new Map(
  медия.docs.filter((m) => m.filename).map((m) => [path.basename(m.filename!, path.extname(m.filename!)), m]),
)

const заменени: string[] = []
const същите: string[] = []
const безСъвпадение: string[] = []
const неуспешни: string[] = []
let архив = false

for (const [stem, name] of поОснова) {
  const запис = записи.get(stem) ?? записи.get(caseSafeStem(stem))
  if (!запис) {
    безСъвпадение.push(name)
    continue
  }
  const данни = await fs.readFile(path.join(SNIMKI_DIR, name))
  const качен = await fs.readFile(path.join(MEDIA_DIR, запис.filename!)).catch(() => null)
  if (качен?.equals(данни)) {
    същите.push(name)
    continue
  }
  if (dryRun) {
    заменени.push(`${name} → № ${запис.id} (${запис.filename})`)
    continue
  }
  if (!архив) {
    try {
      const { doc } = await createBackup(payload, { label: 'Преди замяна на снимки (snimki:zameni)', trigger: 'ръчно' })
      console.log(`Архив преди замяната: „${doc.label}" (№ ${doc.id})`)
      архив = true
    } catch (e) {
      console.error(`\n✗ Архивът не се направи: ${(e as Error).message}\n  Замяната е спряна.`)
      process.exit(1)
    }
  }
  const ext = path.extname(name).toLowerCase()
  const realExt = ext === '.jpeg' ? '.jpg' : ext
  const успя = await replaceMediaContent(
    payload,
    (m) => console.log(m),
    запис as never,
    данни,
    realExt,
    name,
    запис.alt ?? '',
  )
  if (успя) заменени.push(`${name} → № ${запис.id} (${запис.filename})`)
  else неуспешни.push(name)
}

console.log(`\nЗАМЯНА НА СНИМКИ — content/snimki/ (${поОснова.size} файла)${dryRun ? ' — ПРОВЕРКА, нищо не е записано' : ''}`)
console.log(`${dryRun ? 'Биха се заменили' : 'Заменени'}: ${заменени.length}`)
for (const z of заменени) console.log(`  ✓ ${z}`)
console.log(`Вече същите в Медия: ${същите.length}`)
console.log(`Без съвпадение в Медия: ${безСъвпадение.length}`)
for (const b of безСъвпадение) console.log(`  · ${b}`)
if (неуспешни.length) {
  console.log(`Неуспешни: ${неуспешни.length}`)
  for (const n of неуспешни) console.log(`  ✗ ${n}`)
}
if (заменени.length && !dryRun) console.log(await revalidateServer())
process.exit(неуспешни.length ? 1 : 0)
