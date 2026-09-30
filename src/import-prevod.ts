/**
 * Папката „за превод" — снимките с английски надписи, които чакат превод.
 *
 * Вносът сваля оригиналите в `content/_originali/`: стотици снимки на
 * всички продукти, с текст и без. Собственикът не бива да търси из тях
 * кои са за превод. Затова след всеки внос тук се подреждат само
 * чакащите, заедно със списък какво пише на всяка и как се превежда.
 *
 * Работният ред: отваря `content/za-prevod/`, превежда по `spisak.md`,
 * записва готовия файл в `content/snimki/` под същото име, пуска
 * `import:all` → снимката се подменя в Медия и изчезва оттук.
 *
 * Източникът е `sadarzhanie.json` → `_prevod_nadpisi`: ключът е името на
 * снимката, стойността — надписите. Среща се в три вида и трите се
 * приемат: речник „оригинал → превод", списък от редове „оригинал →
 * превод" и свободен текст. Ключ с `_` отпред е бележка, не снимка;
 * `_prevod_nadpisi`, който изобщо не е речник („виж prevod-nadpisi.md"),
 * е указание за хора и се прескача.
 *
 * Папката се пресмята НАНОВО от всички продукти при всеки внос, не само
 * от внесените. Иначе `import:product` на един продукт би изтрил от
 * `spisak.md` чакащите на всички останали.
 */
import fs from 'fs/promises'
import path from 'path'

import {
  CONTENT_ROOT,
  ORIGINALI_DIR,
  SNIMKI_DIR,
  bareStem,
  caseSafeStem,
  exists,
  productFolders,
} from './import-product-core'

export const ZA_PREVOD_DIR = path.join(CONTENT_ROOT, 'za-prevod')
const SPISAK = 'spisak.md'

type Надписи = { folder: string; title: string; file: string; lines: string[] }

export type TranslationQueueResult = {
  /** Снимките в `za-prevod/` след пускането — чакащите превод. */
  pending: number
  copied: number
  removed: number
  /** Ключове, за които няма оригинал на диска — снимката още не е свалена. */
  notFound: string[]
  /** Файлове в `za-prevod/`, различни от оригинала — не са пипнати. */
  changed: string[]
  /** Снимки, на които всички надписи остават както са — няма какво да се превежда. */
  nothingToTranslate: string[]
  /** Преведени в `content/snimki/`, но вносът още не ги е качил в Медия. */
  notApplied: string[]
}

/** Карта на папка по пълно име и по основа — като при вноса. */
const прочети = async (dir: string) => {
  const поИме = new Map<string, string>()
  const поОснова = new Map<string, string>()
  try {
    for (const name of await fs.readdir(dir)) {
      if (!path.extname(name)) continue
      const пълен = path.join(dir, name)
      if (!поИме.has(name)) поИме.set(name, пълен)
      const stem = bareStem(name)
      if (!поОснова.has(stem)) поОснова.set(stem, пълен)
    }
  } catch {
    // Папката още не съществува.
  }
  return {
    намери: (file: string) => поИме.get(file) ?? поОснова.get(bareStem(file)) ?? null,
  }
}

/** Всички подпапки на продукта — имената им не са зашити (виж вноса). */
const папкиНаПродукта = async (folder: string) => {
  const root = path.join(CONTENT_ROOT, folder)
  const dirs = (await fs.readdir(root, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => path.join(root, e.name))
  const карти = await Promise.all(dirs.map(прочети))
  return {
    намери: (file: string) => {
      for (const к of карти) {
        const p = к.намери(file)
        if (p) return p
      }
      return null
    },
  }
}

/** Трите вида стойности → редове за списъка. */
const редове = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String)
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).map(([en, bg]) => `${en} → ${bg}`)
  }
  if (typeof value === 'string' && value.trim()) return [value]
  return []
}

/*
  „IP68 → остава", „25% → остава": снимката има надпис, но той не се
  превежда. Ако всички редове са такива, в папката няма какво да се
  прави — иначе собственикът трябва да копира файла непроменен в
  `content/snimki/`, само за да изчезне оттук.
*/
const остава = (line: string) => /→\s*остава(т)?\s*$/.test(line.trim())

/**
 * Файловете в `media/` по основа на името — за да се види дали преводът е
 * ВЕЧЕ в Медия. Размерите (`…-1200x1200.webp`) имат друга основа и не пречат.
 */
const медияПоОснова = async (): Promise<Map<string, string[]>> => {
  const map = new Map<string, string[]>()
  const dir = path.resolve(process.cwd(), 'media')
  try {
    for (const name of await fs.readdir(dir)) {
      const stem = bareStem(name)
      map.set(stem, [...(map.get(stem) ?? []), path.join(dir, name)])
    }
  } catch {
    // Няма Медия — нищо не е качено.
  }
  return map
}

const еднакви = async (a: string, b: string): Promise<boolean> => {
  const [x, y] = await Promise.all([fs.readFile(a), fs.readFile(b)])
  return x.equals(y)
}

export const updateTranslationQueue = async ({
  dryRun = false,
}: { dryRun?: boolean } = {}): Promise<TranslationQueueResult> => {
  const преведени = await прочети(SNIMKI_DIR)
  const оригинали = await прочети(ORIGINALI_DIR)

  /* ─── какво чака превод ─── */

  // По име на файла: общите снимки на едно семейство се превеждат веднъж.
  const чакащи = new Map<string, Надписи & { source: string; also: string[] }>()
  const notFound: string[] = []
  const nothingToTranslate: string[] = []
  const notApplied: string[] = []
  const вМедия = await медияПоОснова()

  /*
    Преводът се брои САМО ако вносът го е ползвал — тоест файлът в Медия е
    същият байт по байт. Иначе превод, който вносът е подминал (друго
    разширение, спрян продукт), изчезваше оттук като готов, а на сайта
    стоеше английската снимка — 44 такива на 29 септември 2026.
  */
  const качен = async (превод: string): Promise<boolean> => {
    // И под наставката за регистъра — виж `caseSafeStem`.
    const основа = bareStem(превод)
    for (const файл of [
      ...(вМедия.get(основа) ?? []),
      ...(вМедия.get(caseSafeStem(основа)) ?? []),
    ]) {
      if (await еднакви(файл, превод)) return true
    }
    return false
  }

  for (const folder of await productFolders()) {
    let content: { produkt?: { title?: string }; _prevod_nadpisi?: unknown }
    try {
      content = JSON.parse(
        await fs.readFile(path.join(CONTENT_ROOT, folder, 'sadarzhanie.json'), 'utf-8'),
      )
    } catch {
      continue // Негоден JSON се докладва при самия внос.
    }

    const надписи = content._prevod_nadpisi
    if (!надписи || typeof надписи !== 'object' || Array.isArray(надписи)) continue

    const title = content.produkt?.title ?? folder
    const свояПапка = await папкиНаПродукта(folder)

    for (const [file, value] of Object.entries(надписи as Record<string, unknown>)) {
      if (file.startsWith('_')) continue

      /*
        Преведено е, ако преводът от `content/snimki/` вече е в Медия, ИЛИ
        файлът е в папката на продукта. Второто е за вече направените
        продукти: собственикът превеждаше направо в техните `sekcii/`
        (03_05_Garage.jpg на DELTA 3 Max е на български там). Затова
        източник за превод е САМО `_originali/` — сваленото, което никой
        още не е пипал.
      */
      if (свояПапка.намери(file)) continue
      const превод = преведени.намери(file)
      if (превод) {
        if (await качен(превод)) continue
        notApplied.push(`${folder}: ${path.basename(превод)}`)
      }

      const lines = редове(value)
      if (lines.length && lines.every(остава)) {
        nothingToTranslate.push(`${folder}: ${file}`)
        continue
      }

      const source = оригинали.намери(file)
      if (!source) {
        notFound.push(`${folder}: ${file}`)
        continue
      }

      const name = path.basename(source)
      const досега = чакащи.get(name)
      if (досега) {
        if (досега.folder !== folder) досега.also.push(folder)
        continue
      }
      чакащи.set(name, { folder, title, file: name, lines, source, also: [] })
    }
  }

  /* ─── папката ─── */

  let copied = 0
  let removed = 0
  const changed: string[] = []

  if (!dryRun) await fs.mkdir(ZA_PREVOD_DIR, { recursive: true })

  /*
    Файл в `za-prevod/`, който не чака, се трие — но САМО ако е същият като
    оригинала. Различен значи, че собственикът е превел направо тук и
    още не го е преместил в `content/snimki/`; триенето би изгубило
    работата му. Затова остава и се изписва.
  */
  const налични = (await exists(ZA_PREVOD_DIR)) ? await fs.readdir(ZA_PREVOD_DIR) : []
  for (const name of налични) {
    if (name === SPISAK || name === '.gitkeep') continue
    const тук = path.join(ZA_PREVOD_DIR, name)
    const оригинал = чакащи.get(name)?.source ?? оригинали.намери(name)

    if (чакащи.has(name)) {
      if (!(await еднакви(тук, оригинал!))) changed.push(name)
      continue
    }
    if (оригинал && path.basename(оригинал) === name && (await еднакви(тук, оригинал))) {
      if (!dryRun) await fs.rm(тук)
      removed += 1
    } else {
      changed.push(name)
    }
  }

  for (const [name, з] of чакащи) {
    if (налични.includes(name)) continue
    if (!dryRun) await fs.copyFile(з.source, path.join(ZA_PREVOD_DIR, name))
    copied += 1
  }

  /* ─── списъкът ─── */

  if (!dryRun) {
    await fs.writeFile(
      path.join(ZA_PREVOD_DIR, SPISAK),
      списък([...чакащи.values()], notFound, changed, nothingToTranslate, notApplied),
    )
  }

  return {
    pending: чакащи.size,
    copied,
    removed,
    notFound,
    changed,
    nothingToTranslate,
    notApplied,
  }
}

const списък = (
  чакащи: (Надписи & { also: string[] })[],
  notFound: string[],
  changed: string[],
  nothingToTranslate: string[],
  notApplied: string[],
): string => {
  const out: string[] = [
    '# Снимки за превод',
    '',
    'Файлът се пише наново при всеки внос — промени в него не се пазят.',
    '',
    'Работен ред: отворете снимката от тази папка, преведете надписите по',
    'списъка долу, запишете готовия файл в `content/snimki/` под СЪЩОТО име',
    'и пуснете `npm run import:all`. Снимката се подменя в Медия и изчезва',
    'оттук.',
    '',
    `Чакат превод: ${чакащи.length}`,
  ]

  // По продукт, в реда на папките; вътре — по име на файла.
  const поПродукт = new Map<string, typeof чакащи>()
  for (const з of чакащи) {
    поПродукт.set(з.folder, [...(поПродукт.get(з.folder) ?? []), з])
  }

  for (const [folder, файлове] of поПродукт) {
    out.push('', `## ${файлове[0]!.title} (\`${folder}\`)`)
    for (const з of файлове.sort((a, b) => a.file.localeCompare(b.file))) {
      out.push('', `### \`${з.file}\``)
      if (з.also.length) out.push('', `Ползва се и от: ${з.also.join(', ')}`)
      out.push('')
      out.push(...(з.lines.length ? з.lines.map((l) => `- ${l}`) : ['- (няма описани надписи)']))
    }
  }

  if (notApplied.length) {
    out.push(
      '',
      '## Преведени, но още не са в Медия',
      '',
      'Преводът е в `content/snimki/`, но вносът не го е качил — вижте',
      'предупрежденията в обобщението му. Затова оригиналът стои и тук.',
      '',
      ...notApplied.map((n) => `- ${n}`),
    )
  }

  if (changed.length) {
    out.push(
      '',
      '## В тази папка има променени файлове',
      '',
      'Различават се от оригинала — вероятно са преведени тук. Не са',
      'презаписани и не са изтрити. Преместете ги в `content/snimki/`.',
      '',
      ...changed.map((n) => `- \`${n}\``),
    )
  }

  if (notFound.length) {
    out.push(
      '',
      '## Няма оригинал на диска',
      '',
      'Описани са в `_prevod_nadpisi`, но файлът не е свален (или името в',
      'JSON-а не е име на файл). Ще се появят тук след внос, който ги свали.',
      '',
      ...notFound.map((n) => `- ${n}`),
    )
  }

  if (nothingToTranslate.length) {
    out.push(
      '',
      '## Без превод',
      '',
      'Всички надписи на тези снимки остават както са (проценти, IP68, ъгли) —',
      'не са копирани тук.',
      '',
      ...nothingToTranslate.map((n) => `- ${n}`),
    )
  }

  return out.join('\n') + '\n'
}

/** Редът, с който завършва обобщението на вноса. */
export const translationQueueSummary = (r: TranslationQueueResult, dryRun: boolean): string[] => {
  const lines = [
    dryRun
      ? `За превод: ${r.pending} снимки (биха били в content/za-prevod/; ${r.copied} нови, ${r.removed} за махане)`
      : `За превод: ${r.pending} снимки в content/za-prevod/`,
  ]
  if (r.notApplied.length) {
    lines.unshift(
      `  ⚠ ${r.notApplied.length} преведени в content/snimki/ още не са в Медия — остават за превод (списъкът е в content/za-prevod/spisak.md)`,
    )
  }
  if (r.changed.length) {
    lines.unshift(
      `  ⚠ в content/za-prevod/ има ${r.changed.length} променени файла (не са пипнати) — ако са преведени, преместете ги в content/snimki/: ${r.changed.join(', ')}`,
    )
  }
  return lines
}
