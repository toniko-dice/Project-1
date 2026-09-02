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
 * Скриптът е ПОВТОРЯЕМ. Второ пускане обновява продукта и преизползва вече
 * качените снимки — не трупа дубликати.
 *
 * Продуктът се създава като ЧЕРНОВА. Излиза на сайта чак след като
 * собственикът натисне „Публикувай".
 */
import config from '@payload-config'
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
  folder: 'galeryia' | 'sekcii',
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
  const stem = path.basename(file, path.extname(file))

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
    Търси се и в двете папки.

    Секция може да сочи към снимка от галерията — например колона в
    сравнителната таблица показва продукта. Търсене само в подадената
    папка би я обявило за липсваща.
  */
  let filePath = path.join(ROOT, folder, file)
  if (!(await exists(filePath))) {
    const other = folder === 'sekcii' ? 'galeryia' : 'sekcii'
    const alt2 = path.join(ROOT, other, file)
    if (await exists(alt2)) {
      filePath = alt2
    } else {
      // Една липсваща снимка не бива да спира целия внос.
      missingFiles.push(key)
      console.warn(`  ⚠ липсва файл: ${key} — полето остава празно`)
      return null
    }
  }

  const ext = path.extname(file).toLowerCase()
  if (!MIME[ext]) {
    missingFiles.push(`${key} (непознат вид файл)`)
    console.warn(`  ⚠ непознат вид файл: ${key} — пропуснат`)
    return null
  }

  const doc = await payload.create({
    collection: 'media',
    data: { alt: alt || file },
    filePath,
  })

  uploadedNew += 1
  uploadedCache.set(key, doc.id)
  return doc.id
}

/* ─────────── секции ─────────── */

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
    return Promise.all(node.map((n) => prepareBlock(n, altHint)))
  }

  if (!node || typeof node !== 'object') return node

  const source = node as Card
  const out: Card = {}
  const alt = typeof source.imageAlt === 'string' ? source.imageAlt : altHint

  for (const [key, value] of Object.entries(source)) {
    if (key.startsWith('_')) continue // бележки за хора
    if (key === 'imageAlt') continue // отива като alt в Медия

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

const { categorySlug: _drop, ...productFields } = content!.produkt as Record<string, unknown>

const data = {
  ...productFields,
  category: categoryId,
  image: mainImage,
  gallery: restGallery.map((image) => ({ image })),
  specGroups: content!.specGroups ?? [],
  sections,
  _status: 'draft',
} as Record<string, unknown>

const existingProduct = await payload.find({
  collection: 'products',
  where: { slug: { equals: content!.produkt.slug as string } },
  limit: 1,
  depth: 0,
})

let action: 'създаден' | 'обновен'

if (existingProduct.docs[0]) {
  await payload.update({
    collection: 'products',
    id: existingProduct.docs[0].id,
    data,
    draft: true,
  })
  action = 'обновен'
} else {
  await payload.create({ collection: 'products', data, draft: true })
  action = 'създаден'
}

/* ─────────── обобщение ─────────── */

console.log('')
console.log(`✓ Качени нови изображения: ${uploadedNew} (пропуснати вече съществуващи: ${reusedExisting})`)
console.log(`✓ Продукт: ${content!.produkt.title} (${action}, чернова)`)
console.log(`✓ Галерия: ${galleryIds.length} снимки (първата е основната)`)
console.log(`✓ Спецификации: ${(content!.specGroups ?? []).length} групи`)
console.log(`✓ Секции: ${sections.length}`)

if (missingFiles.length) {
  console.log(`⚠ Липсващи файлове: ${missingFiles.length} — ${missingFiles.join(', ')}`)
}

console.log('')
console.log('Продуктът е ЧЕРНОВА и още не се вижда на сайта.')
console.log('Отворете го в админа, прегледайте го и натиснете „Публикувай".')
console.log('')

process.exit(0)
