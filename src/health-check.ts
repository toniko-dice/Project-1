/**
 * Снимка на състоянието на базата.
 *
 * Пуска се с:  npm run health
 * Вика се и автоматично преди и след всяка миграция.
 *
 * Записва броячите в `.health/<дата час>.json` и при всяко следващо
 * пускане сравнява с предишната снимка. Разлика с минус при таблиците с
 * връзки означава, че нещо е изяло редове — точно каквото направи
 * миграцията 20260901_142626 с началната страница.
 *
 * ВАЖНО ЗА ЧЕТЕНЕТО НА ДАННИТЕ
 *
 * Броячите се вадят с чист SQL, не през `payload.find`.
 *
 * Скриптът работи и ПРЕДИ миграция — тоест в момент, когато кодът вече
 * описва колони, които базата още няма. Заявката на Payload изброява
 * всяка колона от конфигурацията поименно и се проваля с „no such
 * column" точно тогава, когато снимката е най-нужна. Чистият SQL брои
 * това, което наистина стои в базата.
 */
import config from '@payload-config'
import fs from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'

const payload = await getPayload({ config })

const db = payload.db as unknown as {
  execute: (args: { drizzle?: unknown; raw: string }) => Promise<unknown>
  drizzle?: unknown
}

/** Изпълнява четяща заявка и връща редовете. */
const query = async (raw: string): Promise<Record<string, unknown>[]> => {
  const res = (await db.execute({ drizzle: db.drizzle, raw })) as
    | { rows?: Record<string, unknown>[] }
    | Record<string, unknown>[]
  if (Array.isArray(res)) return res
  return res?.rows ?? []
}

const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v ?? 0))

/** Имената на колоните на дадена таблица. Празен списък, ако я няма. */
const columnsOf = async (table: string): Promise<string[]> =>
  (await query(`PRAGMA table_info(${table})`)).map((c) => String(c.name))

type Snapshot = {
  взето: string
  колекции: Record<string, { общо: number; публикувани?: number }>
  връзки: Record<string, number>
  начална: Record<string, number>
  проблеми: Record<string, number>
}

/* ─────────── колекции ─────────── */

const колекции: Snapshot['колекции'] = {}

// Адресът на колекцията и името на таблицата се различават с тиретата.
const COLLECTIONS = [
  'products',
  'categories',
  'pages',
  'menu-panels',
  'media',
  'testimonials',
  'awards',
  'backups',
] as const

for (const slug of COLLECTIONS) {
  const table = slug.replace(/-/g, '_')
  const cols = await columnsOf(table)

  if (!cols.length) {
    // Таблицата още не съществува — по-добре пропусната, отколкото нула.
    continue
  }

  const rows = await query(`SELECT COUNT(*) AS n FROM ${table}`)
  const entry: { общо: number; публикувани?: number } = { общо: num(rows[0]?.n) }

  // Само колекциите с чернови имат колона за статус.
  if (cols.includes('_status')) {
    const pub = await query(`SELECT COUNT(*) AS n FROM ${table} WHERE _status = 'published'`)
    entry.публикувани = num(pub[0]?.n)
  }

  колекции[slug] = entry
}

/* ─────────── таблици с връзки ─────────── */

const връзки: Snapshot['връзки'] = {}

const relTables = (
  await query("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%_rels' ORDER BY name")
).map((r) => String(r.name))

for (const table of relTables) {
  const cols = (await columnsOf(table)).filter((c) => c.endsWith('_id') && c !== 'parent_id')

  for (const col of cols) {
    const rows = await query(`SELECT COUNT(*) AS n FROM ${table} WHERE ${col} IS NOT NULL`)
    const n = num(rows[0]?.n)
    // Нулите се записват също — иначе изчезването на цяла връзка минава незабелязано.
    връзки[`${table} → ${col.replace(/_id$/, '')}`] = n
  }
}

/* ─────────── начална страница ─────────── */

const начална: Snapshot['начална'] = {}

/*
  Продуктите на началната страница висят в `pages_rels`, а не в самите
  блокове. Затова се броят по пътя на блока — така се вижда не само общият
  брой, а и кой блок е останал празен.
*/
const homeRows = await query("SELECT id FROM pages WHERE slug = 'home' LIMIT 1")
const homeId = homeRows[0]?.id

if (homeId !== undefined && (await columnsOf('pages_rels')).includes('products_id')) {
  const perPath = await query(
    `SELECT path, COUNT(*) AS n FROM pages_rels
      WHERE parent_id = ${num(homeId)} AND products_id IS NOT NULL
      GROUP BY path ORDER BY path`,
  )

  let общо = 0
  for (const row of perPath) {
    const n = num(row.n)
    общо += n
    начална[`блок ${String(row.path)}`] = n
  }

  начална['продуктови блокове'] = perPath.length
  начална['продукти общо'] = общо
}

/* ─────────── проблеми ─────────── */

const проблеми: Snapshot['проблеми'] = {}

const bezSnimka = await query('SELECT COUNT(*) AS n FROM products WHERE image_id IS NULL')
проблеми['продукти без основна снимка'] = num(bezSnimka[0]?.n)

const mediaRows = await query('SELECT filename FROM media')
let липсващи = 0
for (const m of mediaRows) {
  const f = m.filename
  if (typeof f !== 'string') continue
  try {
    await fs.access(path.join(process.cwd(), 'media', f))
  } catch {
    липсващи += 1
  }
}
проблеми['медия без файл на диска'] = липсващи
проблеми['медия общо'] = mediaRows.length

/* ─────────── запис и сравнение ─────────── */

const snapshot: Snapshot = {
  взето: new Date().toISOString(),
  колекции,
  връзки,
  начална,
  проблеми,
}

const DIR = path.join(process.cwd(), '.health')
await fs.mkdir(DIR, { recursive: true })

const previousFiles = (await fs.readdir(DIR)).filter((f) => f.endsWith('.json')).sort()
const previous: Snapshot | null = previousFiles.length
  ? (JSON.parse(await fs.readFile(path.join(DIR, previousFiles[previousFiles.length - 1]), 'utf-8')) as Snapshot)
  : null

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
await fs.writeFile(path.join(DIR, `${stamp}.json`), JSON.stringify(snapshot, null, 2), 'utf-8')

/* ─────────── изход ─────────── */

const pad = (s: string, n: number) => s.padEnd(n)

console.log('')
console.log('КОЛЕКЦИИ')
for (const [k, v] of Object.entries(колекции)) {
  const pub = v.публикувани !== undefined ? `  (публикувани: ${v.публикувани})` : ''
  console.log(`  ${pad(k, 16)} ${String(v.общо).padStart(5)}${pub}`)
}

console.log('')
console.log('ВРЪЗКИ')
for (const [k, v] of Object.entries(връзки)) {
  console.log(`  ${pad(k, 40)} ${String(v).padStart(5)}`)
}

if (Object.keys(начална).length) {
  console.log('')
  console.log('НАЧАЛНА СТРАНИЦА')
  for (const [k, v] of Object.entries(начална)) {
    console.log(`  ${pad(k, 40)} ${String(v).padStart(5)}`)
  }
}

console.log('')
console.log('ПРОБЛЕМИ')
for (const [k, v] of Object.entries(проблеми)) {
  console.log(`  ${pad(k, 40)} ${String(v).padStart(5)}`)
}

if (previous) {
  const diffs: string[] = []

  const compare = (label: string, before: Record<string, number>, after: Record<string, number>) => {
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
      const a = before[key] ?? 0
      const b = after[key] ?? 0
      if (a === b) continue
      const delta = b - a
      const mark = delta < 0 ? '⚠' : ' '
      diffs.push(`${mark} ${label}${key}: ${a} → ${b}   (${delta > 0 ? '+' : ''}${delta})`)
    }
  }

  compare('', previous.връзки, връзки)
  compare('', previous.начална, начална)
  compare('', previous.проблеми, проблеми)

  const beforeCols: Record<string, number> = {}
  const afterCols: Record<string, number> = {}
  for (const [k, v] of Object.entries(previous.колекции)) beforeCols[k] = v.общо
  for (const [k, v] of Object.entries(колекции)) afterCols[k] = v.общо
  compare('', beforeCols, afterCols)

  console.log('')
  console.log(`СРАВНЕНИЕ с ${previousFiles[previousFiles.length - 1]}`)
  if (!diffs.length) {
    console.log('  без промени')
  } else {
    for (const d of diffs) console.log(`  ${d}`)
    if (diffs.some((d) => d.startsWith('⚠'))) {
      console.log('')
      console.log('  Знакът ⚠ е намаление. При таблиците с връзки това означава изядени редове.')
    }
  }
}

console.log('')
process.exit(0)
