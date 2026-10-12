/**
 * Еднократно (`task-favicon-i-wave-baterija.md`, 12 октомври 2026) —
 * WAVE 2 Add-On Battery излиза от реда с климатиците:
 *
 * - продуктът: „Категории" = [Допълнителни батерии] (без Wave климатици),
 *   както WAVE 3 Add-On Battery; „Съвместим с" остава Wave климатици;
 * - адресът става `/kategorii/dopalnitelni-baterii/wave-2-add-on-battery`;
 *   старият дава 301 — записва го куката на продукта („Пренасочвания"), а
 *   ако не го е записала, скриптът го дописва;
 * - панел „Wave климатици": картата на батерията отпада от първия раздел
 *   (разделът „Аксесоари" се пълни сам и я показва);
 * - панел „Допълнителни батерии": картата се добавя в края, до WAVE 3
 *   батерията (полетата се попълват от продукта при запис).
 *
 * Пипа САМО тези записи; другите раздели на панелите се сравняват преди и
 * след. Публикуван продукт с непубликувани промени → спира. Повторяем.
 * Архив преди записа (без архив върху копие).
 *
 *   npm run wave-2:bateriya [-- --dry-run]
 */
import config from '@payload-config'
import { getPayload, type Where } from 'payload'

import type { MenuPanel } from './payload-types'
import { createBackup } from './lib/backup'
import { productPath } from './lib/urls'
import { revalidateServer } from './import-product-core'

const SLUG = 'wave-2-add-on-battery'
const ПАНЕЛ_WAVE = 'wave-klimatici'
const НОВА = 'dopalnitelni-baterii'
const СТАРА = 'wave-klimatici'

const dryRun = process.argv.includes('--dry-run')
const копие = String(process.env.DATABASE_URI ?? '').includes('tmp-')
const payload = await getPayload({ config })
const log = (m: string) => console.log(m)
const чисто = (x: unknown) => JSON.stringify(x).replace(/"id":"[^"]*",?/g, '')
const номер = (x: unknown) => (x && typeof x === 'object' ? (x as { id: number }).id : (x as number | null))

const категория = async (slug: string) => {
  const c = (await payload.find({ collection: 'categories', where: { slug: { equals: slug } }, depth: 0, limit: 1 })).docs[0]
  if (!c) throw new Error(`няма категория ${slug}`)
  return c
}
const нова = await категория(НОВА)
const стара = await категория(СТАРА)

const продукт = (await payload.find({ collection: 'products', where: { slug: { equals: SLUG } }, depth: 0, draft: true, limit: 1 })).docs[0]
if (!продукт) throw new Error(`няма продукт ${SLUG}`)
const публикуван = await payload.findByID({ collection: 'products', id: продукт.id, depth: 0, draft: false })
if (публикуван._status === 'published' && продукт._status !== 'published') {
  throw new Error('продуктът има непубликувани промени в админа — спирам, записът би ги публикувал')
}

const промени: string[] = []
const категории = (продукт.categories ?? []).map(номер)
const продуктНов = !(категории.length === 1 && категории[0] === нова.id)
if (продуктНов) промени.push(`продукт: „Категории" ${JSON.stringify(категории)} → [${нова.id}] (${НОВА})`)

/* Панелите */
const панел = async (where: Where) =>
  (await payload.find({ collection: 'menu-panels', where, depth: 0, limit: 1 })).docs[0] as MenuPanel | undefined
const wave = await панел({ slug: { equals: ПАНЕЛ_WAVE } })
if (!wave) throw new Error(`няма панел ${ПАНЕЛ_WAVE}`)
const батерии = await панел({ 'sections.viewAllCategory': { equals: нова.id } })
if (!батерии) throw new Error(`няма панел с раздел за ${НОВА}`)

type Раздели = NonNullable<MenuPanel['sections']>
const waveРаздели = structuredClone(wave.sections ?? []) as Раздели
const първи = waveРаздели.find((s) => !s.accessories && номер(s.viewAllCategory) === стара.id)
const сКарта = (първи?.cards ?? []).some((c) => номер(c.product) === продукт.id)
if (първи && сКарта) {
  първи.cards = (първи.cards ?? []).filter((c) => номер(c.product) !== продукт.id)
  промени.push(`панел „${wave.slug}" (№ ${wave.id}): картата махната от първия раздел`)
}

const батерииРаздели = structuredClone(батерии.sections ?? []) as Раздели
const разделБ = батерииРаздели.find((s) => !s.accessories && номер(s.viewAllCategory) === нова.id)!
const вече = (разделБ.cards ?? []).some((c) => номер(c.product) === продукт.id)
if (!вече) {
  разделБ.cards = [...(разделБ.cards ?? []), { product: продукт.id }]
  промени.push(`панел „${батерии.slug}" (№ ${батерии.id}): картата добавена накрая`)
}

log(промени.length ? промени.map((p) => `• ${p}`).join('\n') : 'няма какво да се сменя в продукта и панелите')
if (dryRun) process.exit(0)

if (промени.length) {
  /* Върху копие — без архив: той пише в общата папка `backups/` (CLAUDE.md, т. 17). */
  if (копие) log('копие на базата — без архив')
  else {
    const { doc } = await createBackup(payload, { label: 'Преди преместването на WAVE 2 Add-On Battery', trigger: 'ръчно' })
    log(`архив № ${doc.id}`)
  }
}

if (продуктНов) {
  /* Сменят се с категорията или се пресмятат при всеки запис (`lastPiece`). */
  const без = (d: object) => {
    const x: Record<string, unknown> = { ...d }
    for (const k of ['categories', 'category', 'categorySlug', 'categoryParentSlug', 'categoryGrandparentSlug', 'categoryName', 'updatedAt', 'lastPiece', 'searchText']) delete x[k]
    return чисто(x)
  }
  const преди = без(публикуван)
  await payload.update({
    collection: 'products',
    id: продукт.id,
    data: { categories: [нова.id], _status: продукт._status ?? 'published' },
    depth: 0,
  })
  const след = await payload.findByID({ collection: 'products', id: продукт.id, depth: 0, draft: false })
  log(без(след) === преди ? 'продукт: останалите полета — без промяна' : '⚠ продукт: друго поле също се различава')
}

const запиши = async (p: MenuPanel, sections: Раздели, пипнат: (typeof sections)[number] | undefined) => {
  const другиПреди = чисто(sections.filter((s) => s !== пипнат))
  await payload.update({ collection: 'menu-panels', id: p.id, data: { sections }, depth: 0 })
  const след = (await payload.findByID({ collection: 'menu-panels', id: p.id, depth: 0 })).sections ?? []
  const index = sections.indexOf(пипнат!)
  const другиСлед = чисто(след.filter((_, i) => i !== index))
  log(`панел „${p.slug}": ${другиПреди === другиСлед ? 'другите раздели — без промяна' : '⚠ друг раздел също се различава'}`)
  log(`  карти: ${(след[index]?.cards ?? []).map((c) => `${номер(c.product)} ${c.title ?? ''}`.trim()).join(' | ')}`)
}
if (първи && сКарта) await запиши(wave, waveРаздели, първи)
if (!вече) await запиши(батерии, батерииРаздели, разделБ)

/* Пренасочването — куката на продукта го записва; тук само се проверява. */
const сега = await payload.findByID({ collection: 'products', id: продукт.id, depth: 1, draft: false })
const новАдрес = productPath(сега as never)
const старАдрес = `/kategorii/${СТАРА}/${SLUG}`
log(`адрес: ${новАдрес}`)
const ред = (await payload.find({ collection: 'redirects', where: { from: { equals: старАдрес } }, depth: 0, limit: 1 })).docs[0]
if (ред?.to === новАдрес) log(`пренасочване: ${старАдрес} → ${новАдрес} ✓`)
else if (ред) {
  await payload.update({ collection: 'redirects', id: ред.id, data: { to: новАдрес }, depth: 0 })
  log(`пренасочване: ${старАдрес} → ${новАдрес} (поправено)`)
} else {
  await payload.create({
    collection: 'redirects',
    data: { from: старАдрес, to: новАдрес, reason: 'Продуктът смени категорията си' },
    depth: 0,
  })
  log(`пренасочване: ${старАдрес} → ${новАдрес} (добавено)`)
}

log(await revalidateServer())
process.exit(0)
