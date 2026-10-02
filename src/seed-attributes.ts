/**
 * Първоначалните атрибути за филтрите.
 *
 * Пуска се с:  npm run seed:attributes
 *
 * ПОВТОРЯЕМ И НЕ ПИПА СЪЩЕСТВУВАЩИТЕ. Атрибут, чийто slug вече го има, се
 * прескача изцяло — собственикът може да е сменил името, единицата или
 * категориите му от админа. Нищо не се трие.
 *
 * Подредбата на филтрите е редът тук: Payload слага `_order` в края при
 * всяко създаване. После се сменя с влачене.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

type Начален = {
  name: string
  slug: string
  type: 'number' | 'text'
  unit?: string
  categories: string[]
}

const АТРИБУТИ: Начален[] = [
  { name: 'Дължина', slug: 'duljina', type: 'number', unit: 'м', categories: ['kabeli'] },
  { name: 'Конектор', slug: 'konektor', type: 'text', categories: ['kabeli', 'adapteri'] },
  { name: 'Капацитет', slug: 'kapacitet-mah', type: 'number', unit: 'mAh', categories: ['vanshni-baterii'] },
  { name: 'Капацитет', slug: 'kapacitet-wh', type: 'number', unit: 'Wh', categories: ['dopalnitelni-baterii'] },
  {
    name: 'Мощност',
    slug: 'moshtnost',
    type: 'number',
    unit: 'W',
    categories: ['zaryadni-ustroystva', 'vanshni-baterii'],
  },
  {
    name: 'Брой портове',
    slug: 'broy-portove',
    type: 'number',
    categories: ['zaryadni-ustroystva', 'vanshni-baterii'],
  },
  {
    name: 'Вид',
    slug: 'vid',
    type: 'text',
    categories: ['montazh-i-kabeli-za-paneli', 'drugi-aksesoari', 'chanti-i-kalafi'],
  },
]

const payload = await getPayload({ config })

const категории = await payload.find({
  collection: 'categories',
  pagination: false,
  depth: 0,
  select: { slug: true },
})
const поSlug = new Map(категории.docs.map((c) => [c.slug, c.id]))

let създадени = 0
let прескочени = 0
for (const a of АТРИБУТИ) {
  const има = await payload.find({
    collection: 'attributes',
    where: { slug: { equals: a.slug } },
    limit: 1,
    depth: 0,
  })
  if (има.docs.length) {
    console.log(`  · ${a.slug}: вече го има — не се пипа`)
    прескочени += 1
    continue
  }

  const ids = a.categories.flatMap((slug) => {
    const id = поSlug.get(slug)
    if (id === undefined) console.warn(`  ⚠ ${a.slug}: няма категория „${slug}"`)
    return id === undefined ? [] : [id]
  })

  await payload.create({
    collection: 'attributes',
    data: { name: a.name, slug: a.slug, type: a.type, unit: a.unit ?? null, categories: ids },
    depth: 0,
  })
  console.log(`  + ${a.slug}: ${a.name}${a.unit ? ` (${a.unit})` : ''} — ${a.categories.join(', ')}`)
  създадени += 1
}

console.log(`\nАтрибути: ${създадени} създадени, ${прескочени} вече ги имаше.`)
process.exit(0)
