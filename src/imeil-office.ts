/**
 * Еднократно (19 октомври 2026, `task-imeil-office.md`) — имейлът за клиенти
 * `support@dice.bg` → `office@ecoflow.bg` в базата, по одобрения списък:
 *
 * - „Общи настройки" → имейл (футър, мобилно меню, schema, писмата, Reply-To
 *   на копията до клиента);
 * - „Данни за офертите" → имейл (PDF-ът и писмото на НОВИТЕ оферти; старите
 *   оферти не се пипат) — глобалът досега нямаше запис: записва се веднъж,
 *   останалите полета — със стойностите, които се ползват и сега;
 * - страниците obshti-usloviya, poveritelnost, biskvitki (текст), garanciya
 *   (текст, линкът `mailto:`), za-di-si-2008 („Фирмени данни" и тъмната
 *   секция) — само низът с адреса, в блоковете, които го съдържат.
 *
 * Всичко останало се сравнява преди и след записа. Спира при непубликувани
 * промени в страница. Повторяем (вече сменено → без промяна). Архив преди
 * записа.
 *
 *   npm run imeil:office [-- --dry-run]
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import type { Page } from './payload-types'
import { CONTACT_EMAIL } from './lib/contact'
import { createBackup } from './lib/backup'
import { revalidateServer } from './import-product-core'

const СТАР = 'support@dice.bg'
const СТРАНИЦИ = ['obshti-usloviya', 'poveritelnost', 'biskvitki', 'garanciya', 'za-di-si-2008']

const dryRun = process.argv.includes('--dry-run')
const payload = await getPayload({ config })
const log = (m: string) => console.log(m)
const чисто = (x: unknown) => JSON.stringify(x).replace(/"id":"[^"]*",?/g, '')

/** Всеки низ в обекта: СТАР → новия адрес. Връща колко замени. */
const замени = (x: unknown): { v: unknown; n: number } => {
  if (typeof x === 'string') {
    const n = x.split(СТАР).length - 1
    return { v: n ? x.split(СТАР).join(CONTACT_EMAIL) : x, n }
  }
  if (Array.isArray(x)) {
    let n = 0
    const v = x.map((e) => {
      const r = замени(e)
      n += r.n
      return r.v
    })
    return { v, n }
  }
  if (x && typeof x === 'object') {
    let n = 0
    const v: Record<string, unknown> = {}
    for (const [k, e] of Object.entries(x)) {
      const r = замени(e)
      n += r.n
      v[k] = r.v
    }
    return { v, n }
  }
  return { v: x, n: 0 }
}

type Блок = NonNullable<Page['layout']>[number]
const промени: string[] = []
const страници: { id: number | string; slug: string; layout: Блок[]; преди: Блок[]; сменени: Set<number> }[] = []

for (const slug of СТРАНИЦИ) {
  const стр = (await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, depth: 0, draft: true, limit: 1 })).docs[0]
  if (!стр) throw new Error(`няма страница ${slug}`)
  const преди = (стр.layout ?? []) as Блок[]
  const сменени = new Set<number>()
  const layout = преди.map((b, i) => {
    const r = замени(b)
    if (!r.n) return b
    сменени.add(i)
    промени.push(`/${slug} — секция ${i + 1} (${b.blockType}): ${r.n} ×`)
    return r.v as Блок
  })
  if (!сменени.size) continue
  const публикувана = await payload.findByID({ collection: 'pages', id: стр.id, depth: 0, draft: false })
  if (чисто(публикувана.layout) !== чисто(стр.layout)) {
    throw new Error(`/${slug} има непубликувани промени в админа — публикувайте ги или ги отхвърлете и пуснете пак`)
  }
  страници.push({ id: стр.id, slug, layout, преди, сменени })
}

const общи = (await payload.findGlobal({ slug: 'site-settings', depth: 0 })) as unknown as Record<string, unknown>
const общиСмяна = общи.email === СТАР
if (общиСмяна) промени.push(`„Общи настройки" → имейл: ${СТАР} → ${CONTACT_EMAIL}`)

const оферти = (await payload.findGlobal({ slug: 'offer-settings', depth: 0 })) as unknown as {
  company?: Record<string, unknown> | null
} & Record<string, unknown>
const офертиСмяна = (оферти.company?.email ?? СТАР) !== CONTACT_EMAIL
if (офертиСмяна) промени.push(`„Данни за офертите" → имейл: ${String(оферти.company?.email ?? '(празно)')} → ${CONTACT_EMAIL}`)

if (!промени.length) {
  log('без промяна — всичко вече е с новия адрес')
  process.exit(0)
}
промени.forEach((p) => log(`• ${p}`))
if (dryRun) process.exit(0)

if (String(process.env.DATABASE_URI ?? '').includes('tmp-')) log('копие на базата — без архив')
else {
  const { doc } = await createBackup(payload, { label: 'Преди имейла office@ecoflow.bg', trigger: 'ръчно' })
  log(`Архив: „${doc.label}" (№ ${doc.id})`)
}

for (const с of страници) {
  const след = await payload.update({ collection: 'pages', id: с.id, data: { layout: с.layout, _status: 'published' }, depth: 0 })
  const сега = (след.layout ?? []) as Блок[]
  if (сега.length !== с.преди.length) throw new Error(`/${с.slug}: броят секции се промени`)
  с.преди.forEach((b, i) => {
    const очаквано = с.сменени.has(i) ? с.layout[i] : b
    if (чисто(очаквано) !== чисто(сега[i])) throw new Error(`/${с.slug}: секция ${i + 1} (${b.blockType}) не е каквато трябва`)
  })
  if (JSON.stringify(сега).includes(СТАР)) throw new Error(`/${с.slug}: старият адрес още е там`)
  log(`✓ /${с.slug}`)
}

if (общиСмяна) {
  const след = (await payload.updateGlobal({ slug: 'site-settings', data: { email: CONTACT_EMAIL }, depth: 0 })) as unknown as Record<string, unknown>
  const { email: _a, updatedAt: _b, ...остПреди } = общи
  const { email: _c, updatedAt: _d, ...остСлед } = след
  if (след.email !== CONTACT_EMAIL) throw new Error('„Общи настройки": имейлът не се записа')
  if (чисто(остПреди) !== чисто(остСлед)) throw new Error('„Общи настройки": друго поле се промени')
  log('✓ „Общи настройки"')
}

if (офертиСмяна) {
  const company = { ...(оферти.company ?? {}), email: CONTACT_EMAIL }
  const след = (await payload.updateGlobal({ slug: 'offer-settings', data: { company }, depth: 0 })) as unknown as typeof оферти
  if (след.company?.email !== CONTACT_EMAIL) throw new Error('„Данни за офертите": имейлът не се записа')
  const { company: _a, updatedAt: _b, createdAt: _c, ...остПреди } = оферти
  const { company: _d, updatedAt: _e, createdAt: _f, ...остСлед } = след
  const { email: _g, ...фирмаПреди } = оферти.company ?? {}
  const { email: _h, ...фирмаСлед } = след.company ?? {}
  if (чисто(остПреди) !== чисто(остСлед) || чисто(фирмаПреди) !== чисто(фирмаСлед)) {
    throw new Error('„Данни за офертите": друго поле се промени')
  }
  log('✓ „Данни за офертите"')
}

log(await revalidateServer())
process.exit(0)
