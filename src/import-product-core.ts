/**
 * Внасянето на ЕДИН продукт — общото ядро.
 *
 * Тук е цялата логика; двата скрипта отгоре само я викат:
 *
 *   `src/import-product.ts`  →  npm run import:product <slug>
 *   `src/import-all.ts`      →  npm run import:all
 *
 * Изнесено е, за да няма две реализации. Различие между „по един" и
 * „всички наведнъж" значи, че вторият внася по друг начин от първия — а
 * разликата ще се забележи чак когато вече е в базата.
 *
 * Две разлики спрямо стария скрипт, и двете заради груповия внос:
 *
 * - **Не вика `process.exit`.** Спънка при един продукт хвърля
 *   `ImportError`; който вика, решава дали да спре, или да продължи с
 *   останалите.
 * - **Не опреснява кеша сам.** Връща какво е направил; опресняването е
 *   една заявка за целия внос, не по една на продукт (`revalidateServer`).
 *
 * Очакваната подредба на папката:
 *
 *   content/<slug>/
 *     sadarzhanie.json   ← текстове, блокове, съответствие със снимките
 *     galeryia/          ← снимки за галерията
 *     sekcii/            ← снимки за секциите
 *
 * Имената на папките със снимки нямат значение — претърсват се всички
 * подпапки. Значение има само името на файла в sadarzhanie.json.
 *
 * Скриптът е ПОВТОРЯЕМ. Второ пускане обновява продукта и преизползва вече
 * качените снимки — не трупа дубликати.
 */
import { createHash } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import type { Payload } from 'payload'
import sharp from 'sharp'
import { AVAILABILITY_VALUES, isAvailability } from './lib/availability'
import { RESERVED_PRODUCT_SLUGS } from './lib/urls'

/* ─────────── видове ─────────── */

/** Спънка, описана с човешки текст. Който вика, решава какво да прави. */
export class ImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImportError'
  }
}

export type ImportAction =
  | 'създаден и публикуван'
  | 'създаден като чернова'
  | 'създаден като чернова — публикуването не мина проверките'
  | 'обновен и публикуван'
  | 'обновен (остава чернова)'
  | 'обновен, но само като чернова — публикуването не мина проверките'

/** Действия, след които продуктът е на сайта. */
export const isPublishedAction = (action: ImportAction): boolean =>
  action === 'създаден и публикуван' || action === 'обновен и публикуван'

/**
 * Как се чете действието при `--dry-run` — в бъдеще време, защото нищо
 * не е станало. Иначе проверката казва „създаден" за продукт, който не
 * съществува, и собственикът го търси в админа.
 */
export const actionLabel = (action: ImportAction, dryRun: boolean): string =>
  !dryRun
    ? action
    : (({
        'създаден и публикуван': 'ще създаде и публикува',
        'създаден като чернова': 'ще създаде като чернова',
        'обновен и публикуван': 'ще обнови и публикува',
        'обновен (остава чернова)': 'ще обнови (остава чернова)',
      }) as Partial<Record<ImportAction, string>>)[action] ?? action

export type ImportResult = {
  slug: string
  title: string
  action: ImportAction
  /** Продуктът е публикуван СЕГА — значи кешът на сървъра трябва да се изчисти. */
  published: boolean
  uploadedNew: number
  reusedExisting: number
  gallery: number
  specGroups: number
  sections: number
  linkedProducts: string[]
  unlinkedProducts: string[]
  /** Файлове, свалени в `content/_originali/` при това пускане. */
  downloaded: number
  /** Откъде е взет всеки файл — за `--dry-run` и за обобщението. */
  sources: [string, FileSource][]
  /** Записи в Медия, подменени с различно съдържание. Никога мълчаливо. */
  replacements: { file: string; mediaId: number; filename: string; source: FileSource }[]
  /** Адреси, които не се свалиха след трите опита. */
  failedDownloads: string[]
  missingFiles: string[]
  publishError: string | null
  /** Къде в менюто е добавен НОВИЯТ продукт — или защо никъде. Празно при обновяване. */
  menu: string[]
  /** Нищо не е записано — само проверка. */
  dryRun: boolean
}

export type ImportOptions = {
  /** Само проверява файловете и казва какво би направил. Нищо не се записва. */
  dryRun?: boolean
  /** Изключва свалянето: ползват се само файловете на диска и Медия. */
  noDownload?: boolean
  /** Новият продукт става чернова, а не публикуван — `--draft`. */
  draft?: boolean
  /** Къде отиват редовете за напредъка. Груповият внос ги отмества навътре. */
  log?: (message: string) => void
}

/* ─────────── помощни ─────────── */

export const exists = async (p: string): Promise<boolean> => {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

/**
 * Истинският вид на файла по първите му байтове.
 *
 * Снимките, свалени от CDN-а на EcoFlow (Shopify), често са WebP с
 * разширение .jpg или .png — сървърът подава WebP независимо от адреса.
 * Payload именува файла по съдържанието, не по разширението, затова
 * `09.png` се появява в Медия като `09.webp`. Това НЕ е преобразуване —
 * оригиналът се пази байт по байт. Скриптът го изписва, за да не се търси
 * несъществуващ бъг.
 */
const sniffFormat = async (filePath: string): Promise<string | null> => {
  const fh = await fs.open(filePath, 'r')
  try {
    const buf = Buffer.alloc(12)
    await fh.read(buf, 0, 12, 0)
    if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
      return 'png'
    if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpg'
    if (buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP')
      return 'webp'
    return null
  } finally {
    await fh.close()
  }
}

const MIME: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
}

/**
 * Името без разширение и БЕЗ точки в края.
 *
 * Няколко файла от dice.bg са с двойна точка: `…_twice_as_fast..jpg`.
 * `path.basename(f, '.jpg')` оставя точката — основата става
 * „…_twice_as_fast.". Payload обаче я премахва при записа и файлът в Медия
 * е „…_twice_as_fast.jpg". Сравнението по основа никога не съвпадаше и
 * вносът качваше СЪЩИЯ файл наново при всяко пускане: до 28 септември 2026
 * се бяха натрупали по седем копия на всеки от двата (`-1` … `-6`).
 *
 * Затова основата се подравнява с това, което Payload реално записва.
 */
export const bareStem = (file: string): string =>
  path.basename(file, path.extname(file)).replace(/\.+$/, '')

/**
 * Основата на снимка, чието име се различава от вече качена САМО по
 * регистъра: `3_1_img` до `3_1_IMG` става `3_1_img-5d1c0a`.
 *
 * Базата различава главни и малки букви, файловата система на Windows —
 * не. Payload проверява дали името е заето в базата, вижда „свободно" и
 * записва `3_1_img-400x400.webp` ВЪРХУ `3_1_IMG-400x400.webp` на друг
 * запис. На 30 септември 2026 Wave 3 (`3_1_img.png`) така подмени
 * снимките на RIVER 3 Plus/Max/Max Plus (`3_1_IMG.jpg`) — на страниците
 * на RIVER излязоха снимки на климатика, а записите в базата изглеждаха
 * цели.
 *
 * Наставката е от самата основа, не пореден номер: следващият внос я
 * пресмята наново и намира записа, без да пита кой е бил пръв.
 */
export const caseSafeStem = (stem: string): string =>
  `${stem}-${createHash('sha1').update(stem).digest('hex').slice(0, 6)}`

/** Основата на име от Медия (без `bareStem`: Payload вече е махнал точките). */
const mediaFileStem = (filename: string): string => path.basename(filename, path.extname(filename))

type MediaNames = { filename?: string | null; sizes?: unknown }

/** Всички файлове на запис — оригиналът и размерите. */
export const mediaFileNames = (doc: MediaNames): string[] =>
  [
    doc.filename,
    ...Object.values((doc.sizes ?? {}) as Record<string, { filename?: string | null } | null>).map(
      (s) => s?.filename,
    ),
  ].filter((f): f is string => Boolean(f))

/**
 * Записите, чиято основа съвпада със `stem`, без да се гледа регистърът.
 * `like` в SQLite не гледа регистъра на латиницата, а `_` в него е жокер —
 * затова съвпадението се потвърждава в JavaScript.
 */
export const sameStemIgnoringCase = async (payload: Payload, stem: string) => {
  const found = await payload.find({
    collection: 'media',
    where: { filename: { like: `${stem}.` } },
    limit: 50,
    depth: 0,
  })
  return found.docs.filter(
    (doc) => doc.filename && mediaFileStem(doc.filename).toLowerCase() === stem.toLowerCase(),
  )
}

/**
 * Прави размерите на снимка със Sharp под основата `stem` — както
 * `media:regenerate` — и връща картата за полето `sizes`. Размер, който не
 * може да се направи (по-тясна снимка), просто липсва.
 */
export const writeImageSizes = async (
  payload: Payload,
  stem: string,
  данни: Buffer,
): Promise<Record<string, unknown>> => {
  const MEDIA_DIR = path.resolve(process.cwd(), 'media')
  const размери: Record<string, unknown> = {}

  /*
    Същото правило като Payload при качване (`getImageResizeAction`) и
    `media:regenerate`: размер, по-голям от оригинала, НЕ се прави. До
    2 октомври 2026 тук го нямаше и всяка подмяна (превод, PNG с прозрачен
    фон) правеше `content`/`large` УВЕЛИЧЕНИ — 1000 px оригинал получаваше
    1600 и 2000 px копия; така бяха 59 записа.
  */
  const meta = await sharp(данни).metadata()
  const w = meta.width ?? 0
  const h = meta.height ?? 0

  for (const size of payload.collections.media!.config.upload.imageSizes ?? []) {
    const targetW = size.width ?? null
    const targetH = size.height ?? null
    const { withoutEnlargement } = size
    if (targetW && targetH && withoutEnlargement === undefined && w < targetW && h < targetH) continue
    if (withoutEnlargement === undefined && (!targetW || !targetH)) {
      if ((targetW && w < targetW) || (targetH && h < targetH)) continue
    }
    try {
      let pipeline = sharp(данни)
        .rotate()
        .resize({
          width: targetW ?? undefined,
          height: targetH ?? undefined,
          position: size.position,
          fit: size.fit,
          withoutEnlargement: size.withoutEnlargement,
        })
      const format = size.formatOptions?.format
      if (format) pipeline = pipeline.toFormat(format, size.formatOptions?.options)

      const { data, info } = await pipeline.toBuffer({ resolveWithObject: true })
      const име = `${stem}-${info.width}x${info.height}.${info.format}`
      await fs.writeFile(path.join(MEDIA_DIR, име), data)
      размери[size.name] = {
        filename: име,
        width: info.width,
        height: info.height,
        mimeType: `image/${info.format}`,
        filesize: data.length,
      }
    } catch {
      // Размер, който не може да се направи (по-тясна снимка), просто липсва.
    }
  }
  return размери
}

/**
 * Подменя съдържанието на ВЕЧЕ СЪЩЕСТВУВАЩ запис в Медия.
 *
 * Не минава през качването на Payload, а презаписва файла и прави
 * размерите със Sharp — точно както `media:regenerate`. Причината е
 * конкретна: `payload.update` с нов файл проверява дали името е заето и
 * при заето слага наставка. Заетото име е СОБСТВЕНОТО име на записа,
 * затова `PC_R3_01.jpg` ставаше `PC_R3_01-1.jpg`, после `-2`. Името
 * спираше да съвпада с това в `sadarzhanie.json`, следващият внос не
 * намираше записа по основа и качваше нов — подмяната се превръщаше в
 * дублиране. Проверено два пъти.
 *
 * Така номерът и всички връзки към записа остават същите, а
 * съдържанието е новото.
 *
 * Файлът се записва КАКТО Е — JPEG остава JPEG, без преобразуване.
 * Ако преводът е в друг формат от записания (оригиналите от EcoFlow са
 * WebP под име `.jpg` и в Медия стоят като `.webp`; преводът е истински
 * JPEG), се сменя разширението: `PC_02.webp` → `PC_02.jpg`, същият
 * запис, размерите се правят наново, а старите файлове се трият. Основата
 * на името е същата, тъй че следващият внос намира записа по нея.
 * Преди подмяната се отказваше и 14 преведени снимки не стигаха до сайта.
 */
export const replaceMediaContent = async (
  payload: Payload,
  log: (m: string) => void,
  doc: {
    id: number
    filename?: string | null
    sizes?: Record<string, { filename?: string | null } | null> | null
  },
  данни: Buffer,
  realExt: string,
  file: string,
  alt: string,
): Promise<boolean> => {
  const стар = doc.filename
  if (!стар) return false

  /*
    Основата остава; разширението следва съдържанието на новия файл.

    Освен ако друг запис има същата основа в друг регистър (`3_1_IMG`
    до `3_1_img`): на Windows файловете им са едни и същи, затова
    записът се мести под `caseSafeStem` — иначе подмяната пише върху
    чуждата снимка.
  */
  const stemНаЗаписа = mediaFileStem(стар)
  const другите = (await sameStemIgnoringCase(payload, stemНаЗаписа)).filter(
    (d) => d.id !== doc.id,
  )
  const stem = другите.length ? caseSafeStem(stemНаЗаписа) : stemНаЗаписа
  const filename = `${stem}${realExt}`
  /** Файловете на другите записи — не се трият, в какъвто и регистър да са. */
  const чужди = new Set(другите.flatMap(mediaFileNames).map((f) => f.toLowerCase()))

  if (filename !== стар) {
    // Новото име не бива да е на друг запис — иначе два записа биха делили файл.
    const зает = (await sameStemIgnoringCase(payload, stem)).find(
      (d) => d.id !== doc.id && d.filename?.toLowerCase() === filename.toLowerCase(),
    )
    if (зает) {
      log(
        `  ⚠ ${file}: преведената снимка е ${realExt.slice(1).toUpperCase()}, но името ` +
          `${filename} е заето от запис № ${зает.id} — не е подменена`,
      )
      return false
    }
    if (stem !== stemНаЗаписа) {
      log(
        `  · ${file}: името се различава само по регистъра от запис № ${другите[0]!.id} ` +
          `(${другите[0]!.filename}) — записът № ${doc.id} става ${filename}`,
      )
    } else {
      log(`  · ${file}: форматът се сменя — ${стар} → ${filename} (запис № ${doc.id})`)
    }
  }

  const MEDIA_DIR = path.resolve(process.cwd(), 'media')
  await fs.writeFile(path.join(MEDIA_DIR, filename), данни)

  const мета = await sharp(данни).metadata()
  const размери = await writeImageSizes(payload, stem, данни)

  /*
    Записва се САМО описанието. Файлът не се подава — иначе Payload би
    качил снимката наново и точно това искаме да избегнем.
  */
  await payload.update({
    collection: 'media',
    id: doc.id,
    data: {
      alt: alt || file,
      filename,
      mimeType: MIME[realExt],
      filesize: данни.length,
      width: мета.width,
      height: мета.height,
      sizes: размери,
    } as never,
    depth: 0,
  })

  /*
    Старите файлове се трият чак СЛЕД записа: ако той падне, записът още
    сочи тях и снимката на сайта не се чупи. Трие се само каквото вече
    не е на записа — оригинал с друго разширение и размери с други
    пропорции — и никога файл, чието име (без регистъра) е на друг запис.
  */
  const пазени = new Set<string>([
    filename,
    ...Object.values(размери).map((р) => (р as { filename: string }).filename),
  ])
  for (const f of mediaFileNames(doc)) {
    if (!пазени.has(f) && !чужди.has(f.toLowerCase())) {
      await fs.rm(path.join(MEDIA_DIR, f), { force: true })
    }
  }

  return true
}

/** Номерът, с който се пълнят полетата при проверка — нищо не се записва. */
const DRY_ID = -1

type Card = Record<string, unknown>

type Content = {
  produkt: Record<string, unknown>
  galeriya?: { file: string; alt?: string }[]
  sekcii?: Card[]
  specGroups?: unknown[]
  /** Адресите, от които се свалят снимките. Името е последният сегмент. */
  _svali_snimki?: { galeriya?: string[]; sekcii?: string[] }
}

/* ─────────── сваляне на снимките ─────────── */

/** Името на файла от адрес: последният сегмент, без въпросителната. */
const fileNameFromUrl = (url: string): string => {
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop() ?? '')
  } catch {
    return ''
  }
}

/**
 * Сваля един файл и го записва БАЙТ ПО БАЙТ.
 *
 * Без преобразуване: ако сървърът подаде WebP под име `.jpg` — така се
 * записва. Вносът разпознава вида по съдържанието (`sniffFormat`) и
 * именува файла в Медия според него.
 *
 * Три опита: CDN-овете отказват единични заявки по-често, отколкото са
 * наистина недостъпни. `User-Agent` на браузър, защото eu.ecoflow.com
 * връща 403 на заявка без него.
 */
const downloadFile = async (url: string, dest: string): Promise<void> => {
  let последна: Error | null = null

  for (let опит = 1; опит <= 3; опит += 1) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/png,image/jpeg,*/*',
        },
        signal: AbortSignal.timeout(30_000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const buf = Buffer.from(await res.arrayBuffer())
      if (!buf.length) throw new Error('празен отговор')

      await fs.mkdir(path.dirname(dest), { recursive: true })
      await fs.writeFile(dest, buf)
      return
    } catch (e) {
      последна = e instanceof Error ? e : new Error(String(e))
      // Кратка пауза между опитите — веднага повторената заявка пада пак.
      if (опит < 3) await new Promise((r) => setTimeout(r, опит * 500))
    }
  }

  throw последна ?? new Error('неуспешно сваляне')
}

/** Изпълнява задачите най-много по `наведнъж` едновременно. */
const поPartии = async (задачи: (() => Promise<void>)[], наведнъж = 4): Promise<void> => {
  let следваща = 0
  const работник = async () => {
    while (следваща < задачи.length) {
      const моя = следваща
      следваща += 1
      await задачи[моя]!()
    }
  }
  await Promise.all(Array.from({ length: Math.min(наведнъж, задачи.length) }, работник))
}

/** Имената на файловете, които продуктът изобщо ползва. */
const neededFiles = (content: Content): Set<string> => {
  const files = new Set<string>()

  for (const item of content.galeriya ?? []) {
    if (typeof item?.file === 'string') files.add(item.file)
  }

  const обходи = (node: unknown): void => {
    if (Array.isArray(node)) return node.forEach(обходи)
    if (!node || typeof node !== 'object') return
    for (const [key, value] of Object.entries(node as Card)) {
      if (key === 'image' || key === 'icon') {
        // Празно име е „без снимка" (секция само с текст), не липсващ файл.
        if (typeof value === 'string' && value.trim()) files.add(value)
      } else обходи(value)
    }
  }
  обходи(content.sekcii ?? [])

  return files
}

/* ─────────── папки със съдържание ─────────── */

export const CONTENT_ROOT = path.join(process.cwd(), 'content')

/* ─────────── двете общи папки ─────────── */

/**
 * Преведените снимки — плоско, под ОРИГИНАЛНОТО име на файла.
 *
 * Собственикът превежда надписите върху снимките и не иска да ги разнася
 * по стотици папки на продукти. Едно място за всички: файл оттук печели
 * пред всичко останало, включително пред вече качения в Медия.
 */
export const SNIMKI_DIR = path.join(CONTENT_ROOT, 'snimki')

/**
 * Свалените оригинали — също плоско.
 *
 * Кеш, за да не се тегли един и същи файл по два пъти: общите снимки на
 * RIVER 3 семейството се ползват от пет продукта. Не отиват в папката на
 * продукта, за да не се размива кое е свалено и кое е сложено на ръка.
 */
export const ORIGINALI_DIR = path.join(CONTENT_ROOT, '_originali')

/** Откъде е дошъл файлът — за обобщението и за `--dry-run`. */
export type FileSource = 'snimki' | 'папка' | 'оригинали' | 'Медия' | 'ще се свали' | 'ЛИПСВА'

/* ─────────── еднакви имена, различни адреси ─────────── */

/**
 * Проверява, че едно име на файл не сочи към два различни адреса.
 *
 * Имената идват от EcoFlow и dice и на практика са уникални, но общата
 * папка `content/snimki/` е плоска: две различни снимки с едно име биха
 * се припокрили и вторият продукт мълчаливо би показал снимката на
 * първия. Затова се проверява ПРЕДИ вноса и при сблъсък се спира.
 *
 * Еднакво име с еднакъв адрес е нормално — общите снимки на едно
 * семейство продукти дават един запис в Медия за всички.
 */
export const checkDownloadNameConflicts = async (folders: string[]): Promise<void> => {
  const адресПоИме = new Map<string, { url: string; folder: string }>()
  const сблъсъци: string[] = []

  for (const folder of folders) {
    let content: Content
    try {
      content = JSON.parse(
        await fs.readFile(path.join(CONTENT_ROOT, folder, 'sadarzhanie.json'), 'utf-8'),
      ) as Content
    } catch {
      continue // Негоден JSON се докладва при самия внос на този продукт.
    }

    for (const списък of [content._svali_snimki?.galeriya, content._svali_snimki?.sekcii]) {
      for (const url of списък ?? []) {
        if (typeof url !== 'string') continue
        const name = fileNameFromUrl(url)
        if (!name) continue

        const преди = адресПоИме.get(name)
        if (!преди) {
          адресПоИме.set(name, { url, folder })
        } else if (преди.url !== url) {
          сблъсъци.push(
            `  ${name}
    ${преди.folder}: ${преди.url}
    ${folder}: ${url}`,
          )
        }
      }
    }
  }

  if (сблъсъци.length) {
    throw new ImportError(
      'Едно и също име на файл сочи към различни адреси. Общата папка ' +
        '`content/snimki/` е плоска, тоест двете снимки биха се припокрили.\n' +
        'Преименувайте файла в sadarzhanie.json на единия продукт:\n' +
        сблъсъци.join('\n'),
    )
  }
}

/**
 * Папките в `content/`, които изобщо описват продукт.
 *
 * Мярката е наличието на `sadarzhanie.json`. `referentsia/` и подобните
 * са материал за четене от хора — прескачат се, без да се смятат за
 * грешка.
 */
export const productFolders = async (): Promise<string[]> => {
  const entries = await fs.readdir(CONTENT_ROOT, { withFileTypes: true })
  const folders: string[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (await exists(path.join(CONTENT_ROOT, entry.name, 'sadarzhanie.json'))) {
      folders.push(entry.name)
    }
  }

  return folders.sort()
}

/* ─────────── вносът ─────────── */

export const importProduct = async (
  payload: Payload,
  folder: string,
  options: ImportOptions = {},
): Promise<ImportResult> => {
  const dryRun = Boolean(options.dryRun)
  const log = options.log ?? ((m: string) => console.log(m))

  const ROOT = path.join(CONTENT_ROOT, folder)
  const JSON_FILE = path.join(ROOT, 'sadarzhanie.json')

  if (!(await exists(ROOT))) {
    throw new ImportError(
      `Папката не съществува: content/${folder}\n  Създайте я и сложете в нея sadarzhanie.json.`,
    )
  }
  if (!(await exists(JSON_FILE))) {
    throw new ImportError(`Липсва файлът content/${folder}/sadarzhanie.json`)
  }

  let content: Content
  try {
    content = JSON.parse(await fs.readFile(JSON_FILE, 'utf-8')) as Content
  } catch (err) {
    throw new ImportError(
      `Файлът sadarzhanie.json не е валиден JSON:\n  ${(err as Error).message}`,
    )
  }

  if (!content.produkt?.slug) {
    throw new ImportError('В sadarzhanie.json липсва produkt.slug.')
  }

  /*
    `aksesoari` е адресът на страницата „Аксесоари за …" на серията —
    продукт с него би бил недостъпен. Спира и при `--dry-run`, и при
    чернова (тя минава без проверката на полето в админа).
  */
  if (RESERVED_PRODUCT_SLUGS.includes(String(content.produkt.slug))) {
    throw new ImportError(
      `Адресът „${content.produkt.slug}" е запазен (страницата с аксесоарите на серията). Сменете produkt.slug.`,
    )
  }

  /*
    Непозната наличност спира продукта, преди да е записано каквото и да е.

    Payload не я спира сам: новият продукт се записва като ЧЕРНОВА, а
    черновата минава без проверка на полетата. Стойността стига до базата,
    сайтът не я познава и показва продукта като „в наличност" — точно
    обратното на това, което JSON-ът казва. Затова и при `--dry-run`.
  */
  const availability = content.produkt.availability
  if (availability !== undefined && !isAvailability(availability)) {
    throw new ImportError(
      `Непозната наличност „${String(availability)}" в produkt.availability.
` +
        `  Позволени: ${AVAILABILITY_VALUES.join(', ')}`,
    )
  }

  /* ─────────── изображения ─────────── */

  /*
    Всички подпапки на content/<slug>/ се смятат за папки със снимки.

    Имената им НЕ са зашити. Папката с галерията е кръстена веднъж
    „galeryia" и веднъж „galeriya" — при зашит списък втората просто не се
    претърсва и всяка снимка в нея излиза като липсваща, без да е ясно защо.
    Освен това секция може да сочи снимка от галерията: колоната в
    сравнителната таблица показва самия продукт.
  */
  const IMAGE_DIRS = (await fs.readdir(ROOT, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()

  /* ─────────── откъде идва един файл ─────────── */

  /*
    Редът е: преведена → папка на продукта → свален оригинал.

    Първото е важното. Собственикът превежда надписите върху снимките и
    пуска файла в `content/snimki/` под същото име; оттам нататък той
    печели пред всичко, включително пред вече качения в Медия — иначе
    преводът никога не би стигнал до сайта (виж подмяната в `mediaIdFor`).

    Второто е за вече направените продукти: техните `galeriya/` и
    `sekcii/` остават както са и не се местят никъде.

    Третото е кешът със свалените оригинали — общ за всички продукти,
    защото едно семейство продукти дели едни и същи снимки.
  */
  /*
    Две карти на папка: по ПЪЛНО име и по основа.

    Пълното име решава първо. `07.jpg` и `07.png` в една папка са различни
    снимки (затова и `mediaStem` ги разделя) — карта само по основа връща
    която readdir е дала първа и вносът тихо взима чуждата снимка. Основата
    остава като резерва: `09.png` в JSON-а, `09.webp` на диска.
  */
  type Карти = { поИме: Map<string, string>; поОснова: Map<string, string> }

  const прочетиПапка = async (dir: string, натрупай?: Карти): Promise<Карти> => {
    const карти: Карти = натрупай ?? { поИме: new Map(), поОснова: new Map() }
    try {
      for (const name of await fs.readdir(dir)) {
        if (!path.extname(name)) continue
        const пълен = path.join(dir, name)
        if (!карти.поИме.has(name)) карти.поИме.set(name, пълен)
        const stem = bareStem(name)
        if (!карти.поОснова.has(stem)) карти.поОснова.set(stem, пълен)
      }
    } catch {
      // Папката още не съществува — нормално при първо пускане.
    }
    return карти
  }

  const преведени = await прочетиПапка(SNIMKI_DIR)
  const оригинали = await прочетиПапка(ORIGINALI_DIR)

  let вПапката: Карти = { поИме: new Map(), поОснова: new Map() }
  for (const dir of IMAGE_DIRS) вПапката = await прочетиПапка(path.join(ROOT, dir), вПапката)

  /** Пътят до файла и откъде е, или `null`, ако го няма никъде локално. */
  const намериЛокално = (file: string): { path: string; source: FileSource } | null => {
    const stem = bareStem(file)

    /*
      Преведеният печели ВИНАГИ — и по основа, не само по цяло име.

      Преди търсенето минаваше първо по цяло име през трите папки и чак
      после по основа. Превод, записан като `100_rigid_2.jpg`, губеше от
      оригинала `100_rigid_2.png` в `_originali/` (точно име) и вносът го
      подминаваше мълчаливо — 30 преведени снимки не стигнаха до сайта.
    */
    /*
      PNG пред всичко останало със същата основа: обработените снимки с
      прозрачен фон (`snimki:bql-fon`) се връщат като `<основа>.png` и
      трябва да изместят и превод в `.jpg` със същото име.
    */
    const преведен =
      преведени.поИме.get(`${stem}.png`) ?? преведени.поИме.get(file) ?? преведени.поОснова.get(stem)
    if (преведен) return { path: преведен, source: 'snimki' }

    const редът: [Карти, FileSource][] = [
      [вПапката, 'папка'],
      [оригинали, 'оригинали'],
    ]
    for (const [карти, source] of редът) {
      const точен = карти.поИме.get(file)
      if (точен) return { path: точен, source }
    }
    for (const [карти, source] of редът) {
      const близък = карти.поОснова.get(stem)
      if (близък) return { path: близък, source }
    }
    return null
  }

  /* ─────────── сваляне на липсващите снимки ─────────── */

  /*
    Свалянето осигурява ФАЙЛА, не записа в Медия — двете са различни неща.

    Файлът е архивът: ако утре потрябва друг формат или друга изрезка, има
    от какво да се направят. Затова липсващ файл се сваля дори когато вече
    е качен в Медия. Свалените отиват в общата `content/_originali/`, не в
    папката на продукта: една снимка се ползва от пет продукта и няма
    смисъл да се тегли пет пъти.

    Налично се брои по ОСНОВА на името, не по цялото. Качването търси в
    Медия по основа (`mediaStem`), тоест `PC_R3_01.jpg` вече покрива нужда
    от `PC_R3_01.png`. При проверка по цялото име свалянето слагаше `.png`
    до `.jpg`, двата се смятаха за различни снимки и в Медия влизаха като
    `PC_R3_01-jpg` и `PC_R3_01-png`.
  */
  const адреси = new Map<string, string>()
  for (const списък of [content._svali_snimki?.galeriya, content._svali_snimki?.sekcii]) {
    for (const url of списък ?? []) {
      if (typeof url !== 'string') continue
      const name = fileNameFromUrl(url)
      if (name && !адреси.has(name)) адреси.set(name, url)
    }
  }

  let downloaded = 0
  const failedDownloads: string[] = []
  /*
    При проверка нищо не се сваля, но файлът ЩЕ го има. Без този списък
    качването не го намира никъде и продукт, чиито снимки всички тепърва се
    свалят (всеки нов продукт), излиза с „нито една снимка от галерията" —
    проверката казва „грешка" за внос, който би минал.
  */
  const щеСеСвалят = new Set<string>()

  if (адреси.size && !options.noDownload) {
    const задачи: (() => Promise<void>)[] = []

    for (const file of neededFiles(content)) {
      if (намериЛокално(file)) continue
      const url = адреси.get(file)
      if (!url) continue

      задачи.push(async () => {
        const dest = path.join(ORIGINALI_DIR, file)
        try {
          if (dryRun) {
            щеСеСвалят.add(file)
            log(`  ↓ би се свалил: ${file}`)
          } else {
            await downloadFile(url, dest)
            оригинали.поИме.set(file, dest)
            оригинали.поОснова.set(bareStem(file), dest)
            log(`  ↓ свален: ${file}`)
          }
          downloaded += 1
        } catch (e) {
          // Един неуспешен файл не спира продукта — секцията остава без снимка.
          failedDownloads.push(`${file} (${(e as Error).message})`)
          log(`  ⚠ не се свали: ${file} — ${(e as Error).message}`)
        }
      })
    }

    if (задачи.length) {
      log(`Сваляне на ${задачи.length} липсващи снимки…`)
      // По четири наведнъж: достатъчно бързо, без да залива CDN-а.
      await поPartии(задачи, 4)
    }
  }

  /*
    Празно не е грешка.

    Снимките се търсят първо в Медия по име и чак ако ги няма там — на
    диска. Продукт, чиито файлове вече са качени от предишен внос или от
    съседен продукт, се внася и от папка само с `sadarzhanie.json`. Точно
    такъв е случаят на river-3-plus-wireless: 27 от 31 файла вече бяха в
    Медия, а вносът отказваше заради липсващи папки.

    Каквото наистина липсва, влиза в „липсващи файлове" — както винаги.
  */

  /*
    Основи на имената, които се срещат с повече от едно разширение.

    `07.jpg` и `07.png` са различни снимки, но Payload именува файла по
    съдържанието (виж `sniffFormat`) и двете биха станали `07.webp` —
    вторият запис пада на уникалното име, а сравнението по основа би върнало
    първата снимка вместо втората. Такива файлове се качват с разширението
    в името: `07-jpg`, `07-png`.
  */
  const stemsWithManyExts = new Set<string>()
  {
    const filesByStem = new Map<string, string[]>()
    for (const dir of IMAGE_DIRS) {
      for (const name of await fs.readdir(path.join(ROOT, dir))) {
        if (!path.extname(name)) continue
        const stem = bareStem(name)
        filesByStem.set(stem, [...(filesByStem.get(stem) ?? []), path.join(ROOT, dir, name)])
      }
    }
    for (const [stem, files] of filesByStem) {
      if (files.length < 2) continue
      // Едно и също съдържание под две разширения (копие) не е двусмислие.
      const hashes = new Set<string>()
      for (const f of files) {
        hashes.add(createHash('md5').update(await fs.readFile(f)).digest('hex'))
      }
      if (hashes.size > 1) stemsWithManyExts.add(stem)
    }
  }

  /** Основата на името, под която файлът се търси и качва в Медия. */
  const mediaStem = (file: string): string => {
    const stem = bareStem(file)
    return stemsWithManyExts.has(stem) ? `${stem}-${path.extname(file).slice(1).toLowerCase()}` : stem
  }

  const uploadedCache = new Map<string, number>()
  let uploadedNew = 0
  let reusedExisting = 0
  const missingFiles: string[] = []
  /** Откъде е взет всеки файл — за `--dry-run` и за обобщението. */
  const sources = new Map<string, FileSource>()
  /** Подменените записи в Медия. Никога не остават мълчаливи. */
  const replacements: { file: string; mediaId: number; filename: string; source: FileSource }[] = []

  /** Съвпада ли файлът в `media/` байт по байт с локалния. */
  const същоСъдържание = async (
    filename: string | null | undefined,
    локален: string,
  ): Promise<boolean> => {
    if (!filename) return false
    try {
      const качен = await fs.readFile(path.resolve(process.cwd(), 'media', filename))
      const местен = await fs.readFile(локален)
      return качен.equals(местен)
    } catch {
      /*
        Файлът в `media/` липсва — записът сочи в нищото. Тогава локалният
        трябва да го замени, затова „не съвпадат".
      */
      return false
    }
  }

  /**
   * Връща оригиналните байтове върху записания файл.
   *
   * Payload прекарва WebP, AVIF и GIF през Sharp БЕЗУСЛОВНО — заради
   * евентуална анимация (`fileIsAnimatedType` в `generateFileData.js`).
   * Дори без `formatOptions` `sharp().rotate().toBuffer()` прекодира:
   * PC_5_1_D3P_X-Quiet излизаше 108 934 B от 139 274 B, при същите
   * 2240×880. Не е преоразмеряване и не е наш код — но архивът не бива да
   * е по-лош от подаденото.
   *
   * Размерите вече са направени; тук само файлът на оригинала се връща и
   * `filesize` се изравнява. JPEG и PNG не минават през този път и вече
   * съвпадат байт по байт — затова се проверява, вместо да се презаписва
   * сляпо. Това е и което държи сравнението по-горе да дава „еднакви" при
   * повторно пускане.
   */
  const върниОригинала = async (
    filename: string | null | undefined,
    data: Buffer,
    realExt: string,
    file: string,
  ): Promise<void> => {
    if (!filename) return
    const stored = path.resolve(process.cwd(), 'media', filename)
    const onDisk = await fs.readFile(stored)
    if (onDisk.equals(data) || path.extname(filename).toLowerCase() !== realExt) return

    await fs.writeFile(stored, data)
    const запис = await payload.find({
      collection: 'media',
      where: { filename: { equals: filename } },
      limit: 1,
      depth: 0,
    })
    const id = запис.docs[0]?.id
    if (typeof id === 'number') {
      await payload.update({
        collection: 'media',
        id,
        data: { filesize: data.length },
        depth: 0,
      })
    }
    log(`  · ${file}: оригиналът е върнат непрекодиран (${data.length} B)`)
  }

  /** Подмяната на файла в Медия — виж `replaceMediaContent` (ниво модул). */
  const подмениСъдържанието = (
    doc: Parameters<typeof replaceMediaContent>[2],
    данни: Buffer,
    realExt: string,
    file: string,
    alt: string,
  ) => replaceMediaContent(payload, log, doc, данни, realExt, file, alt)

  /**
   * Връща номера на изображението в Медия, качвайки или подменяйки при нужда.
   *
   * Редът е този от задачата: преведена снимка → папка на продукта →
   * свален оригинал → Медия → сваляне → „липсва".
   *
   * Тънкото място е съчетаването на първите три с четвъртото. Локалният
   * файл ПЕЧЕЛИ, но това не значи ново качване: ако в Медия вече има запис
   * със същото име, той се ОБНОВЯВА на място, със същия номер. Така
   * преведената снимка стига до всички продукти, които сочат записа, и
   * нищо не се дублира. Ако съдържанието съвпада — не се прави нищо.
   */
  const mediaIdFor = async (
    dirHint: string,
    file: string,
    alt: string,
  ): Promise<number | null> => {
    const key = `${dirHint}/${file}`
    if (uploadedCache.has(key)) return uploadedCache.get(key)!

    /*
      Сравнява се по име БЕЗ разширение.

      Колекцията „Медия" преобразува качванията в WebP, тоест `snimka.jpg`
      се записва като `snimka.webp`. Сравнение по цялото име никога не
      съвпада за .jpg файловете и скриптът ги качва наново при всяко
      пускане, а Payload им лепва наставка -1.
    */
    const stem = mediaStem(file)

    /*
      Две основи: самата и тази с наставка за регистъра. Втората е на снимка,
      качена до друга, чието име се различава само по регистъра
      (`3_1_img` до `3_1_IMG` на RIVER) — виж `caseSafeStem`.
    */
    const безопасна = caseSafeStem(stem)
    const candidates = [
      ...(await sameStemIgnoringCase(payload, stem)),
      ...(await sameStemIgnoringCase(payload, безопасна)),
    ]

    // Съвпадението е ТОЧНО, с регистъра: `3_1_IMG.jpg` не е `3_1_img.png`.
    const match =
      candidates.find((doc) => doc.filename && mediaFileStem(doc.filename) === stem) ??
      candidates.find((doc) => doc.filename && mediaFileStem(doc.filename) === безопасна)
    // Друга снимка със същото име в друг регистър — новата се качва с наставка.
    const регистър = match
      ? undefined
      : candidates.find((doc) => doc.filename && mediaFileStem(doc.filename) !== безопасна)

    const локален = намериЛокално(file)

    /* ─── няма локален файл: остава само вече каченото ─── */
    if (!локален) {
      if (match) {
        reusedExisting += 1
        sources.set(file, 'Медия')
        uploadedCache.set(key, match.id)
        return match.id
      }
      // Само при проверка: истинският внос вече го е свалил и е намерен горе.
      if (щеСеСвалят.has(file)) {
        uploadedNew += 1
        sources.set(file, 'ще се свали')
        uploadedCache.set(key, DRY_ID)
        return DRY_ID
      }
      // Една липсваща снимка не бива да спира целия внос.
      missingFiles.push(key)
      sources.set(file, 'ЛИПСВА')
      log(
        адреси.has(file) && options.noDownload
          ? `  ⚠ липсва файл: ${key} — има адрес, но свалянето е изключено`
          : `  ⚠ липсва файл: ${key} — няма го нито локално, нито в Медия`,
      )
      return null
    }

    const ext = path.extname(локален.path).toLowerCase()
    if (!MIME[ext]) {
      missingFiles.push(`${key} (непознат вид файл)`)
      sources.set(file, 'ЛИПСВА')
      log(`  ⚠ непознат вид файл: ${key} — пропуснат`)
      return null
    }

    const real = await sniffFormat(локален.path)
    const declared = ext === '.jpeg' ? 'jpg' : ext.slice(1)
    if (real && real !== declared) {
      log(`  · ${file}: файлът е ${real.toUpperCase()} въпреки разширението — в Медия ще е .${real}`)
    }
    const realExt = real ? `.${real}` : ext

    /* ─── има и локален, и в Медия: съвпадат ли ─── */
    if (match) {
      /*
        ПОДМЯНА СЕ ПРАВИ САМО ЗА ФАЙЛ ОТ `content/snimki/`.

        Задачата описва сравнение и за файловете в папката на продукта, но
        то не може да работи: в Медия стои това, което Payload е ЗАПИСАЛ —
        `07.png` от диска е `07-png.webp` в Медия, а качените преди
        връщането на оригиналните байтове се различават и по съдържание.
        Сравнението по байтове през два формата винаги дава „различни" и
        първото пускане поиска 68 подмени, от които нито една истинска —
        включително по деветте продукта, които §5 изрично защитава.

        `content/snimki/` няма тази двусмисленост: там влиза само файл,
        който собственикът е сложил НАРОЧНО, за да замени качения. Затова
        подмяната е вързана за източника, а не за сравнението.
      */
      const еднакви =
        локален.source !== 'snimki' || (await същоСъдържание(match.filename, локален.path))
      if (еднакви) {
        reusedExisting += 1
        sources.set(file, локален.source)
        uploadedCache.set(key, match.id)
        return match.id
      }

      /*
        Различават се — записът в Медия се обновява със СЪЩИЯ номер.

        Обичайният случай: продуктът е внесен с оригиналите (английски
        надписи), после собственикът превежда снимката и я пуска в
        `content/snimki/`. Нов запис би значел, че старите продукти
        продължават да сочат непреведената. Затова `update` с нов файл:
        размерите се правят наново, всички, които сочат номера, виждат
        новата снимка.

        Всяка подмяна се ИЗПИСВА — никога мълчаливо (виж §5 на задачата).
      */
      replacements.push({
        file,
        mediaId: match.id,
        filename: match.filename ?? '',
        source: локален.source,
      })

      if (dryRun) {
        sources.set(file, локален.source)
        uploadedCache.set(key, match.id)
        return match.id
      }

      const данни = await fs.readFile(локален.path)
      const успя = await подмениСъдържанието(match as never, данни, realExt, file, alt)
      if (!успя) {
        // Подмяната не мина — старата снимка остава, за да не се счупи нищо.
        replacements.pop()
        reusedExisting += 1
      }
      sources.set(file, локален.source)
      uploadedCache.set(key, match.id)
      return match.id
    }

    /* ─── няма в Медия: качва се ─── */

    // При проверка файлът е намерен и това стига — нищо не се качва.
    if (dryRun) {
      uploadedNew += 1
      sources.set(file, локален.source)
      uploadedCache.set(key, DRY_ID)
      return DRY_ID
    }

    /*
      Файлът се подава като буфер с име по `mediaStem`, не като път:
      така името в Медия е под контрол (виж по-горе), а JPEG и PNG остават
      байт по байт. WebP Payload прекарва през Sharp така или иначе.
    */
    const data = await fs.readFile(локален.path)
    const uploadStem = регистър ? безопасна : stem
    if (регистър) {
      log(
        `  · ${file}: името се различава само по регистъра от ${регистър.filename} ` +
          `(запис № ${регистър.id}) — качва се като ${uploadStem}${realExt}`,
      )
    }
    const doc = await payload.create({
      collection: 'media',
      data: { alt: alt || file },
      file: { data, name: `${uploadStem}${realExt}`, mimetype: MIME[realExt]!, size: data.length },
    })

    await върниОригинала(doc.filename, data, realExt, file)

    uploadedNew += 1
    sources.set(file, локален.source)
    uploadedCache.set(key, doc.id)
    return doc.id
  }

  /* ─────────── секции ─────────── */

  /**
   * Номерът на продукт по адрес — за колоните на сравнителната таблица.
   *
   * Колоната носи `productSlug`. Ако продуктът е в каталога, връзката
   * `product` се записва и снимката, цената и бутонът идват от него. Ако
   * още не е внесен, колоната остава с ръчното си име — без грешка; при
   * следващ внос връзката се допълва. Черновите се броят: продуктът може
   * да е внесен, но още непубликуван.
   */
  const productIdCache = new Map<string, number | null>()
  const linkedProducts: string[] = []
  const unlinkedProducts: string[] = []

  const productIdFor = async (other: string): Promise<number | null> => {
    if (productIdCache.has(other)) return productIdCache.get(other)!
    const found = await payload.find({
      collection: 'products',
      where: { slug: { equals: other } },
      limit: 1,
      depth: 0,
      draft: true,
    })
    const id = found.docs[0]?.id ?? null
    productIdCache.set(other, id)
    ;(id === null ? unlinkedProducts : linkedProducts).push(other)
    return id
  }

  /**
   * Превръща един запис от JSON-а в блок, готов за записване.
   *
   * Три различия между удобния за писане JSON и това, което схемата очаква:
   *  - `image` е име на файл, а полето иска номер от Медия
   *  - `imageAlt` описва снимката и отива в Медия, не в блока
   *  - `values` в сравнителната таблица е списък от текстове, а полето е
   *    масив от обекти
   *  - ключове, започващи с долна черта, са бележки за хора и се изхвърлят
   */
  const prepareBlock = async (node: unknown, altHint = ''): Promise<unknown> => {
    if (Array.isArray(node)) {
      /*
        Последователно, не `Promise.all`. Две секции с една и съща снимка,
        качвани едновременно, не се виждат в `uploadedCache` и Payload пада
        на уникалното име на файла — вносът спираше по средата.
      */
      const out: unknown[] = []
      for (const n of node) out.push(await prepareBlock(n, altHint))
      return out
    }

    if (!node || typeof node !== 'object') return node

    const source = node as Card
    const out: Card = {}
    const alt = typeof source.imageAlt === 'string' ? source.imageAlt : altHint

    for (const [key, value] of Object.entries(source)) {
      if (key.startsWith('_')) continue // бележки за хора
      if (key === 'imageAlt') continue // отива като alt в Медия

      // Колона в сравнителната таблица: адрес на продукт → връзка `product`.
      if (key === 'productSlug' && typeof value === 'string') {
        const id = await productIdFor(value)
        if (id !== null) out.product = id
        continue
      }

      /*
        Празно име — секцията е без снимка (секция само с текст). Не е
        липсващ файл: полето просто остава празно. Ако блокът изисква снимка,
        това ще го каже проверката при публикуване.
      */
      if ((key === 'image' || key === 'icon') && typeof value === 'string' && !value.trim()) {
        continue
      }

      if (key === 'image' && typeof value === 'string') {
        out.image = await mediaIdFor('sekcii', value, alt)
        continue
      }

      if (key === 'icon' && typeof value === 'string') {
        out.icon = await mediaIdFor('sekcii', value, alt)
        continue
      }

      // Сравнителната таблица: ["1024Wh", "1024Wh"] → [{ value: … }, …]
      if (key === 'values' && Array.isArray(value)) {
        out.values = value.map((v) => (typeof v === 'string' ? { value: v } : v))
        continue
      }

      out[key] = await prepareBlock(value, alt)
    }

    return out
  }

  /* ─────────── категория ─────────── */

  /*
    Основната категория — по нея е адресът. Първата от `"categories"`, ако
    го има; иначе `categorySlug`, както досега.
  */
  const списъкКатегории = Array.isArray(content.produkt.categories)
    ? (content.produkt.categories as unknown[]).filter((x): x is string => typeof x === 'string')
    : []
  const categorySlug = списъкКатегории[0] ?? (content.produkt.categorySlug as string | undefined)
  if (!categorySlug) {
    throw new ImportError('В produkt липсва categorySlug (или categories).')
  }

  const categories = await payload.find({
    collection: 'categories',
    where: { slug: { equals: categorySlug } },
    limit: 1,
    depth: 0,
  })

  if (!categories.docs[0]) {
    const all = await payload.find({ collection: 'categories', depth: 0, pagination: false })
    throw new ImportError(
      `Няма категория с адрес „${categorySlug}".\n  Съществуващи: ` +
        all.docs.map((c) => c.slug).join(', '),
    )
  }

  const categoryId = categories.docs[0].id

  /* ─────────── галерия ─────────── */

  log('Качване на изображения…')

  const galleryEntries = content.galeriya ?? []
  const galleryIds: number[] = []

  for (const item of galleryEntries) {
    const id = await mediaIdFor('galeryia', item.file, item.alt ?? '')
    if (id !== null) galleryIds.push(id)
  }

  if (!galleryIds.length) {
    throw new ImportError('Нито една снимка от галерията не можа да бъде качена — вносът е спрян.')
  }

  // Първата снимка е основната; останалите отиват в галерията.
  const [mainImage, ...restGallery] = galleryIds

  /* ─────────── секции ─────────── */

  log('Подготовка на секциите…')
  const sections = (await prepareBlock(content.sekcii ?? [])) as unknown[]

  /* ─────────── продуктът ─────────── */

  const {
    categorySlug: _drop,
    categories: _categories,
    compatibleWithSlugs,
    compatibleWith: compatibleWithList,
    alsoInCategories: alsoInSlugs,
    // Атрибутите са на `import:attributes` — този внос никога не ги пипа.
    attributes: _attributes,
    ...productFields
  } = content.produkt as Record<string, unknown>

  /*
    Акцент само с `text` — кратка точка без пояснение („Защита IP65").
    В схемата заглавието е задължително, а пояснението е по избор: акцент
    само със заглавие е точно „един ред". Аксесоарите идват така и на
    1 октомври 2026 и деветте излязоха чернови — публикуването падаше на
    „Акценти под цената > Заглавие".
  */
  if (Array.isArray(productFields.highlights)) {
    productFields.highlights = productFields.highlights.map((h: unknown) => {
      const акцент = h as { title?: unknown; text?: unknown } | null
      return акцент && !акцент.title && акцент.text
        ? { ...акцент, title: акцент.text, text: null }
        : h
    })
  }

  /** Списък от слъгове; всичко друго — празен. */
  const слъгове = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []

  /* ─────────── съвместимост ─────────── */

  /**
   * „Съвместим с": слъгове на категории И на продукти, смесено.
   *
   * Аксесоарът не се слага в подкатегория „за DELTA" — казва с кои серии и
   * модели работи и се появява сам на страницата на серията, в „Свързани
   * продукти" на модела и в раздела „Аксесоари" в менюто.
   *
   * Ключът е `compatibleWith` (или по-старото `compatibleWithSlugs`).
   * Слъг, който още го няма, се прескача с предупреждение: продуктът може
   * да се внесе по-късно, а следващият внос дописва връзката.
   */
  const compatibleWith: { relationTo: 'categories' | 'products'; value: number }[] = []

  for (const other of [...слъгове(compatibleWithSlugs), ...слъгове(compatibleWithList)]) {

    const кат = await payload.find({
      collection: 'categories',
      where: { slug: { equals: other } },
      limit: 1,
      depth: 0,
    })
    if (кат.docs[0]) {
      compatibleWith.push({ relationTo: 'categories', value: кат.docs[0].id })
      continue
    }

    const прод = await payload.find({
      collection: 'products',
      where: { slug: { equals: other } },
      limit: 1,
      depth: 0,
      draft: true,
    })
    if (прод.docs[0]) {
      compatibleWith.push({ relationTo: 'products', value: прод.docs[0].id })
      continue
    }

    missingFiles.push(`съвместимост: няма категория или продукт „${other}"`)
    log(`  ⚠ „Съвместим с": няма категория или продукт „${other}" — прескочен`)
  }

  /* ─────────── „Категории" ─────────── */

  /*
    Първата е основната (`categoryId` по-горе). Останалите идват от:
    - `"categories": [...]` — ако го има, той решава всичко;
    - иначе `"alsoInCategories"` (старото „Покажи и в");
    - иначе — каквито продуктът вече има след основната. Собственикът може
      да е добавил категории от админа, а JSON-ът не ги знае; внос, който ги
      трие, би ги губил при всяко пускане.
    Ненамерена категория се прескача с предупреждение.
  */
  let допълнителни: number[] | undefined
  const другиСлъгове = списъкКатегории.length
    ? списъкКатегории.slice(1)
    : alsoInSlugs !== undefined
      ? слъгове(alsoInSlugs)
      : undefined
  if (другиСлъгове) {
    допълнителни = []
    for (const slug of другиСлъгове) {
      const кат = await payload.find({
        collection: 'categories',
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 0,
      })
      if (кат.docs[0]) {
        допълнителни.push(кат.docs[0].id)
      } else {
        missingFiles.push(`„Категории": няма категория „${slug}"`)
        log(`  ⚠ „Категории": няма категория „${slug}" — прескочена`)
      }
    }
  }

  const existingProduct = await payload.find({
    collection: 'products',
    where: { slug: { equals: content.produkt.slug as string } },
    limit: 1,
    depth: 0,
  })

  const досегашни = (existingProduct.docs[0]?.categories ?? [])
    .map((c) => (typeof c === 'number' ? c : c?.id))
    .filter((id): id is number => typeof id === 'number')
  // Основната първа, без повторения.
  const всичкиКатегории = [...new Set([categoryId, ...(допълнителни ?? досегашни)])]

  const data = {
    ...productFields,
    categories: всичкиКатегории,
    category: categoryId,
    image: mainImage,
    gallery: restGallery.map((image) => ({ image })),
    specGroups: content.specGroups ?? [],
    sections,
    ...(compatibleWith.length ? { compatibleWith } : {}),
  } as Record<string, unknown>

  /*
    Статусът.

    Нов продукт излиза ПУБЛИКУВАН. Собственикът внася по петнайсет продукта
    на партида и „Публикувай" след всеки е стъпка, която никой не иска.
    С `--draft` новият става чернова — когато първо трябва преглед.

    Вече публикуван продукт се обновява и публикува направо. Продукт, който
    е чернова, остава чернова: някой го е върнал в чернова нарочно и вносът
    не бива да го извади на сайта зад гърба му.

    Публикуването минава през проверките на схемата (задължителни снимки,
    лимити). Ако не мине, вносът записва чернова и изписва защо — при
    обновяване старата публикувана версия остава на сайта.
  */
  const existing = existingProduct.docs[0]
  const wasPublished = existing?._status === 'published'
  let action: ImportAction
  let publishError: string | null = null
  let menu: string[] = []
  // Полетата на реда в менюто — от продукта; етикетът остава празен.
  const карта = {
    title: (content.produkt.title as string | undefined) ?? null,
    specLine: (content.produkt.tagline as string | undefined) ?? null,
    image: mainImage ?? null,
  }

  const резултат = (): ImportResult => ({
    slug: content.produkt.slug as string,
    title: (content.produkt.title as string) ?? (content.produkt.slug as string),
    action,
    published: isPublishedAction(action) && !dryRun,
    uploadedNew,
    reusedExisting,
    gallery: galleryIds.length,
    specGroups: (content.specGroups ?? []).length,
    sections: sections.length,
    linkedProducts,
    unlinkedProducts,
    downloaded,
    sources: [...sources.entries()],
    replacements,
    failedDownloads,
    missingFiles,
    publishError,
    menu,
    dryRun,
  })

  /*
    Проверката спира тук. Дотук всичко е четене: кои файлове ги има, кои
    вече са в Медия, кои колони ще се вържат — точно каквото трябва да се
    види преди същинския внос.
  */
  if (dryRun) {
    /*
      При проверка се изписва откъде би дошъл ВСЕКИ файл. Така собственикът
      вижда кои от преведените снимки вече са разпознати — иначе трябва да
      гадае дали файлът, който току-що е сложил в `content/snimki/`, е с
      правилното име.
    */
    for (const [file, source] of sources) log(`  ${source.padEnd(12)} ${file}`)

    action = !existing
      ? options.draft
        ? 'създаден като чернова'
        : 'създаден и публикуван'
      : wasPublished
        ? 'обновен и публикуван'
        : 'обновен (остава чернова)'
    if (!existing) {
      menu = await addToMenuPanels(payload, {
        productId: DRY_ID,
        card: карта,
        categoryId,
        dryRun: true,
      })
      for (const ред of menu) log(`  ${ред}`)
    }
    return резултат()
  }

  /*
    `depth: 0` е задължително, не оптимизация.

    Сравнителната таблица на продукта има колона, която сочи САМИЯ продукт
    (моделът се сравнява с братята си). При запис Payload попълва връзките в
    отговора до подадената дълбочина; с дълбочина 2 попълването на продукта
    вътре в собствения му запис никога не завършва — обещанието не се
    изпълнява, цикълът на събитията се изпразва и процесът излиза с код 0
    по средата, след като версията вече е записана. Без съобщение.
    Админът записва с depth 0 и не го засяга; скрипт и REST — трябва изрично.
  */
  if (existing && wasPublished) {
    try {
      await payload.update({
        collection: 'products',
        id: existing.id,
        data: { ...data, _status: 'published' },
        draft: false,
        depth: 0,
      })
      action = 'обновен и публикуван'
    } catch (e) {
      publishError = e instanceof Error ? e.message : String(e)
      await payload.update({
        collection: 'products',
        id: existing.id,
        data: { ...data, _status: 'draft' },
        draft: true,
        depth: 0,
      })
      action = 'обновен, но само като чернова — публикуването не мина проверките'
    }
  } else if (existing) {
    await payload.update({
      collection: 'products',
      id: existing.id,
      data: { ...data, _status: 'draft' },
      draft: true,
      depth: 0,
    })
    action = 'обновен (остава чернова)'
  } else {
    const createDraft = () =>
      payload.create({
        collection: 'products',
        data: { ...data, _status: 'draft' },
        draft: true,
        depth: 0,
      })

    let created
    if (options.draft) {
      created = await createDraft()
      action = 'създаден като чернова'
    } else {
      try {
        created = await payload.create({
          collection: 'products',
          // `data` е сглобен от JSON-а — задължителните полета проверява схемата.
          data: { ...data, _status: 'published' } as never,
          draft: false,
          depth: 0,
        })
        action = 'създаден и публикуван'
      } catch (e) {
        // Проверката пада преди запис — нищо не е създадено, остава чернова.
        publishError = e instanceof Error ? e.message : String(e)
        created = await createDraft()
        action = 'създаден като чернова — публикуването не мина проверките'
      }
    }
    const published = action === 'създаден и публикуван'

    /*
      Новият продукт влиза в менюто сам — в края на секцията за своята
      категория. САМО при създаване: обновяване не пипа панелите, затова
      махнат от собственика продукт не се връща при следващ внос.
    */
    menu = await addToMenuPanels(payload, {
      productId: created.id,
      card: карта,
      categoryId,
      dryRun: false,
    })
    for (const ред of menu) log(`  ${ред}`)

    /*
      Колоната „този модел" в сравнителната таблица сочи самия продукт, а
      той още не съществуваше, когато колоните се връзваха. Сега го има —
      секциите се сглобяват втори път (снимките са в кеша) и връзката се
      допълва, вместо да чака следващо пускане.
    */
    const ownSlug = content.produkt.slug as string
    if (unlinkedProducts.includes(ownSlug)) {
      productIdCache.delete(ownSlug)
      unlinkedProducts.splice(unlinkedProducts.indexOf(ownSlug), 1)
      const relinked = (await prepareBlock(content.sekcii ?? [])) as unknown[]
      /*
        Публикуваният се записва като публикуван. Запис с `draft: true`
        върху него остава само във версиите — на сайта колоната не би била
        вързана, а в админа продуктът би бил с „непубликувани промени".
      */
      await payload.update({
        collection: 'products',
        id: created.id,
        data: { sections: relinked, ...(published ? { _status: 'published' } : {}) } as never,
        draft: !published,
        depth: 0,
      })
    }
  }

  return резултат()
}

/* ─────────── менюто ─────────── */

/**
 * Добавя НОВ продукт в края на секциите в менюто — като ред с попълнени
 * име, подзаглавие и снимка и празен етикет. Връща редове за обобщението.
 *
 * Панелите нямат автоматичен режим: сайтът показва точно списъка на всяка
 * секция. Вносът само ДОБАВЯ новите продукти; махане и подредба са на
 * собственика. Затова се вика единствено при създаване — обновяване не
 * пипа панелите и махнат продукт не се връща.
 *
 * Къде:
 * - в секцията с НАЙ-БЛИЗКАТА категория: първо тази на продукта, после
 *   родителската серия, после главната. Най-близката, не първата срещната:
 *   „Аксесоари" (главна) и „Кабели" (под нея) и двете съдържат кабела,
 *   а мястото му е в „Кабели". При равенство — първата по реда в менюто;
 * - никога в раздел „Аксесоари" (отметката `accessories`): празният се
 *   пълни сам от „Съвместим с" (`Header.tsx`), а ред от вноса би го
 *   направил ръчен и би спрял попълването;
 * - САМО в панели, които са в менюто. Стари панели извън него имат секции
 *   със същите категории и иначе новият продукт отиваше там, където никой
 *   не го вижда.
 */
export const addToMenuPanels = async (
  payload: Payload,
  {
    productId,
    card,
    categoryId,
    dryRun,
  }: {
    productId: number
    card: { title: string | null; specLine: string | null; image: number | null }
    categoryId: number
    dryRun: boolean
  },
): Promise<string[]> => {
  const header = await payload.findGlobal({ slug: 'header', depth: 0 })
  const panelIds: number[] = []
  for (const item of header.items ?? []) {
    for (const group of item.groups ?? []) {
      for (const entry of group.entries ?? []) {
        const id = typeof entry.panel === 'number' ? entry.panel : entry.panel?.id
        if (typeof id === 'number' && !panelIds.includes(id)) panelIds.push(id)
      }
    }
  }

  const categories = await payload.find({
    collection: 'categories',
    pagination: false,
    depth: 0,
  })
  const parentOf = new Map<number, number | null>()
  const titleOf = new Map<number, string>()
  for (const c of categories.docs) {
    parentOf.set(c.id, typeof c.parent === 'number' ? c.parent : (c.parent?.id ?? null))
    titleOf.set(c.id, c.title)
  }

  /** Категорията и всички над нея: [сама, родител, баба…]. */
  const нагоре = (id: number): number[] => {
    const out: number[] = []
    for (let c: number | null | undefined = id; c != null && !out.includes(c); c = parentOf.get(c)) {
      out.push(c)
    }
    return out
  }

  const panels = panelIds.length
    ? (
        await payload.find({
          collection: 'menu-panels',
          where: { id: { in: panelIds } },
          pagination: false,
          depth: 0,
        })
      ).docs.sort((a, b) => panelIds.indexOf(a.id) - panelIds.indexOf(b.id))
    : []

  type Цел = { panelIndex: number; sectionIndex: number }
  const цели: Цел[] = []

  // Секцията с най-близката категория.
  const предци = нагоре(categoryId)
  let най: (Цел & { разстояние: number }) | null = null
  panels.forEach((panel, panelIndex) => {
    ;(panel.sections ?? []).forEach((section, sectionIndex) => {
      if (section.accessories) return
      const c = section.viewAllCategory
      const id = typeof c === 'number' ? c : c?.id
      if (typeof id !== 'number') return
      const разстояние = предци.indexOf(id)
      if (разстояние < 0) return
      if (!най || разстояние < най.разстояние) най = { panelIndex, sectionIndex, разстояние }
    })
  })
  if (най) цели.push(най)

  if (!цели.length) {
    return [
      `не е добавен в панел: няма секция за категория „${titleOf.get(categoryId) ?? categoryId}"`,
    ]
  }

  const редове: string[] = []
  const докоснати = new Set<number>()
  for (const { panelIndex, sectionIndex } of цели) {
    const panel = panels[panelIndex]!
    const section = panel.sections![sectionIndex]!
    const cards = section.cards ?? []
    const ids = cards.map((c) => (typeof c.product === 'number' ? c.product : c.product?.id))
    if (ids.includes(productId)) continue
    section.cards = [...cards, { product: productId, ...card, label: null }]
    докоснати.add(panelIndex)
    редове.push(
      `${dryRun ? 'би се добавил' : 'добавен'} в панел „${panel.title}" › „${section.heading}" (${cards.length + 1}-и)`,
    )
  }

  if (!dryRun) {
    for (const panelIndex of докоснати) {
      const panel = panels[panelIndex]!
      await payload.update({
        collection: 'menu-panels',
        id: panel.id,
        data: { sections: panel.sections } as never,
        depth: 0,
      })
    }
  }

  return редове
}

/* ─────────── кешът на работещия сървър ─────────── */

/**
 * Моли работещия сървър да изчисти кеша на четенията.
 *
 * Кешът живее в него и скриптът не може да го изчисти отвън (виж
 * CLAUDE.md, т. 14). Ако сървър не работи — няма какво да се опреснява;
 * следващият старт или билд чете базата наново.
 *
 * Викa се ВЕДНЪЖ за целия внос: тагът е едър и изчиства всичко наведнъж,
 * тоест дванайсет заявки биха свършили същата работа дванайсет пъти.
 */
export const revalidateServer = async (): Promise<string> => {
  const server = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  try {
    const r = await fetch(`${server}/api/products/revalidate`, {
      method: 'POST',
      headers: { 'x-revalidate-key': process.env.PAYLOAD_SECRET ?? '' },
      signal: AbortSignal.timeout(5000),
    })
    return r.ok
      ? `кешът на сървъра (${server}) е опреснен — сайтът показва новото веднага.`
      : `сървърът ${server} отказа опресняване (${r.status}). Промяната ще се види след рестарт или билд.`
  } catch {
    return `сървър на ${server} не отговаря — промяната ще се види при следващия старт или билд.`
  }
}
