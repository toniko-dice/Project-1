import * as archiverNS from 'archiver'
import { createWriteStream } from 'fs'
import fs from 'fs/promises'
import path from 'path'
import type { Payload } from 'payload'

/*
  archiver е CommonJS пакет. В ESM режим TypeScript не вижда default експорт,
  затова се взима през namespace импорта.
*/
type ArchiverFactory = (
  format: string,
  options?: archiverNS.ArchiverOptions,
) => archiverNS.Archiver

export const createArchiver = ((archiverNS as unknown as { default?: ArchiverFactory }).default ??
  (archiverNS as unknown as ArchiverFactory)) as ArchiverFactory

/**
 * Колко архива се пазят — по вид, отделно. Обикновените (ръчни, по
 * график, качени) — последните 5; „преди миграция" — последните 3.
 * Защитените (ръчно сложена отметка) не се броят и не се трият никога.
 */
export const KEEP_LAST = 5
export const KEEP_PRE_MIGRATION = 3
export const PRE_MIGRATION = 'преди миграция'

const ROOT = process.cwd()
export const DB_FILE = path.join(ROOT, 'ecoflow.db')
export const MEDIA_DIR = path.join(ROOT, 'media')
/** Където Payload пази готовите архиви (хранилището на колекцията). */
export const STORE_DIR = path.join(ROOT, 'backups')
/** Временна папка, в която архивът се сглобява преди да бъде записан. */
export const BUILD_DIR = path.join(ROOT, '.backup-tmp')
export const STAGING_DIR = path.join(ROOT, '.restore-staging')

const exists = async (p: string) => {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

/**
 * Прави консистентна снимка на базата.
 *
 * Обикновено копиране на файла не става — SQLite може да пише точно в този
 * момент и архивът излиза повреден. `VACUUM INTO` записва цялостно копие,
 * без да спира сървъра.
 */
const snapshotDatabase = async (payload: Payload, target: string): Promise<void> => {
  await fs.rm(target, { force: true })

  // Пътят влиза в SQL низ, затова единичните кавички се екранират.
  const escaped = target.replace(/'/g, "''")

  const db = payload.db as unknown as {
    execute?: (args: { drizzle?: unknown; raw: string }) => unknown
    drizzle?: unknown
  }

  if (typeof db.execute !== 'function') {
    throw new Error('Не може да се направи снимка на базата — липсва достъп до SQLite клиента.')
  }

  await db.execute({ drizzle: db.drizzle, raw: `VACUUM INTO '${escaped}'` })
}

const dirSize = async (dir: string): Promise<{ bytes: number; files: number }> => {
  let bytes = 0
  let files = 0
  const walk = async (d: string) => {
    const entries = await fs.readdir(d, { withFileTypes: true })
    for (const e of entries) {
      const full = path.join(d, e.name)
      if (e.isDirectory()) await walk(full)
      else {
        const st = await fs.stat(full)
        bytes += st.size
        files += 1
      }
    }
  }
  if (await exists(dir)) await walk(dir)
  return { bytes, files }
}

export type BackupResult = {
  filePath: string
  filename: string
  sizeBytes: number
  mediaFiles: number
}

/**
 * Създава zip с базата и (по избор) папката със снимките.
 * Връща пътя до готовия файл — извикващият го записва като документ.
 */
export const buildArchive = async (
  payload: Payload,
  opts: { includeMedia: boolean; label?: string },
): Promise<BackupResult> => {
  await fs.mkdir(BUILD_DIR, { recursive: true })

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filename = `arhiv-${stamp}.zip`
  const filePath = path.join(BUILD_DIR, filename)
  const tmpDb = path.join(BUILD_DIR, `.snapshot-${stamp}.db`)

  await snapshotDatabase(payload, tmpDb)

  const media = opts.includeMedia ? await dirSize(MEDIA_DIR) : { bytes: 0, files: 0 }

  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(filePath)
    const archive = createArchiver('zip', { zlib: { level: 6 } })

    output.on('close', () => resolve())
    output.on('error', reject)
    archive.on('error', reject)
    // Липсващ файл в media/ не бива да проваля целия архив.
    archive.on('warning', (err: { code?: string; message: string }) => {
      if (err.code === 'ENOENT') payload.logger.warn(`Архив: пропуснат файл — ${err.message}`)
      else reject(err)
    })

    archive.pipe(output)
    archive.file(tmpDb, { name: 'ecoflow.db' })
    if (opts.includeMedia) archive.directory(MEDIA_DIR, 'media')
    // Бележка вътре в архива, за да се разбира какво съдържа без да се отваря.
    archive.append(
      JSON.stringify(
        {
          създаден: new Date().toISOString(),
          име: opts.label ?? '',
          съдържа: opts.includeMedia ? ['база', 'снимки'] : ['база'],
          файлове_в_media: media.files,
        },
        null,
        2,
      ),
      { name: 'arhiv.json' },
    )
    void archive.finalize()
  })

  await fs.rm(tmpDb, { force: true })
  const st = await fs.stat(filePath)

  return { filePath, filename, sizeBytes: st.size, mediaFiles: media.files }
}

/**
 * Подготвя възстановяване.
 *
 * Файлът на базата се държи отворен от работещия процес — на Windows
 * презаписването му директно се проваля. Затова разархивираме настрани и
 * оставяме маркер; същинската замяна става при следващото пускане на сървъра
 * (виж `src/instrumentation.ts`).
 */
export const stageRestore = async (
  archivePath: string,
  meta: { id: number | string; label: string },
): Promise<void> => {
  const extract = (await import('extract-zip')).default

  await fs.rm(STAGING_DIR, { recursive: true, force: true })
  await fs.mkdir(STAGING_DIR, { recursive: true })

  await extract(archivePath, { dir: STAGING_DIR })

  const stagedDb = path.join(STAGING_DIR, 'ecoflow.db')
  if (!(await exists(stagedDb))) {
    await fs.rm(STAGING_DIR, { recursive: true, force: true })
    throw new Error('Архивът не съдържа файл на базата — възстановяването е отменено.')
  }

  await fs.writeFile(
    path.join(STAGING_DIR, 'restore.json'),
    JSON.stringify(
      {
        подготвен: new Date().toISOString(),
        архив: meta.label,
        id: meta.id,
        съдържа_снимки: await exists(path.join(STAGING_DIR, 'media')),
      },
      null,
      2,
    ),
    'utf-8',
  )
}

/**
 * Еднократно (и безвредно при всяко пускане): архивите преди миграция от
 * времето, когато се отбелязваха „защитени" сами (до 7 октомври 2026),
 * стават обикновени „преди миграция" — иначе никога не се трият. Познават
 * се по името, което им даваше `pre-migrate.ts`; ръчно защитените
 * (собственикът) имат друго име и не се пипат.
 */
const unprotectOldPreMigration = async (payload: Payload) => {
  const old = await payload.find({
    collection: 'backups',
    where: {
      and: [
        { label: { like: 'Автоматично преди миграция' } },
        { or: [{ protected: { equals: true } }, { trigger: { not_equals: PRE_MIGRATION } }] },
      ],
    },
    depth: 0,
    pagination: false,
  })
  for (const doc of old.docs) {
    await payload.update({ collection: 'backups', id: doc.id, depth: 0, data: { protected: false, trigger: PRE_MIGRATION } as never })
  }
  return old.docs.length
}

/**
 * Трие най-старите незащитени архиви: остават последните `KEEP_LAST`
 * обикновени и последните `KEEP_PRE_MIGRATION` „преди миграция".
 *
 * Трие се през `payload.delete` — така се маха и файлът от `backups/`.
 * Запис, чийто файл вече го няма, се трие пак, с ред в лога.
 */
export const pruneOldBackups = async (payload: Payload): Promise<number> => {
  const unprotected = await unprotectOldPreMigration(payload)
  if (unprotected) payload.logger.info(`Архиви: ${unprotected} стари „преди миграция" вече не са защитени`)

  const all = await payload.find({
    collection: 'backups',
    where: { protected: { not_equals: true } },
    sort: '-createdAt',
    depth: 0,
    pagination: false,
  })
  const pre = all.docs.filter((d) => d.trigger === PRE_MIGRATION)
  const other = all.docs.filter((d) => d.trigger !== PRE_MIGRATION)
  const extra = [...other.slice(KEEP_LAST), ...pre.slice(KEEP_PRE_MIGRATION)]

  for (const doc of extra) {
    if (doc.filename) {
      const exists = await fs.access(path.join(STORE_DIR, doc.filename)).then(() => true, () => false)
      if (!exists) payload.logger.warn(`Архив № ${doc.id} („${doc.label}"): файлът ${doc.filename} липсва — записът се трие`)
    }
    try {
      await payload.delete({ collection: 'backups', id: doc.id })
    } catch (e) {
      payload.logger.warn(`Архив № ${doc.id}: ${(e as Error).message} — записът се трие без файла`)
      await payload.db.deleteOne({ collection: 'backups', where: { id: { equals: doc.id } } })
    }
  }
  return extra.length
}

/** Създава архив и го записва като документ в колекция „Архиви". */
export const createBackup = async (
  payload: Payload,
  opts: {
    includeMedia?: boolean
    label?: string
    trigger?: 'ръчно' | 'по график' | typeof PRE_MIGRATION
    protected?: boolean
  } = {},
) => {
  const includeMedia = opts.includeMedia ?? true
  const label =
    opts.label?.trim() ||
    `Архив ${new Date().toLocaleString('bg-BG', { dateStyle: 'short', timeStyle: 'short' })}`

  const result = await buildArchive(payload, { includeMedia, label })

  const doc = await payload.create({
    collection: 'backups',
    data: {
      label,
      includesMedia: includeMedia,
      mediaFiles: result.mediaFiles,
      trigger: opts.trigger ?? 'ръчно',
      protected: opts.protected ?? false,
    },
    filePath: result.filePath,
  })

  // Файлът вече е копиран в хранилището на колекцията — оригиналът не трябва.
  await fs.rm(result.filePath, { force: true })

  const removed = await pruneOldBackups(payload)

  return { doc, removed }
}
