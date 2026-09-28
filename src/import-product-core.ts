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

/* ─────────── видове ─────────── */

/** Спънка, описана с човешки текст. Който вика, решава какво да прави. */
export class ImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImportError'
  }
}

export type ImportAction =
  | 'създаден като чернова'
  | 'обновен и публикуван'
  | 'обновен (остава чернова)'
  | 'обновен, но само като чернова — публикуването не мина проверките'

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
  /** Файлове, свалени в папката на продукта при това пускане. */
  downloaded: number
  /** Адреси, които не се свалиха след трите опита. */
  failedDownloads: string[]
  missingFiles: string[]
  publishError: string | null
  /** Нищо не е записано — само проверка. */
  dryRun: boolean
}

export type ImportOptions = {
  /** Само проверява файловете и казва какво би направил. Нищо не се записва. */
  dryRun?: boolean
  /** Изключва свалянето: ползват се само файловете на диска и Медия. */
  noDownload?: boolean
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
const bareStem = (file: string): string =>
  path.basename(file, path.extname(file)).replace(/\.+$/, '')

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
      if ((key === 'image' || key === 'icon') && typeof value === 'string') files.add(value)
      else обходи(value)
    }
  }
  обходи(content.sekcii ?? [])

  return files
}

/* ─────────── папки със съдържание ─────────── */

export const CONTENT_ROOT = path.join(process.cwd(), 'content')

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

  /* ─────────── сваляне на липсващите снимки ─────────── */

  /*
    Първата стъпка е да се осигурят ФАЙЛОВЕТЕ на диска, не записите в
    Медия. Двете са различни неща и редът има значение:

    - Папката на продукта е архивът. Ако утре потрябва друг формат или
      друга изрезка, има от какво да се направят — затова липсващ файл се
      сваля дори когато вече е качен в Медия. Изтрита `galeriya/` се
      връща от само себе си при следващия внос.
    - Самото КАЧВАНЕ обаче пак тръгва от Медия (виж `mediaIdFor`). Иначе
      всяко пускане би качвало наново вече качените снимки и Медия щеше да
      се напълни с `-1`, `-2`, `-3`.

    Ръчно преведена снимка НЕ се презаписва: сваля се само файл, който го
    няма в нито една подпапка.
  */
  const адреси = new Map<string, { url: string; dir: string }>()
  for (const [dir, списък] of [
    ['galeriya', content._svali_snimki?.galeriya],
    ['sekcii', content._svali_snimki?.sekcii],
  ] as const) {
    for (const url of списък ?? []) {
      if (typeof url !== 'string') continue
      const name = fileNameFromUrl(url)
      if (name && !адреси.has(name)) адреси.set(name, { url, dir })
    }
  }

  let downloaded = 0
  const failedDownloads: string[] = []

  if (адреси.size && !options.noDownload) {
    /*
      Налично се брои по ОСНОВА на името, не по цялото име.

      Качването търси в Медия по основа (`mediaStem`), тоест `PC_R3_01.jpg`
      на диска вече покрива нужда от `PC_R3_01.png`. Ако проверката тук
      беше по цялото име, свалянето щеше да сложи `.png` до `.jpg`, двата
      файла щяха да се сметнат за различни снимки (различно съдържание при
      различен формат) и в Медия щяха да влязат като `PC_R3_01-jpg` и
      `PC_R3_01-png`. Точно това се случи при първото пускане.

      Правилото „ръчно преведена снимка има предимство" значи същото:
      файлът на собственика не се измества от свален.
    */
    const налични = new Set<string>()
    for (const entry of await fs.readdir(ROOT, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      for (const name of await fs.readdir(path.join(ROOT, entry.name))) налични.add(bareStem(name))
    }

    /*
      Папката с галерията е кръстена и „galeryia", и „galeriya". Ако вече
      има такава, свалянето отива в НЕЯ — иначе продуктът ще има две
      папки с една и съща роля.
    */
    const папкаЗа = async (dir: string): Promise<string> => {
      const съществуващи = (await fs.readdir(ROOT, { withFileTypes: true }))
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
      const образец = dir === 'galeriya' ? /galer/i : /sekc/i
      return съществуващи.find((d) => образец.test(d)) ?? dir
    }

    const задачи: (() => Promise<void>)[] = []
    for (const file of neededFiles(content)) {
      if (налични.has(bareStem(file))) continue
      const адрес = адреси.get(file)
      if (!адрес) continue

      задачи.push(async () => {
        const dest = path.join(ROOT, await папкаЗа(адрес.dir), file)
        try {
          if (dryRun) {
            log(`  ↓ би се свалил: ${file}`)
          } else {
            await downloadFile(адрес.url, dest)
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

  /**
   * Връща номера на изображението в Медия, качвайки го при нужда.
   *
   * Проверява по име на файл — така повторно пускане на скрипта преизползва
   * вече качените снимки вместо да трупа копия.
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

    const candidates = await payload.find({
      collection: 'media',
      where: { filename: { like: `${stem}.` } },
      limit: 20,
      depth: 0,
    })

    // `like` хваща и съседни имена, затова съвпадението се потвърждава точно.
    const match = candidates.docs.find(
      (doc) => doc.filename && path.basename(doc.filename, path.extname(doc.filename)) === stem,
    )

    if (match) {
      reusedExisting += 1
      uploadedCache.set(key, match.id)
      return match.id
    }

    /*
      Подадената папка се проверява първа, после всички останали. Така
      снимка, преместена в друга папка, продължава да се намира.
    */
    const order = [dirHint, ...IMAGE_DIRS.filter((d) => d !== dirHint)]

    let filePath: string | null = null
    for (const dir of order) {
      const candidate = path.join(ROOT, dir, file)
      if (await exists(candidate)) {
        filePath = candidate
        break
      }
    }

    if (!filePath) {
      // Една липсваща снимка не бива да спира целия внос.
      missingFiles.push(key)
      log(
        IMAGE_DIRS.length
          ? `  ⚠ липсва файл: ${key} — търсен в: ${order.join(', ')}`
          : `  ⚠ липсва файл: ${key} — няма го и в Медия, а content/${folder} е без папки със снимки`,
      )
      return null
    }

    const ext = path.extname(file).toLowerCase()
    if (!MIME[ext]) {
      missingFiles.push(`${key} (непознат вид файл)`)
      log(`  ⚠ непознат вид файл: ${key} — пропуснат`)
      return null
    }

    const real = await sniffFormat(filePath)
    const declared = ext === '.jpeg' ? 'jpg' : ext.slice(1)
    if (real && real !== declared) {
      log(`  · ${file}: файлът е ${real.toUpperCase()} въпреки разширението — в Медия ще е .${real}`)
    }

    // При проверка файлът е намерен и това стига — нищо не се качва.
    if (dryRun) {
      uploadedNew += 1
      uploadedCache.set(key, DRY_ID)
      return DRY_ID
    }

    /*
      Файлът се подава като буфер с име по `mediaStem`, не като `filePath`:
      така името в Медия е под контрол (виж по-горе), а JPEG и PNG остават
      байт по байт. WebP Payload прекарва през Sharp така или иначе.
    */
    // Името и видът следват СЪДЪРЖАНИЕТО — както Payload би ги определил сам.
    const realExt = real ? `.${real}` : ext
    const data = await fs.readFile(filePath)
    const doc = await payload.create({
      collection: 'media',
      data: { alt: alt || file },
      file: { data, name: `${stem}${realExt}`, mimetype: MIME[realExt], size: data.length },
    })

    /*
      Оригиналът се връща байт по байт.

      Payload прекарва WebP, AVIF и GIF през Sharp БЕЗУСЛОВНО — заради
      евентуална анимация (`fileIsAnimatedType` в `generateFileData.js`).
      Дори без `formatOptions` `sharp().rotate().toBuffer()` прекодира:
      PC_5_1_D3P_X-Quiet излизаше 108 934 B от 139 274 B, при същите
      2240×880. Не е преоразмеряване и не е наш код — но архивът не бива да
      е по-лош от подаденото.

      Размерите вече са направени; тук само файлът на оригинала се връща и
      `filesize` се изравнява. JPEG и PNG не минават през този път и вече
      съвпадат байт по байт — затова се проверява, вместо да се презаписва
      сляпо.
    */
    if (doc.filename) {
      const stored = path.resolve(process.cwd(), 'media', doc.filename)
      const onDisk = await fs.readFile(stored)
      if (!onDisk.equals(data) && path.extname(doc.filename).toLowerCase() === realExt) {
        await fs.writeFile(stored, data)
        await payload.update({
          collection: 'media',
          id: doc.id,
          data: { filesize: data.length },
          depth: 0,
        })
        log(`  · ${file}: оригиналът е върнат непрекодиран (${data.length} B)`)
      }
    }

    uploadedNew += 1
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

  const categorySlug = content.produkt.categorySlug as string | undefined
  if (!categorySlug) {
    throw new ImportError('В produkt липсва categorySlug.')
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
    compatibleWithSlugs,
    ...productFields
  } = content.produkt as Record<string, unknown>

  /* ─────────── съвместимост ─────────── */

  /**
   * „Съвместим с": слъгове на категории И на продукти, смесено.
   *
   * Аксесоарът не се слага в подкатегория „за DELTA" — казва с кои серии и
   * модели работи и се появява сам на страницата на серията, в „Свързани
   * продукти" на модела и в панела на менюто.
   */
  const compatibleWith: { relationTo: 'categories' | 'products'; value: number }[] = []

  for (const other of Array.isArray(compatibleWithSlugs) ? compatibleWithSlugs : []) {
    if (typeof other !== 'string') continue

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
    log(`  ⚠ „Съвместим с": няма категория или продукт „${other}"`)
  }

  const data = {
    ...productFields,
    category: categoryId,
    image: mainImage,
    gallery: restGallery.map((image) => ({ image })),
    specGroups: content.specGroups ?? [],
    sections,
    ...(compatibleWith.length ? { compatibleWith } : {}),
  } as Record<string, unknown>

  const existingProduct = await payload.find({
    collection: 'products',
    where: { slug: { equals: content.produkt.slug as string } },
    limit: 1,
    depth: 0,
  })

  /*
    Статусът се пази.

    Нов продукт става чернова — собственикът го преглежда, преди да излезе.
    Вече публикуван продукт се обновява и публикува направо: при сто
    продукта „Публикувай" след всеки внос не е работа за човек. Продукт,
    който е чернова, остава чернова.

    Публикуването минава през проверките на схемата (задължителни снимки,
    лимити). Ако не мине, вносът записва чернова и изписва защо — старата
    публикувана версия остава на сайта.
  */
  const existing = existingProduct.docs[0]
  const wasPublished = existing?._status === 'published'
  let action: ImportAction
  let publishError: string | null = null

  const резултат = (): ImportResult => ({
    slug: content.produkt.slug as string,
    title: (content.produkt.title as string) ?? (content.produkt.slug as string),
    action,
    published: action === 'обновен и публикуван' && !dryRun,
    uploadedNew,
    reusedExisting,
    gallery: galleryIds.length,
    specGroups: (content.specGroups ?? []).length,
    sections: sections.length,
    linkedProducts,
    unlinkedProducts,
    downloaded,
    failedDownloads,
    missingFiles,
    publishError,
    dryRun,
  })

  /*
    Проверката спира тук. Дотук всичко е четене: кои файлове ги има, кои
    вече са в Медия, кои колони ще се вържат — точно каквото трябва да се
    види преди същинския внос.
  */
  if (dryRun) {
    action = !existing
      ? 'създаден като чернова'
      : wasPublished
        ? 'обновен и публикуван'
        : 'обновен (остава чернова)'
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
    const created = await payload.create({
      collection: 'products',
      data: { ...data, _status: 'draft' },
      draft: true,
      depth: 0,
    })
    action = 'създаден като чернова'

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
      await payload.update({
        collection: 'products',
        id: created.id,
        data: { sections: relinked } as never,
        draft: true,
        depth: 0,
      })
    }
  }

  return резултат()
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
