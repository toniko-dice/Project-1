/**
 * Смислени имена на всички снимки — веднъж и навсякъде (`task-snimki-imena.md`).
 *
 *   npm run snimki:imena -- --dry-run   само таблицата content/snimki-imena.csv
 *   npm run snimki:imena                смяната + опресняване на кеша
 *
 * Правилото и какво се пипа — `src/snimki-imena-core.ts`. Преди истинската
 * смяна: защитен архив на базата и `media/` и zip на `content/` в
 * `backups/`. Повторяемо: снимка с правилното име не се докосва.
 */
import config from '@payload-config'
import { createWriteStream } from 'fs'
import fs from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'

import { CONTENT_ROOT, revalidateServer } from './import-product-core'
import { createArchiver, createBackup, STORE_DIR } from './lib/backup'
import { csvЗаПлана, CSV_FILE, планЗаИмена, приложиПлана } from './snimki-imena-core'

const dryRun = process.argv.includes('--dry-run')
const payload = await getPayload({ config })

const план = await планЗаИмена(payload)
await fs.writeFile(CSV_FILE, csvЗаПлана(план), 'utf-8')

const папки = new Set(план.файлове.map((ф) => path.relative(CONTENT_ROOT, ф.dir).split(path.sep)[0]))
console.log(`\nИМЕНА НА СНИМКИТЕ${dryRun ? ' — ПРОВЕРКА, нищо не е сменено' : ''}`)
console.log(`Медия: ${план.записи.length} за смяна, ${план.същите} вече с правилното име`)
console.log(`content/: ${план.текстове.size} файла с текст (JSON, .md, .txt), ${план.файлове.length} снимки за преименуване`)
console.log(`  в папки: ${[...папки].sort().join(', ') || '—'}`)
console.log(`Без съвпадение: ${план.безСъвпадение.length}`)
for (const б of план.безСъвпадение) console.log(`  · ${б.файл} — ${б.къде}`)
if (план.проблеми.length) {
  console.log(`Проблеми: ${план.проблеми.length}`)
  for (const п of план.проблеми) console.log(`  ⚠ ${п}`)
}
console.log(`Таблицата: content/snimki-imena.csv`)

if (dryRun || (!план.записи.length && !план.текстове.size && !план.файлове.length)) {
  if (!dryRun) console.log('Няма какво да се сменя.')
  process.exit(0)
}

/* ─── архив: база + media/ и content/ ─── */
try {
  const { doc } = await createBackup(payload, {
    label: 'Преди смислените имена на снимките (snimki:imena)',
    trigger: 'ръчно',
    protected: true,
  })
  console.log(`\nАрхив на базата и снимките: „${doc.label}" (№ ${doc.id})`)

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const zip = path.join(STORE_DIR, `content-${stamp}.zip`)
  await fs.mkdir(STORE_DIR, { recursive: true })
  await new Promise<void>((resolve, reject) => {
    const out = createWriteStream(zip)
    const a = createArchiver('zip', { store: true })
    out.on('close', () => resolve())
    a.on('error', reject)
    a.pipe(out)
    a.glob('**/*', { cwd: CONTENT_ROOT, ignore: ['*.zip', 'snimki-bql-fon/**'], dot: false }, { prefix: 'content' })
    void a.finalize()
  })
  console.log(`Архив на content/: backups/${path.basename(zip)}`)
} catch (e) {
  console.error(`\n✗ Архивът не се направи: ${(e as Error).message}\n  Смяната е спряна.`)
  process.exit(1)
}

/* ─── смяната ─── */
console.log('\nСмяна…')
const { медия, неуспешни } = await приложиПлана(payload, план, (m) => console.log(m))
console.log(`Медия: ${медия} записа с ново име`)
console.log(`content/: ${план.текстове.size} файла с текст, ${план.файлове.length} снимки преименувани`)
if (неуспешни.length) {
  console.log(`Неуспешни: ${неуспешни.length}`)
  for (const н of неуспешни) console.log(`  ✗ ${н}`)
}
console.log(await revalidateServer())
process.exit(неуспешни.length ? 1 : 0)
