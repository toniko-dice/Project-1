/**
 * Стойностите на атрибутите от `content/atributi.json`.
 *
 * Пуска се с:  npm run import:attributes
 *              npm run import:attributes -- --force   (презаписва)
 *
 * Форматът:
 *   { "produkti": { "<slug на продукт>": { "<slug на атрибут>": [стойности] } } }
 *
 * ПОПЪЛВА САМО ПРАЗНИТЕ. Продукт, който вече има поне един атрибут, се
 * прескача — стойностите му може да са поправени от админа и вносът не
 * бива да ги връща. `--force` презаписва всичко от файла.
 *
 * Не спира при грешка: непознат продукт или атрибут, нечислова стойност
 * на числов атрибут — предупреждение и продължава. Атрибут, който не е за
 * категориите на продукта, се записва с предупреждение (филтърът в
 * категорията няма да го покаже, докато не се добави категорията).
 *
 * `import:all` НЕ пипа атрибутите — те са само тук.
 *
 * Пише през Payload, затова версиите и куките работят както от админа.
 * Накрая опреснява кеша на сървъра (`/api/products/revalidate`).
 */
import config from '@payload-config'
import fs from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'

import { revalidateServer } from './import-product-core'
import { normalizeNumber } from './lib/attributes'

const FILE = path.join(process.cwd(), 'content', 'atributi.json')
const force = process.argv.includes('--force')

const payload = await getPayload({ config })

let json: { produkti?: Record<string, Record<string, unknown[]>> }
try {
  json = JSON.parse(await fs.readFile(FILE, 'utf-8'))
} catch (err) {
  console.error(`Не мога да прочета content/atributi.json: ${(err as Error).message}`)
  process.exit(1)
}

const номер = (v: unknown) =>
  typeof v === 'number' ? v : ((v as { id?: number } | null)?.id ?? null)

const атрибути = await payload.find({ collection: 'attributes', pagination: false, depth: 0 })
const атрибутПоSlug = new Map(атрибути.docs.map((a) => [a.slug, a]))

const продукти = Object.entries(json.produkti ?? {})
const попълнени: string[] = []
const прескочени: string[] = []
const предупреждения: string[] = []
const грешки: string[] = []

for (const [slug, стойности] of продукти) {
  const намерен = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    draft: true,
    select: { slug: true, categories: true, attributes: true, _status: true },
  })
  const продукт = намерен.docs[0]
  if (!продукт) {
    предупреждения.push(`${slug}: няма такъв продукт`)
    continue
  }
  if ((продукт.attributes ?? []).length && !force) {
    прескочени.push(slug)
    continue
  }

  const категории = new Set((продукт.categories ?? []).map(номер))
  const редове: { attribute: number; value: string }[] = []
  for (const [атрSlug, списък] of Object.entries(стойности ?? {})) {
    const атрибут = атрибутПоSlug.get(атрSlug)
    if (!атрибут) {
      предупреждения.push(`${slug}: няма атрибут „${атрSlug}"`)
      continue
    }
    if (!(атрибут.categories ?? []).some((c) => категории.has(номер(c)))) {
      предупреждения.push(
        `${slug}: „${атрSlug}" не е за категориите на продукта — записан, но филтърът няма да го покаже`,
      )
    }
    for (const сурова of Array.isArray(списък) ? списък : [списък]) {
      const стойност =
        атрибут.type === 'number' ? normalizeNumber(сурова) : String(сурова ?? '').trim() || null
      if (стойност === null) {
        предупреждения.push(`${slug}: „${атрSlug}" = ${JSON.stringify(сурова)} не е ${атрибут.type === 'number' ? 'число' : 'текст'} — прескочено`)
        continue
      }
      редове.push({ attribute: атрибут.id, value: стойност })
    }
  }
  if (!редове.length) {
    предупреждения.push(`${slug}: нито една валидна стойност — нищо не е записано`)
    continue
  }

  /*
    Чернова остава чернова. Публикуван продукт с НЕПУБЛИКУВАНИ промени
    (последната версия е чернова) също се записва като чернова: запис с
    публикуване би извадил на сайта и чуждите недовършени промени,
    защото Payload стъпва на последната версия (т. 17).
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
    предупреждения.push(`${slug}: има непубликувани промени — атрибутите са записани в черновата`)
  }

  try {
    await payload.update({
      collection: 'products',
      id: продукт.id,
      data: { attributes: редове },
      draft: чернова,
      depth: 0,
    })
    попълнени.push(`${slug} (${редове.length})`)
  } catch (err) {
    // Една грешка не спира останалите; изписва се накрая.
    грешки.push(`${slug}: ${(err as Error).message}`)
  }
}

console.log(`\nАТРИБУТИ — content/atributi.json${force ? ' (--force: презаписване)' : ''}`)
console.log(`Попълнени: ${попълнени.length}${попълнени.length ? ` — ${попълнени.join(', ')}` : ''}`)
console.log(
  `Пропуснати (вече имат атрибути): ${прескочени.length}${прескочени.length ? ` — ${прескочени.join(', ')}` : ''}`,
)
if (предупреждения.length) {
  console.log(`Предупреждения: ${предупреждения.length}`)
  for (const p of предупреждения) console.log(`  ⚠ ${p}`)
} else {
  console.log('Предупреждения: 0')
}
if (грешки.length) {
  console.log(`Грешки: ${грешки.length}`)
  for (const g of грешки) console.log(`  ✗ ${g}`)
}

if (попълнени.length) console.log(await revalidateServer())
process.exit(грешки.length ? 1 : 0)
