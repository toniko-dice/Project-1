/**
 * Внасяне на продукт от папка със съдържание.
 *
 * Пуска се с:  npm run import:product <slug>
 * Например:    npm run import:product delta-3-classic
 *
 * Очаква следната подредба:
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
 *
 * Продуктът се създава като ЧЕРНОВА. Излиза на сайта чак след като
 * собственикът натисне „Публикувай".
 */
import config from '@payload-config'
import { createHash } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'

/* ─────────── помощни ─────────── */

const die = (message: string): never => {
  console.error(`\n✗ ${message}\n`)
  process.exit(1)
}

const exists = async (p: string): Promise<boolean> => {
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
    if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
    if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpg'
    if (buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'webp'
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

/* ─────────── аргумент ─────────── */

// `payload run` подава своите аргументи, затова взимаме първия, който
// не е път до скрипт и не е служебна дума.
const slug = process.argv
  .slice(2)
  .find((a) => !a.endsWith('.ts') && !a.endsWith('.js') && a !== 'run' && !a.startsWith('-'))

if (!slug) {
  die('Липсва адрес на продукта.\n  Пример: npm run import:product delta-3-classic')
}

const ROOT = path.join(process.cwd(), 'content', slug!)
const JSON_FILE = path.join(ROOT, 'sadarzhanie.json')

if (!(await exists(ROOT))) {
  die(`Папката не съществува: content/${slug}\n  Създайте я и сложете в нея sadarzhanie.json.`)
}
if (!(await exists(JSON_FILE))) {
  die(`Липсва файлът content/${slug}/sadarzhanie.json`)
}

/* ─────────── съдържание ─────────── */

type Card = Record<string, unknown>

type Content = {
  produkt: Record<string, unknown>
  galeriya?: { file: string; alt?: string }[]
  sekcii?: Card[]
  specGroups?: unknown[]
}

let content: Content
try {
  content = JSON.parse(await fs.readFile(JSON_FILE, 'utf-8')) as Content
} catch (err) {
  die(`Файлът sadarzhanie.json не е валиден JSON:\n  ${(err as Error).message}`)
}

if (!content!.produkt?.slug) {
  die('В sadarzhanie.json липсва produkt.slug.')
}

const payload = await getPayload({ config })

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

if (!IMAGE_DIRS.length) {
  die(`В content/${slug} няма нито една папка със снимки.`)
}

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
      const stem = path.basename(name, path.extname(name))
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
  const ext = path.extname(file)
  const stem = path.basename(file, ext)
  return stemsWithManyExts.has(stem) ? `${stem}-${ext.slice(1).toLowerCase()}` : stem
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
  folder: string,
  file: string,
  alt: string,
): Promise<number | null> => {
  const key = `${folder}/${file}`
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
  const order = [folder, ...IMAGE_DIRS.filter((d) => d !== folder)]

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
    console.warn(`  ⚠ липсва файл: ${key} — търсен в: ${order.join(', ')}`)
    return null
  }

  const ext = path.extname(file).toLowerCase()
  if (!MIME[ext]) {
    missingFiles.push(`${key} (непознат вид файл)`)
    console.warn(`  ⚠ непознат вид файл: ${key} — пропуснат`)
    return null
  }

  const real = await sniffFormat(filePath)
  const declared = ext === '.jpeg' ? 'jpg' : ext.slice(1)
  if (real && real !== declared) {
    console.log(`  · ${file}: файлът е ${real.toUpperCase()} въпреки разширението — в Медия ще е .${real}`)
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
      console.log(`  · ${file}: оригиналът е върнат непрекодиран (${data.length} B)`)
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

const productIdFor = async (slug: string): Promise<number | null> => {
  if (productIdCache.has(slug)) return productIdCache.get(slug)!
  const found = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    draft: true,
  })
  const id = found.docs[0]?.id ?? null
  productIdCache.set(slug, id)
  ;(id === null ? unlinkedProducts : linkedProducts).push(slug)
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

const categorySlug = content!.produkt.categorySlug as string | undefined
if (!categorySlug) {
  die('В produkt липсва categorySlug.')
}

const categories = await payload.find({
  collection: 'categories',
  where: { slug: { equals: categorySlug } },
  limit: 1,
  depth: 0,
})

if (!categories.docs[0]) {
  const all = await payload.find({ collection: 'categories', depth: 0, pagination: false })
  die(
    `Няма категория с адрес „${categorySlug}".\n  Съществуващи: ` +
      all.docs.map((c) => c.slug).join(', '),
  )
}

const categoryId = categories.docs[0].id

/* ─────────── галерия ─────────── */

console.log('Качване на изображения…')

const galleryEntries = content!.galeriya ?? []
const galleryIds: number[] = []

for (const item of galleryEntries) {
  const id = await mediaIdFor('galeryia', item.file, item.alt ?? '')
  if (id !== null) galleryIds.push(id)
}

if (!galleryIds.length) {
  die('Нито една снимка от галерията не можа да бъде качена — вносът е спрян.')
}

// Първата снимка е основната; останалите отиват в галерията.
const [mainImage, ...restGallery] = galleryIds

/* ─────────── секции ─────────── */

console.log('Подготовка на секциите…')
const sections = (await prepareBlock(content!.sekcii ?? [])) as unknown[]

/* ─────────── продуктът ─────────── */

const {
  categorySlug: _drop,
  compatibleWithSlugs,
  ...productFields
} = content!.produkt as Record<string, unknown>

/* ─────────── съвместимост ─────────── */

/**
 * „Съвместим с": слъгове на категории И на продукти, смесено.
 *
 * Аксесоарът не се слага в подкатегория „за DELTA" — казва с кои серии и
 * модели работи и се появява сам на страницата на серията, в „Свързани
 * продукти" на модела и в панела на менюто.
 */
const compatibleWith: { relationTo: 'categories' | 'products'; value: number }[] = []

for (const slug of Array.isArray(compatibleWithSlugs) ? compatibleWithSlugs : []) {
  if (typeof slug !== 'string') continue

  const кат = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  if (кат.docs[0]) {
    compatibleWith.push({ relationTo: 'categories', value: кат.docs[0].id })
    continue
  }

  const прод = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    draft: true,
  })
  if (прод.docs[0]) {
    compatibleWith.push({ relationTo: 'products', value: прод.docs[0].id })
    continue
  }

  missingFiles.push(`съвместимост: няма категория или продукт „${slug}"`)
  console.warn(`  ⚠ „Съвместим с": няма категория или продукт „${slug}"`)
}

const data = {
  ...productFields,
  category: categoryId,
  image: mainImage,
  gallery: restGallery.map((image) => ({ image })),
  specGroups: content!.specGroups ?? [],
  sections,
  ...(compatibleWith.length ? { compatibleWith } : {}),
} as Record<string, unknown>

const existingProduct = await payload.find({
  collection: 'products',
  where: { slug: { equals: content!.produkt.slug as string } },
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
let action: string

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
let publishError: string | null = null

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
  const ownSlug = content!.produkt.slug as string
  if (unlinkedProducts.includes(ownSlug)) {
    productIdCache.delete(ownSlug)
    unlinkedProducts.splice(unlinkedProducts.indexOf(ownSlug), 1)
    const relinked = (await prepareBlock(content!.sekcii ?? [])) as unknown[]
    await payload.update({
      collection: 'products',
      id: created.id,
      data: { sections: relinked } as never,
      draft: true,
      depth: 0,
    })
  }
}

/* ─────────── обобщение ─────────── */

console.log('')
console.log(`✓ Качени нови изображения: ${uploadedNew} (пропуснати вече съществуващи: ${reusedExisting})`)
console.log(`✓ Продукт: ${content!.produkt.title} — ${action}`)
if (publishError) console.log(`  ✗ ${publishError.split('\n')[0]}`)
console.log(`✓ Галерия: ${galleryIds.length} снимки (първата е основната)`)
console.log(`✓ Спецификации: ${(content!.specGroups ?? []).length} групи`)
console.log(`✓ Секции: ${sections.length}`)
if (linkedProducts.length) {
  console.log(`✓ Сравнителна таблица: колони, вързани към продукт — ${linkedProducts.join(', ')}`)
}
if (unlinkedProducts.length) {
  console.log(`  · колони без продукт в каталога (остават с ръчното име): ${unlinkedProducts.join(', ')}`)
}

if (missingFiles.length) {
  console.log(`⚠ Липсващи файлове: ${missingFiles.length} — ${missingFiles.join(', ')}`)
}

console.log('')
if (action === 'обновен и публикуван') {
  /*
    Кешът на четенията живее в работещия сървър и скриптът не може да го
    изчисти отвътре (виж CLAUDE.md, т. 14). Затова моли сървъра да го
    направи през собствен път на колекцията. Ако сървър не работи — няма
    какво да се опреснява; следващият старт или билд чете базата наново.
  */
  const server = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  try {
    const r = await fetch(`${server}/api/products/revalidate`, {
      method: 'POST',
      headers: { 'x-revalidate-key': process.env.PAYLOAD_SECRET ?? '' },
      signal: AbortSignal.timeout(5000),
    })
    console.log(
      r.ok
        ? `Продуктът е публикуван; кешът на сървъра (${server}) е опреснен — сайтът показва новото веднага.`
        : `Продуктът е публикуван, но сървърът ${server} отказа опресняване (${r.status}). Промяната ще се види след рестарт или билд.`,
    )
  } catch {
    console.log(`Продуктът е публикуван. Сървър на ${server} не отговаря — промяната ще се види при следващия старт или билд.`)
  }
} else {
  console.log('Продуктът е ЧЕРНОВА и още не се вижда на сайта.')
  console.log('Отворете го в админа, прегледайте го и натиснете „Публикувай".')
}
console.log('')

process.exit(0)
