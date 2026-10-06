/**
 * Внос на SEO данните (`task-seo-tehnichesko.md`, т. 10 и 13).
 *
 *   npm run import:seo -- --dry-run   таблица: старо → ново (знаци), нищо не се пише
 *   npm run import:seo                запис + опресняване на кеша
 *   npm run import:seo -- --force     и попълнените полета на категориите
 *
 * `content/seo-produkti.json` — `{ produkti: { <slug>: { metaTitle, metaDescription } } }`.
 * Продуктите се ПРЕЗАПИСВАТ (това са поправки) — в базата И в
 * `content/<папка>/sadarzhanie.json`, иначе следващият `import:all` би
 * върнал старите.
 *
 * `content/seo-kategorii.json` — `{ kategorii: { <slug>: { metaTitle,
 * metaDescription, intro, tekst } } }`. Попълват се само ПРАЗНИТЕ полета;
 * `--force` презаписва мета полетата и „Текст под списъка". „Описание"
 * (`intro`) НЕ се презаписва никога — попълненото се изписва в отчета, за
 * да реши собственикът. `tekst` е Markdown → rich text (`##` → H2).
 *
 * Непознат slug — предупреждение, вносът продължава. Преди истинския запис
 * — архив (пипа много записи наведнъж).
 */
import config from '@payload-config'
import {
  convertMarkdownToLexical,
  editorConfigFactory,
} from '@payloadcms/richtext-lexical'
import fs from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'

import { CONTENT_ROOT, productFolders, revalidateServer } from './import-product-core'
import { createBackup } from './lib/backup'
import { катоОригинала } from './lib/snimki-sadarzhanie'
import { finalTitle } from './lib/title'

const dryRun = process.argv.includes('--dry-run')
const force = process.argv.includes('--force')

type SeoProdukt = { metaTitle?: string; metaDescription?: string }
type SeoKategoriya = { metaTitle?: string; metaDescription?: string; intro?: string; tekst?: string }

const payload = await getPayload({ config })

const прочети = async <T>(file: string): Promise<T> =>
  JSON.parse(await fs.readFile(path.join(CONTENT_ROOT, file), 'utf-8')) as T

const продукти = Object.entries((await прочети<{ produkti: Record<string, SeoProdukt> }>('seo-produkti.json')).produkti)
const категории = Object.entries(
  (await прочети<{ kategorii: Record<string, SeoKategoriya> }>('seo-kategorii.json')).kategorii,
)

const предупреждения: string[] = []
const грешки: string[] = []
const редове: string[] = []
const описания: string[] = []
let обновени = 0
let пропуснати = 0

const знаци = (s?: string | null) => (s ? `${s.length}` : '—')
const кратко = (s?: string | null, n = 70) => (!s ? '(празно)' : s.length > n ? `${s.slice(0, n - 1)}…` : s)

if (!dryRun) {
  try {
    const { doc } = await createBackup(payload, { label: 'Преди внос на SEO данните (import:seo)', trigger: 'ръчно' })
    console.log(`Архив преди вноса: „${doc.label}" (№ ${doc.id})\n`)
  } catch (e) {
    console.error(`✗ Архивът не се направи: ${(e as Error).message}\n  Вносът е спрян.`)
    process.exit(1)
  }
}

/* ─────────── продукти ─────────── */

/** Папката на продукта в content/ по `produkt.slug` — името на папката може да е друго. */
const папкаПоSlug = new Map<string, string>()
for (const folder of await productFolders()) {
  try {
    const c = JSON.parse(await fs.readFile(path.join(CONTENT_ROOT, folder, 'sadarzhanie.json'), 'utf-8'))
    if (c?.produkt?.slug) папкаПоSlug.set(String(c.produkt.slug), folder)
  } catch {
    // Негоден JSON — вносът на продукта го докладва.
  }
}

for (const [slug, нови] of продукти) {
  const намерен = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    draft: true,
    select: { slug: true, metaTitle: true, metaDescription: true, _status: true },
  })
  const продукт = намерен.docs[0]
  if (!продукт) {
    предупреждения.push(`продукт „${slug}": няма такъв — прескочен`)
    пропуснати += 1
    continue
  }

  const metaTitle = нови.metaTitle?.trim() || продукт.metaTitle || null
  const metaDescription = нови.metaDescription?.trim() || продукт.metaDescription || null
  const същото = metaTitle === (продукт.metaTitle ?? null) && metaDescription === (продукт.metaDescription ?? null)

  редове.push(
    `${slug} | ${кратко(продукт.metaTitle, 40)} (${знаци(продукт.metaTitle)}) → ${кратко(metaTitle, 60)} (${знаци(metaTitle)}; на сайта ${finalTitle(metaTitle).length})` +
      ` | ${знаци(продукт.metaDescription)} → ${знаци(metaDescription)}${същото ? ' | без промяна' : ''}`,
  )

  /* sadarzhanie.json — и при „без промяна" в базата, за да съвпадат. */
  const folder = папкаПоSlug.get(slug)
  if (!folder) предупреждения.push(`продукт „${slug}": няма папка в content/ — само базата`)
  else if (!dryRun) {
    const файл = path.join(CONTENT_ROOT, folder, 'sadarzhanie.json')
    const оригинал = await fs.readFile(файл, 'utf-8')
    const c = JSON.parse(оригинал)
    if (metaTitle) c.produkt.metaTitle = metaTitle
    if (metaDescription) c.produkt.metaDescription = metaDescription
    const нов = катоОригинала(оригинал, c)
    if (нов !== оригинал) await fs.writeFile(файл, нов, 'utf-8')
  }

  if (същото) {
    пропуснати += 1
    continue
  }
  if (dryRun) {
    обновени += 1
    continue
  }

  /*
    Публикуван продукт с НЕПУБЛИКУВАНИ промени се записва като чернова —
    иначе записът би публикувал и чуждите недовършени промени (т. 17).
  */
  const последна = await payload.findVersions({
    collection: 'products',
    where: { parent: { equals: продукт.id } },
    sort: '-updatedAt',
    limit: 1,
    depth: 0,
    select: { version: { _status: true } } as never,
  })
  const чернова =
    продукт._status === 'draft' ||
    (последна.docs[0]?.version as { _status?: string } | undefined)?._status === 'draft'
  if (чернова && продукт._status !== 'draft') {
    предупреждения.push(`продукт „${slug}": има непубликувани промени — записано в черновата`)
  }
  try {
    await payload.update({
      collection: 'products',
      id: продукт.id,
      data: { metaTitle, metaDescription },
      draft: чернова,
      depth: 0,
    })
    обновени += 1
  } catch (err) {
    грешки.push(`продукт „${slug}": ${(err as Error).message}`)
  }
}

/* ─────────── категории ─────────── */

const editorConfig = await editorConfigFactory.default({ config: payload.config })
const редовеК: string[] = []

for (const [slug, нови] of категории) {
  const намерена = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  const к = намерена.docs[0]
  if (!к) {
    предупреждения.push(`категория „${slug}": няма такава — прескочена`)
    пропуснати += 1
    continue
  }

  const data: Record<string, unknown> = {}
  const промени: string[] = []
  const празно = (v: unknown) => v == null || (typeof v === 'string' && !v.trim())

  for (const поле of ['metaTitle', 'metaDescription'] as const) {
    const нов = нови[поле]?.trim()
    if (!нов || нов === к[поле]) continue
    if (празно(к[поле]) || force) {
      data[поле] = нов
      промени.push(`${поле} ${знаци(к[поле])} → ${нов.length}`)
    } else {
      промени.push(`${поле} попълнено — оставено (--force го презаписва)`)
    }
  }

  /* „Описание" — само ако е празно; никога не се презаписва. */
  const intro = нови.intro?.trim()
  if (intro && intro !== к.description?.trim()) {
    if (празно(к.description)) {
      data.description = intro
      промени.push(`описание → ${intro.length}`)
    } else {
      описания.push(`${slug}:\n    сега:  ${к.description}\n    ново:  ${intro}`)
      промени.push('описание попълнено — оставено (виж отчета)')
    }
  }

  const tekst = нови.tekst?.trim()
  const има = Boolean((к.belowList as { root?: { children?: unknown[] } } | null)?.root?.children?.length)
  if (tekst && (!има || force)) {
    data.belowList = convertMarkdownToLexical({ editorConfig, markdown: tekst })
    промени.push(`текст под списъка → ${tekst.split(/\s+/).length} думи`)
  } else if (tekst && има) {
    промени.push('текст под списъка попълнен — оставен (--force го презаписва)')
  }

  редовеК.push(`${slug} | ${промени.join('; ') || 'без промяна'}`)
  if (!Object.keys(data).length) {
    пропуснати += 1
    continue
  }
  if (dryRun) {
    обновени += 1
    continue
  }
  try {
    await payload.update({ collection: 'categories', id: к.id, data, depth: 0 })
    обновени += 1
  } catch (err) {
    грешки.push(`категория „${slug}": ${(err as Error).message}`)
  }
}

/* ─────────── отчет ─────────── */

console.log(`SEO ДАННИ${dryRun ? ' — ПРОВЕРКА, нищо не е записано' : ''}${force ? ' (--force)' : ''}`)
console.log(`\nПРОДУКТИ (${продукти.length}) — slug | старо → ново заглавие (знаци) | описание: знаци`)
for (const р of редове) console.log(`  ${р}`)
console.log(`\nКАТЕГОРИИ (${категории.length})`)
for (const р of редовеК) console.log(`  ${р}`)
if (описания.length) {
  console.log(`\nОПИСАНИЕ ВЕЧЕ ПОПЪЛНЕНО — не е пипнато, решава собственикът (${описания.length}):`)
  for (const о of описания) console.log(`  ${о}`)
}
if (предупреждения.length) {
  console.log(`\nПредупреждения (${предупреждения.length}):`)
  for (const п of предупреждения) console.log(`  ⚠ ${п}`)
}
if (грешки.length) {
  console.log(`\nГрешки (${грешки.length}):`)
  for (const г of грешки) console.log(`  ✗ ${г}`)
}
console.log(`\n${dryRun ? 'Биха се обновили' : 'Обновени'}: ${обновени} · пропуснати: ${пропуснати}`)
if (!dryRun && обновени) console.log(await revalidateServer())
process.exit(грешки.length ? 1 : 0)
