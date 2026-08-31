/**
 * Прилага подготвеното възстановяване от архив.
 *
 * Файлът се зарежда САМО в Node средата, от `src/instrumentation.ts`.
 * Затова тук може да се ползват `fs` и `path` с обикновени импорти —
 * ако стояха в самия instrumentation файл, Next щеше да ги компилира и за
 * Edge runtime, където ги няма, и всяка заявка щеше да предизвиква
 * неуспешна компилация.
 *
 * Замяната става тук, а не при натискането на бутона в админа, защото
 * работещият процес държи `ecoflow.db` отворен.
 */
import fs from 'fs/promises'
import path from 'path'

const ROOT = process.cwd()
const STAGING = path.join(ROOT, '.restore-staging')
const MARKER = path.join(STAGING, 'restore.json')

const exists = async (p: string) => {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

const applyRestore = async () => {
  if (!(await exists(MARKER))) return

  try {
    const info = JSON.parse(await fs.readFile(MARKER, 'utf-8')) as {
      архив?: string
      съдържа_снимки?: boolean
    }

    console.log(`\n[възстановяване] Прилага се архив: ${info.архив ?? 'без име'}`)

    const stagedDb = path.join(STAGING, 'ecoflow.db')
    const liveDb = path.join(ROOT, 'ecoflow.db')

    if (!(await exists(stagedDb))) {
      throw new Error('липсва ecoflow.db в подготвената папка')
    }

    // Страничните файлове на SQLite трябва да изчезнат заедно с базата,
    // иначе старият журнал се долепя към новия файл и базата излиза счупена.
    for (const suffix of ['', '-journal', '-wal', '-shm']) {
      await fs.rm(`${liveDb}${suffix}`, { force: true })
    }
    await fs.copyFile(stagedDb, liveDb)
    console.log('[възстановяване] базата е заменена')

    if (info.съдържа_снимки) {
      const stagedMedia = path.join(STAGING, 'media')
      const liveMedia = path.join(ROOT, 'media')
      if (await exists(stagedMedia)) {
        await fs.rm(liveMedia, { recursive: true, force: true })
        await fs.cp(stagedMedia, liveMedia, { recursive: true })
        console.log('[възстановяване] снимките са заменени')
      }
    }

    await fs.rm(STAGING, { recursive: true, force: true })
    console.log('[възстановяване] готово\n')
  } catch (err) {
    // Маркерът остава нарочно, за да се види проблемът и да се пробва пак.
    console.error(
      `\n[възстановяване] ПРОВАЛИ СЕ: ${(err as Error).message}\n` +
        `Папката .restore-staging е запазена. Базата НЕ е променена.\n`,
    )
  }
}

await applyRestore()
