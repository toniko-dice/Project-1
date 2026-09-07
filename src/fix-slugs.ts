/**
 * Еднократно почистване на вече записаните адреси.
 *
 * Пуска се с:  payload run src/fix-slugs.ts
 *
 * Hook-ът на полето „URL адрес" действа при следващ запис, не назад.
 * Записите, въведени преди него, остават както са. Този скрипт минава
 * през тях и прилага същото правило.
 *
 * Записва САМО променените. Ако всичко е чисто, не пипа нищо.
 *
 * ВНИМАНИЕ: смяната на адрес чупи външните линкове към стария. Ако някой
 * вече е споделял адреса, ще му дава 404.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { cleanSlug } from './lib/slug'

const payload = await getPayload({ config })

const COLLECTIONS = ['products', 'categories', 'pages', 'menu-panels'] as const

let changed = 0
let checked = 0
const conflicts: string[] = []

for (const collection of COLLECTIONS) {
  const all = await payload.find({
    collection,
    depth: 0,
    pagination: false,
    // Продуктите и страниците са с чернови — искаме и тях.
    draft: true,
  })

  for (const doc of all.docs) {
    const current = (doc as unknown as Record<string, unknown>).slug
    if (typeof current !== 'string') continue

    checked += 1
    const cleaned = cleanSlug(current)

    if (!cleaned || cleaned === current) continue

    // Адресите са уникални — проверяваме, преди да се блъснем в грешка.
    const taken = await payload.find({
      collection,
      where: { slug: { equals: cleaned } },
      limit: 1,
      depth: 0,
      draft: true,
    })

    if (taken.docs.length && taken.docs[0].id !== doc.id) {
      conflicts.push(`${collection}: „${current}" → „${cleaned}" вече е зает`)
      continue
    }

    await payload.update({
      collection,
      id: doc.id,
      data: { slug: cleaned } as Record<string, unknown>,
    })

    changed += 1
    console.log(`  ${collection}: „${current}" → „${cleaned}"`)
  }
}

console.log('')
console.log(`Проверени адреси: ${checked}`)
console.log(`Променени: ${changed}`)

if (conflicts.length) {
  console.log('')
  console.log('НЕПРОМЕНЕНИ заради съвпадение — оправете ги ръчно:')
  for (const c of conflicts) console.log(`  ${c}`)
}

if (!changed && !conflicts.length) {
  console.log('Всички адреси вече са чисти.')
}

process.exit(0)
