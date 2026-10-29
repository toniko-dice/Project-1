/**
 * Еднократно (`task-dokumenti.md`, етап 3) — линк „Документи" → /dokumenti във
 * футъра, в колона „Поддръжка", веднага след „Ръководства" (ако „Ръководства"
 * го няма — в края на колоната). Друго не пипа; сравнява преди и след.
 * Повторяем (вече има линк към /dokumenti → без промяна). Архив преди записа.
 *
 *   npm run futar:dokumenti [-- --dry-run]
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { DOCUMENTS_PATH } from './lib/documents'
import { createBackup } from './lib/backup'
import { revalidateServer } from './import-product-core'

type Link = { id?: string | null; label?: string | null; url?: string | null }
type Column = { id?: string | null; heading?: string | null; links?: Link[] | null }

const dryRun = process.argv.includes('--dry-run')
const payload = await getPayload({ config })
const log = (m: string) => console.log(m)
const чисто = (x: unknown) => JSON.stringify(x).replace(/"id":"[^"]*",?/g, '')

const footer = (await payload.findGlobal({ slug: 'footer', depth: 0 })) as unknown as { columns?: Column[] | null } & Record<string, unknown>
const columns = structuredClone(footer.columns ?? []) as Column[]
if (columns.some((c) => (c.links ?? []).some((l) => l.url === DOCUMENTS_PATH))) {
  log('без промяна — във футъра вече има линк към /dokumenti')
  process.exit(0)
}
const i = columns.findIndex((c) => c.heading?.trim() === 'Поддръжка')
if (i < 0) throw new Error('няма колона „Поддръжка" във футъра — спирам, нищо не е записано')
const links = columns[i]!.links ?? []
const след = links.findIndex((l) => /^Ръководства/.test(l.label?.trim() ?? ''))
const нов: Link = { label: 'Документи', url: DOCUMENTS_PATH }
links.splice(след >= 0 ? след + 1 : links.length, 0, нов)
columns[i]!.links = links
log(`• „Поддръжка": ${links.map((l) => l.label).join(' · ')}`)
if (dryRun) process.exit(0)

if (String(process.env.DATABASE_URI ?? '').includes('tmp-')) log('копие на базата — без архив')
else {
  const { doc } = await createBackup(payload, { label: 'Преди линка „Документи" във футъра', trigger: 'ръчно' })
  log(`Архив: „${doc.label}" (№ ${doc.id})`)
}
const сега = (await payload.updateGlobal({ slug: 'footer', data: { columns } as never, depth: 0 })) as unknown as typeof footer
const { columns: _a, updatedAt: _b, ...остПреди } = footer
const { columns: _c, updatedAt: _d, ...остСлед } = сега
if (чисто(остПреди) !== чисто(остСлед)) throw new Error('друго поле на футъра се промени')
const колониСлед = (сега.columns ?? []) as Column[]
footer.columns?.forEach((c, j) => {
  if (j !== i && чисто(c) !== чисто(колониСлед[j])) throw new Error(`колона „${c.heading}" се промени`)
})
log('✓ футърът: „Документи" в „Поддръжка"')
log(await revalidateServer())
process.exit(0)
