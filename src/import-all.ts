/**
 * Внасяне на ВСИЧКИ продукти наведнъж.
 *
 * Пуска се с:  npm run import:all
 *              npm run import:all -- --dry-run
 *              npm run import:all -- --only river-3-plus,river-3-ups
 *              npm run import:all -- --no-download
 *
 * Минава през всяка папка в `content/`, която съдържа `sadarzhanie.json`,
 * по азбучен ред, и вика същото ядро като `import:product`. Папките без
 * такъв файл (`referentsia/`) се прескачат — те са материал за четене.
 *
 * Три неща, които го правят годен за група:
 *
 * - **Една грешка не спира останалите.** Ядрото хвърля `ImportError`,
 *   тук се отбелязва и се минава нататък. Иначе единайсетият продукт
 *   остава невнесен заради сбъркана запетая в JSON-а на десетия, и то се
 *   разбира чак накрая.
 * - **Обобщението е таблица.** При дванайсет продукта изходът е стотици
 *   реда; кое какво е станало трябва да се вижда на едно място.
 * - **Кешът се опреснява ВЕДНЪЖ**, накрая, ако изобщо е публикувано нещо.
 *   Тагът е едър и изчиства всичко; по една заявка на продукт е същата
 *   работа, повторена дванайсет пъти.
 *
 * Флаговете минават след `--`, защото `payload run` гълта всичко след
 * името на файла (същото като при `npm run seed -- --force`).
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { createBackup } from './lib/backup'
import {
  ImportError,
  type ImportResult,
  checkDownloadNameConflicts,
  importProduct,
  productFolders,
  revalidateServer,
} from './import-product-core'

/* ─────────── аргументи ─────────── */

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const noDownload = args.includes('--no-download')

const onlyArg = args.find((a) => a.startsWith('--only'))
const onlyValue = onlyArg?.includes('=')
  ? onlyArg.split('=')[1]
  : onlyArg
    ? args[args.indexOf(onlyArg) + 1]
    : undefined

const only = (onlyValue ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

/* ─────────── кои папки ─────────── */

const всички = await productFolders()

if (!всички.length) {
  console.error('\n✗ В content/ няма нито една папка със sadarzhanie.json.\n')
  process.exit(1)
}

const непознати = only.filter((s) => !всички.includes(s))
if (непознати.length) {
  console.error(`\n✗ Няма папка content/${непознати.join(', content/')}`)
  console.error(`  Налични: ${всички.join(', ')}\n`)
  process.exit(1)
}

const папки = only.length ? всички.filter((f) => only.includes(f)) : всички

console.log('')
console.log(
  dryRun
    ? `ПРОВЕРКА (--dry-run) на ${папки.length} папки — нищо няма да се записва.`
    : `Внос на ${папки.length} продукта.`,
)
console.log('')

/* ─────────── проверки преди вноса ─────────── */

const payload = await getPayload({ config })

/*
  Едно име, два различни адреса — спира се тук, преди да е пипнато нещо.
  Общата папка `content/snimki/` е плоска и двете снимки биха се
  припокрили мълчаливо.
*/
try {
  await checkDownloadNameConflicts(всички)
} catch (err) {
  console.error(`\n✗ ${(err as Error).message}\n`)
  process.exit(1)
}

/*
  Архив преди всяко истинско пускане.

  Вносът пипа много продукти наведнъж и може да подмени снимка в Медия.
  Архивът е начинът да се върне всичко, ако се окаже, че подмяната не е
  била желана — затова се прави ПРЕДИ, не след, и името му се изписва.
*/
if (!dryRun) {
  try {
    const { doc } = await createBackup(payload, {
      label: `Преди внос на ${папки.length} продукта`,
      trigger: 'ръчно',
    })
    console.log(`Архив преди вноса: „${doc.label}" (№ ${doc.id})`)
    console.log('')
  } catch (e) {
    console.error(`\n✗ Архивът не се направи: ${(e as Error).message}`)
    console.error('  Вносът е спрян — без архив няма връщане назад.\n')
    process.exit(1)
  }
}

type Ред = {
  folder: string
  резултат?: ImportResult
  грешка?: string
}

const редове: Ред[] = []

for (const [i, folder] of папки.entries()) {
  console.log(`[${i + 1}/${папки.length}] ${folder}`)
  try {
    const резултат = await importProduct(payload, folder, {
      dryRun,
      noDownload,
      // Отместено навътре, за да личи кой ред на кой продукт е.
      log: (m) => console.log(`    ${m}`),
    })
    редове.push({ folder, резултат })
    console.log(`    → ${резултат.action}`)
  } catch (err) {
    /*
      Спънка при един продукт не бива да отменя останалите единайсет.
      Отбелязва се и се продължава; таблицата накрая я показва.
    */
    const текст = err instanceof ImportError ? err.message : ((err as Error)?.message ?? String(err))
    редове.push({ folder, грешка: текст.split('\n')[0] })
    console.log(`    ✗ ${текст.split('\n')[0]}`)
  }
  console.log('')
}

/* ─────────── обобщение ─────────── */

const колона = (текст: string, ширина: number) =>
  текст.length > ширина ? текст.slice(0, ширина - 1) + '…' : текст.padEnd(ширина)

const ш1 = Math.max(6, ...редове.map((r) => r.folder.length))
const ш2 = Math.max(
  9,
  ...редове.map((r) => (r.резултат ? r.резултат.action.length : (r.грешка?.length ?? 0) + 8)),
)

console.log('─'.repeat(ш1 + ш2 + 20))
console.log(`${колона('ПРОДУКТ', ш1)}  ${колона('РЕЗУЛТАТ', ш2)}  ЛИПСВАЩИ ФАЙЛОВЕ`)
console.log('─'.repeat(ш1 + ш2 + 20))

for (const ред of редове) {
  const резултат = ред.резултат ? ред.резултат.action : `ГРЕШКА: ${ред.грешка}`
  const липсващи = ред.резултат?.missingFiles ?? []
  console.log(
    `${колона(ред.folder, ш1)}  ${колона(резултат, ш2)}  ${
      липсващи.length ? `${липсващи.length} — ${липсващи.join(', ')}` : '—'
    }`,
  )
}
console.log('─'.repeat(ш1 + ш2 + 20))

const успешни = редове.filter((r) => r.резултат)
const публикувани = успешни.filter((r) => r.резултат!.action === 'обновен и публикуван').length
const чернови = успешни.filter((r) => r.резултат!.action !== 'обновен и публикуван').length
const грешки = редове.length - успешни.length
const свалени = успешни.reduce((n, r) => n + r.резултат!.downloaded, 0)
const несвалени = успешни.reduce((n, r) => n + r.резултат!.failedDownloads.length, 0)
const качени = успешни.reduce((n, r) => n + r.резултат!.uploadedNew, 0)
const преизползвани = успешни.reduce((n, r) => n + r.резултат!.reusedExisting, 0)
const липсващи = успешни.reduce((n, r) => n + r.резултат!.missingFiles.length, 0)
const поФайлБрой = new Set(успешни.flatMap((r) => r.резултат!.replacements.map((з) => з.file))).size

/* ─────────── подмени в Медия ─────────── */

/*
  Подмяната пипа снимка, която може да се ползва от други продукти —
  затова се изписва поименно: кой файл, кой запис, откъде е новият и кои
  продукти го ползват. Никога само число в обобщението.
*/
const подмени = успешни.flatMap((r) =>
  r.резултат!.replacements.map((з) => ({ ...з, folder: r.folder })),
)

if (подмени.length) {
  const поФайл = new Map<string, { mediaId: number; source: string; folders: string[] }>()
  for (const з of подмени) {
    const досега = поФайл.get(з.file)
    if (досега) досега.folders.push(з.folder)
    else поФайл.set(з.file, { mediaId: з.mediaId, source: з.source, folders: [з.folder] })
  }

  console.log('')
  console.log(dryRun ? 'ЩЕ СЕ ПОДМЕНЯТ В МЕДИЯ:' : 'ПОДМЕНЕНИ В МЕДИЯ:')
  for (const [file, д] of поФайл) {
    console.log(`  ${file}  (запис № ${д.mediaId}, новият идва от „${д.source}")`)
    console.log(`    ползват го: ${д.folders.join(', ')}`)
  }
}

console.log('')
console.log(`Публикувани: ${публикувани} · чернови: ${чернови} · грешки: ${грешки}`)
console.log(
  dryRun
    ? `Снимки: ${свалени} биха се свалили, ${качени} биха се качили, ${преизползвани} вече са в Медия · липсващи файлове: ${липсващи}`
    : `Снимки: ${свалени} свалени, ${качени} качени, ${преизползвани} преизползвани · липсващи файлове: ${липсващи}`,
)
if (несвалени) console.log(`  ⚠ не се свалиха ${несвалени} файла — виж редовете по-горе`)
console.log(`Подменени записи в Медия: ${поФайлБрой}`)

for (const ред of успешни) {
  if (ред.резултат!.publishError) {
    console.log(`  ✗ ${ред.folder}: ${ред.резултат!.publishError.split('\n')[0]}`)
  }
}

console.log('')
if (dryRun) {
  console.log('Нищо не е записано. Пуснете без --dry-run, за да се извърши вносът.')
} else if (публикувани) {
  console.log(await revalidateServer())
} else {
  console.log('Нищо не е публикувано — черновите чакат преглед в админа.')
}
console.log('')

process.exit(грешки ? 1 : 0)
