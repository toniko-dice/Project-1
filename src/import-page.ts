/**
 * Внос на страница от `content/stranici/<slug>/sadarzhanie.json`
 * (`task-stranica-portativni-elektrocentrali.md`, т. 2).
 *
 *   npm run import:page <slug>                 запис + публикуване + опресняване
 *   npm run import:page <slug> -- --dry-run    само какво би направил
 *   npm run import:page <slug> -- --no-download
 *
 * Файлът има три части:
 * - `stranica` — title, slug, metaTitle, metaDescription, metaImage;
 * - `sekcii` — блоковете по ред (`blockType` + полетата на блока);
 * - `_svali_snimki` — `[{url, file}]`, както при продуктите.
 *
 * Връзките са по slug: `product` (и `products[].product` в таблицата с
 * времената) — продукт; `fromCategory` и `tabs[].category` („Форма за
 * оферта") — категория. Ненамереният се
 * изписва; колоната на таблицата без продукт отпада заедно със
 * стойностите си, за да не се разместят останалите.
 *
 * Снимките минават по реда на продуктовия внос: `content/snimki/` (PNG
 * първо) → папката на страницата → `content/_originali/` → Медия → сваляне.
 * Вече качената се ползва; подменя се само от `content/snimki/` и само
 * ако байтовете се различават (`replaceMediaContent` — общата подмяна).
 *
 * Повторното пускане обновява СЪЩАТА страница (по slug) — секциите се
 * записват наново изцяло. Страницата излиза публикувана; ако
 * публикуването не мине проверките, остава чернова и се изписва защо.
 */
import config from '@payload-config'
import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import fs from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'

import {
  bareStem,
  CONTENT_ROOT,
  downloadFile,
  exists,
  MIME,
  mediaFileStem,
  ORIGINALI_DIR,
  replaceMediaContent,
  revalidateServer,
  sameStemIgnoringCase,
  SNIMKI_DIR,
  sniffFormat,
} from './import-product-core'
import { createBackup } from './lib/backup'
import { адресиЗаСваляне } from './lib/snimki-sadarzhanie'

const die = (message: string): never => {
  console.error(`\n✗ ${message}\n`)
  process.exit(1)
}

const slug = process.argv
  .slice(2)
  .find((a) => !a.endsWith('.ts') && !a.endsWith('.js') && a !== 'run' && !a.startsWith('-'))
if (!slug) die('Липсва адрес на страницата.\n  Пример: npm run import:page rakovodstvo-portativni-elektrocentrali')

const dryRun = process.argv.includes('--dry-run')
const noDownload = process.argv.includes('--no-download')

type Обект = Record<string, unknown>
type Съдържание = {
  stranica?: Обект
  sekcii?: Обект[]
  _svali_snimki?: unknown
}

const ROOT = path.join(CONTENT_ROOT, 'stranici', slug!)
const JSON_FILE = path.join(ROOT, 'sadarzhanie.json')
if (!(await exists(JSON_FILE))) die(`Липсва файлът content/stranici/${slug}/sadarzhanie.json`)

let content: Съдържание = {}
try {
  content = JSON.parse(await fs.readFile(JSON_FILE, 'utf-8')) as Съдържание
} catch (e) {
  die(`sadarzhanie.json не е валиден JSON:\n  ${(e as Error).message}`)
}
const стр = content.stranica ?? {}
if (стр.slug !== slug) die(`stranica.slug („${String(стр.slug)}") не съвпада с папката („${slug}").`)
if (!Array.isArray(content.sekcii) || !content.sekcii.length) die('В sadarzhanie.json няма секции (sekcii).')

const payload = await getPayload({ config })
// Markdown → rich text, както при текстовете на категориите (`import:seo`).
const editorConfig = await editorConfigFactory.default({ config: payload.config })
const log = (m: string) => console.log(m)
const предупреждения: string[] = []
const DRY_ID = -1

/* ─────────── снимки ─────────── */

type Карти = { поИме: Map<string, string>; поОснова: Map<string, string> }
const прочетиПапка = async (dir: string, карти: Карти = { поИме: new Map(), поОснова: new Map() }) => {
  try {
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (dir === ROOT) await прочетиПапка(path.join(dir, e.name), карти)
        continue
      }
      if (!path.extname(e.name)) continue
      const пълен = path.join(dir, e.name)
      if (!карти.поИме.has(e.name)) карти.поИме.set(e.name, пълен)
      const stem = bareStem(e.name)
      if (!карти.поОснова.has(stem)) карти.поОснова.set(stem, пълен)
    }
  } catch {
    // Папката още я няма — нормално.
  }
  return карти
}
const преведени = await прочетиПапка(SNIMKI_DIR)
const вПапката = await прочетиПапка(ROOT)
const оригинали = await прочетиПапка(ORIGINALI_DIR)

type Източник = 'snimki' | 'папка' | 'оригинали'
/** Същият ред като при продуктите: преведеният печели винаги, PNG пред другите. */
const намериЛокално = (file: string): { path: string; source: Източник } | null => {
  const stem = bareStem(file)
  const преведен =
    преведени.поИме.get(`${stem}.png`) ?? преведени.поИме.get(file) ?? преведени.поОснова.get(stem)
  if (преведен) return { path: преведен, source: 'snimki' }
  const редът: [Карти, Източник][] = [
    [вПапката, 'папка'],
    [оригинали, 'оригинали'],
  ]
  for (const [к, source] of редът) {
    const p = к.поИме.get(file)
    if (p) return { path: p, source }
  }
  for (const [к, source] of редът) {
    const p = к.поОснова.get(stem)
    if (p) return { path: p, source }
  }
  return null
}

/** Полетата със снимка — на всяко ниво (секция, слайд, таб, отличие, цитат). */
const SNIMKA_KLYUCHOVE = ['image', 'imageMobile', 'mapImage', 'mapImageMobile']

/** Имената на всички снимки в секциите и мета снимката. */
const нужни = new Set<string>()
const събери = (node: unknown): void => {
  if (Array.isArray(node)) return node.forEach(събери)
  if (!node || typeof node !== 'object') return
  for (const [k, v] of Object.entries(node)) {
    if (SNIMKA_KLYUCHOVE.includes(k) && typeof v === 'string' && v.trim()) нужни.add(v)
    else събери(v)
  }
}
събери(content.sekcii)
if (typeof стр.metaImage === 'string' && стр.metaImage.trim()) нужни.add(стр.metaImage)

const адреси = new Map(адресиЗаСваляне(content._svali_snimki as never).map((a) => [a.file, a.url]))
const щеСеСвалят = new Set<string>()
const несвалени: string[] = []

if (!noDownload) {
  const липсващи = [...нужни].filter((f) => !намериЛокално(f) && адреси.has(f))
  for (const file of липсващи) {
    if (dryRun) {
      щеСеСвалят.add(file)
      log(`  ↓ би се свалил: ${file}`)
      continue
    }
    const dest = path.join(ORIGINALI_DIR, file)
    try {
      await downloadFile(адреси.get(file)!, dest)
      оригинали.поИме.set(file, dest)
      оригинали.поОснова.set(bareStem(file), dest)
      log(`  ↓ свален: ${file}`)
    } catch (e) {
      несвалени.push(`${file} (${(e as Error).message})`)
      log(`  ⚠ не се свали: ${file} — ${(e as Error).message}`)
    }
  }
}

/* Архив преди истинския запис — снимка от `content/snimki/` може да подмени качена. */
if (!dryRun) {
  try {
    const { doc } = await createBackup(payload, { label: `Преди внос на страница ${slug} (import:page)`, trigger: 'ръчно' })
    log(`Архив преди вноса: „${doc.label}" (№ ${doc.id})`)
  } catch (e) {
    die(`Архивът не се направи: ${(e as Error).message}\n  Вносът е спрян.`)
  }
}

const снимки = new Map<string, number | null>()
const отчетСнимки: string[] = []

const mediaIdFor = async (file: string, alt: string): Promise<number | null> => {
  if (снимки.has(file)) return снимки.get(file)!
  const stem = bareStem(file)
  const match = (await sameStemIgnoringCase(payload, stem)).find(
    (d) => d.filename && mediaFileStem(d.filename) === stem,
  )
  const локален = намериЛокално(file)

  const запомни = (id: number | null, ред: string) => {
    снимки.set(file, id)
    отчетСнимки.push(`${file} — ${ред}`)
    return id
  }

  if (!локален) {
    if (match) return запомни(match.id, `Медия № ${match.id}`)
    if (щеСеСвалят.has(file)) return запомни(DRY_ID, 'ще се свали и качи')
    предупреждения.push(`снимка ${file}: няма я нито локално, нито в Медия`)
    return запомни(null, 'ЛИПСВА')
  }

  const real = await sniffFormat(локален.path)
  const realExt = real ? `.${real}` : path.extname(локален.path).toLowerCase()
  if (!MIME[realExt]) {
    предупреждения.push(`снимка ${file}: непознат вид файл`)
    return запомни(null, 'непознат вид')
  }
  const данни = await fs.readFile(локален.path)

  if (match) {
    let еднакви = локален.source !== 'snimki'
    if (!еднакви) {
      try {
        еднакви = (await fs.readFile(path.resolve(process.cwd(), 'media', match.filename!))).equals(данни)
      } catch {
        еднакви = false
      }
    }
    if (еднакви) return запомни(match.id, `Медия № ${match.id} (${локален.source})`)
    if (dryRun) return запомни(match.id, `ще подмени Медия № ${match.id} от content/snimki/`)
    const успя = await replaceMediaContent(payload, log, match as never, данни, realExt, file, alt)
    return запомни(match.id, успя ? `ПОДМЕНЕНА Медия № ${match.id} от content/snimki/` : `Медия № ${match.id} (подмяната не мина)`)
  }

  if (dryRun) return запомни(DRY_ID, `ще се качи (${локален.source})`)

  const doc = await payload.create({
    collection: 'media',
    data: { alt: alt || file },
    file: { data: данни, name: `${stem}${realExt}`, mimetype: MIME[realExt]!, size: данни.length },
  })
  /*
    Payload прекодира WebP/AVIF/GIF безусловно (CLAUDE.md, „Оригиналът в
    Медия"). Оригиналните байтове се връщат върху записания файл.
  */
  if (doc.filename && path.extname(doc.filename).toLowerCase() === realExt) {
    const записан = path.resolve(process.cwd(), 'media', doc.filename)
    if (!(await fs.readFile(записан)).equals(данни)) {
      await fs.writeFile(записан, данни)
      await payload.update({ collection: 'media', id: doc.id, data: { filesize: данни.length }, depth: 0 })
    }
  }
  return запомни(doc.id, `качена като № ${doc.id} (${локален.source})`)
}

/* ─────────── връзки по slug ─────────── */

const продукти = new Map<string, number | null>()
const productIdFor = async (s: string): Promise<number | null> => {
  if (продукти.has(s)) return продукти.get(s)!
  const r = await payload.find({
    collection: 'products',
    where: { slug: { equals: s } },
    limit: 1,
    depth: 0,
    draft: true,
    select: { slug: true, _status: true },
  })
  const doc = r.docs[0]
  if (!doc) предупреждения.push(`продукт „${s}": няма такъв`)
  else if (doc._status !== 'published') предупреждения.push(`продукт „${s}": чернова — няма да се вижда, докато не бъде публикуван`)
  продукти.set(s, doc?.id ?? null)
  return doc?.id ?? null
}

const categoryIdFor = async (s: string): Promise<number | null> => {
  const r = await payload.find({ collection: 'categories', where: { slug: { equals: s } }, limit: 1, depth: 0 })
  if (!r.docs[0]) предупреждения.push(`категория „${s}": няма такава`)
  return r.docs[0]?.id ?? null
}

/* ─────────── секциите ─────────── */

const чисто = (o: Обект): Обект => Object.fromEntries(Object.entries(o).filter(([k]) => !k.startsWith('_')))

const снимкаНа = async (o: Обект, alt: string): Promise<Обект> => {
  const out: Обект = { ...o }
  for (const k of SNIMKA_KLYUCHOVE) {
    if (typeof o[k] === 'string') out[k] = o[k] ? await mediaIdFor(o[k] as string, alt) : null
  }
  return out
}

/*
  Позициите на офисите върху картата на EcoFlow (`za-ecoflow-karta-ofisi`,
  1440×950; мобилната е същата карта в по-малък размер) — в проценти, по
  надписите на ecoflow.com/eu/about-us.
*/
const MESTA_NA_KARTATA: Record<string, [number, number]> = {
  САЩ: [13.5, 41.5],
  Германия: [57.5, 46.5],
  Япония: [88, 54],
}

const layout: Обект[] = []
const редове: string[] = []

for (const [i, суров] of content.sekcii!.entries()) {
  let b = чисто(суров)
  const вид = String(b.blockType ?? '')
  const alt = String(b.imageAlt ?? b.heading ?? '')
  b = await снимкаНа(b, alt)

  if (вид === 'contentSlider') {
    b.slides = await Promise.all(
      ((b.slides as Обект[]) ?? []).map((s) => снимкаНа(чисто(s), String(s.imageAlt ?? s.label ?? ''))),
    )
  }

  if (typeof b.product === 'string') b.product = await productIdFor(b.product)

  // „Лента с отличия", „Цитати от медии" — снимка на всеки елемент.
  if (вид === 'awardsMarquee' || вид === 'pressQuotes') {
    b.items = await Promise.all(
      ((b.items as Обект[]) ?? []).map((it) => снимкаНа(чисто(it), String(it.title ?? it.source ?? ''))),
    )
  }

  // „Табове с продукти": снимката на банера и продуктите по slug (ненамереният отпада).
  if (вид === 'productTabs') {
    b.tabs = await Promise.all(
      ((b.tabs as Обект[]) ?? []).map(async (t) => {
        const tab = await снимкаНа(чисто(t), String(t.imageAlt ?? t.heading ?? ''))
        const редове = await Promise.all(
          ((t.products as Обект[]) ?? []).map(async (r) => ({ ...чисто(r), product: await productIdFor(String(r.product ?? '')) })),
        )
        tab.products = редове.filter((r) => r.product !== null)
        return tab
      }),
    )
  }

  // „История и числа": местата могат да са само имена — позицията идва от таблицата.
  if (вид === 'companyStats') {
    b.locations = ((b.locations as unknown[]) ?? []).map((l) => {
      if (l && typeof l === 'object') return l
      const име = String(l)
      const място = MESTA_NA_KARTATA[име]
      if (!място) предупреждения.push(`място „${име}" на картата: няма позиция — попълнете я от админа`)
      return { label: име, x: място?.[0] ?? null, y: място?.[1] ?? null }
    })
  }

  // „Заглавна снимка" без снимка (`variant: simple`) — само H1 и абзац: това е „Заглавие на страницата (H1)".
  if (вид === 'pageHero' && b.variant === 'simple') {
    b = { blockType: 'pageIntro', heading: b.heading, body: b.body }
  }

  // „Текст": Markdown (`##` → H2, `**` → удебелено, `- ` → списък) → rich text.
  if (вид === 'richText' && typeof b.markdown === 'string') {
    b.content = convertMarkdownToLexical({ editorConfig, markdown: b.markdown })
    delete b.markdown
  }

  // „Таблица": колони и клетки като прости низове във файла.
  if (вид === 'simpleTable') {
    b.columns = ((b.columns as unknown[]) ?? []).map((c) => ({ label: String(c) }))
    b.rows = ((b.rows as Обект[]) ?? []).map((r) => ({
      cells: ((r.cells as unknown[]) ?? []).map((v) => ({ value: String(v) })),
    }))
  }

  // „Форма за оферта": табовете — надпис + категория по slug.
  if (вид === 'quoteForm') {
    b.tabs = await Promise.all(
      ((b.tabs as Обект[]) ?? []).map(async (t) => ({
        label: t.label,
        category: typeof t.category === 'string' ? await categoryIdFor(t.category) : null,
      })),
    )
  }

  if (typeof b.fromCategory === 'string') {
    b.fromCategory = await categoryIdFor(b.fromCategory)
    b.products = []
  }

  if (вид === 'runtimeCompare') {
    const колони = (b.products as Обект[]) ?? []
    const ids = await Promise.all(колони.map((c) => productIdFor(String(c.product ?? ''))))
    const остават = ids.map((id, n) => (id !== null ? n : -1)).filter((n) => n >= 0)
    if (остават.length !== колони.length) {
      предупреждения.push(`секция ${i + 1} (таблица): ${колони.length - остават.length} колони без продукт отпадат заедно със стойностите си`)
    }
    b.products = остават.map((n) => ({ ...чисто(колони[n]!), product: ids[n] }))
    b.rows = ((b.rows as Обект[]) ?? []).map((r) => {
      const стойности = (r.values as unknown[]) ?? []
      if (стойности.length !== колони.length) {
        предупреждения.push(`секция ${i + 1}, ред „${String(r.label)}": ${стойности.length} стойности за ${колони.length} колони`)
      }
      return { label: r.label, values: остават.map((n) => ({ value: String(стойности[n] ?? '') })) }
    })
  }

  layout.push(b)
  const име = b.heading ?? b.sectionTitle ?? b.anchorLabel ?? ''
  редове.push(`${String(i + 1).padStart(2)}. ${вид}${име ? ` — ${String(име).slice(0, 60)}` : ''}${b.anchorLabel ? ` [котва: ${b.anchorLabel}]` : ''}`)
}

const metaImage =
  typeof стр.metaImage === 'string' && стр.metaImage ? await mediaIdFor(стр.metaImage, String(стр.title ?? '')) : null

/* ─────────── запис ─────────── */

const съществуваща = (
  await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1, depth: 0, draft: true })
).docs[0]

const data = {
  title: String(стр.title ?? slug),
  slug: slug!,
  metaTitle: (стр.metaTitle as string) ?? null,
  metaDescription: (стр.metaDescription as string) ?? null,
  metaImage,
  layout,
} as Обект

log(`\nСТРАНИЦА /${slug}${dryRun ? ' — ПРОВЕРКА, нищо не е записано' : ''}`)
log(`  ${съществуваща ? `съществува (№ ${съществуваща.id}) — ще се обнови` : 'нова — ще се създаде'}`)
log(`  заглавие: ${data.title}`)
log(`  мета заглавие: ${data.metaTitle} (${String(data.metaTitle ?? '').length} знака)`)
log(`  мета описание: ${String(data.metaDescription ?? '').length} знака`)
log(`\nСЕКЦИИ (${layout.length})`)
for (const р of редове) log(`  ${р}`)
log(`\nСНИМКИ (${отчетСнимки.length})`)
for (const р of отчетСнимки) log(`  ${р}`)
if (несвалени.length) {
  log(`\nНЕСВАЛЕНИ (${несвалени.length})`)
  for (const н of несвалени) log(`  ⚠ ${н}`)
}
if (предупреждения.length) {
  log(`\nПредупреждения (${предупреждения.length}):`)
  for (const п of предупреждения) log(`  ⚠ ${п}`)
}

if (dryRun) {
  log(`\nБи ${съществуваща ? 'обновил' : 'създал'} и публикувал страницата.`)
  process.exit(0)
}

let резултат = ''
try {
  const doc = съществуваща
    ? await payload.update({ collection: 'pages', id: съществуваща.id, data: { ...data, _status: 'published' }, depth: 0 })
    : await payload.create({ collection: 'pages', data: { ...data, _status: 'published' } as never, depth: 0 })
  резултат = `${съществуваща ? 'обновена' : 'създадена'} и публикувана (№ ${doc.id})`
} catch (e) {
  /* Публикуването не мина проверките — записва се чернова, публикуваната (ако има) остава. */
  const причина = (e as Error).message
  const doc = съществуваща
    ? await payload.update({ collection: 'pages', id: съществуваща.id, data, draft: true, depth: 0 })
    : await payload.create({ collection: 'pages', data: data as never, draft: true, depth: 0 })
  резултат = `записана като ЧЕРНОВА (№ ${doc.id}) — публикуването не мина: ${причина}`
}

log(`\nСтраницата е ${резултат}.`)
log(await revalidateServer())
process.exit(0)
