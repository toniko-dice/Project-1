/**
 * Попълва полето `_order` за записи, създадени преди включването на влаченето.
 *
 * Пуска се с:  npm run backfill:order
 *
 * Колоната `_order` се добавя от миграцията, но остава празна за вече
 * съществуващите записи. Без стойност списъкът няма стабилна подредба и
 * влаченето не работи предвидимо. Скриптът присвоява ключове по текущата
 * подредба (по номер на запис), тоест нищо не се разбърква.
 *
 * Повторяем е — пропуска записите, които вече имат ключ.
 */
import path from 'path'
import { pathToFileURL } from 'url'

import config from '@payload-config'
import { getPayload } from 'payload'

/*
  Payload не изнася този модул през „exports" на пакета, затова се зарежда
  по път. Ползваме неговата имплементация, а не собствена, за да са ключовете
  еднакви с тези, които админът генерира при влачене.
*/
const fractionalIndexing = path.resolve(
  process.cwd(),
  'node_modules/payload/dist/config/orderable/fractional-indexing.js',
)

const { generateNKeysBetween } = (await import(pathToFileURL(fractionalIndexing).href)) as {
  generateNKeysBetween: (a: string | null, b: string | null, n: number) => string[]
}

const payload = await getPayload({ config })

const ORDERABLE = [
  'pages',
  'products',
  'categories',
  'menu-panels',
  'testimonials',
  'awards',
] as const

for (const collection of ORDERABLE) {
  const all = await payload.find({
    collection,
    depth: 0,
    sort: 'id',
    pagination: false,
  })

  const missing = all.docs.filter((d) => !(d as unknown as Record<string, unknown>)._order)

  if (!missing.length) {
    console.log(`${collection}: всички ${all.docs.length} записа вече имат подредба`)
    continue
  }

  // Ключовете тръгват от началото — подредбата съвпада с текущата.
  const keys = generateNKeysBetween(null, null, missing.length)

  for (const [i, doc] of missing.entries()) {
    await payload.update({
      collection,
      id: doc.id,
      data: { _order: keys[i] } as Record<string, unknown>,
    })
  }

  console.log(`${collection}: попълнени ${missing.length} от ${all.docs.length}`)
}

console.log('\nГотово.')
process.exit(0)
