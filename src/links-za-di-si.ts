/**
 * Еднократно (`task-stranica-za-di-si-2008.md`, т. 3) — линковете към
 * „За ДИ СИ 2008" в съществуващото съдържание, БЕЗ повторен внос (той би
 * изтрил редакциите от админа, а „За EcoFlow" и „Гаранция" са внесени
 * преди защитата):
 *
 * - футърът: „За ДИ СИ 2008" веднага след „За EcoFlow";
 * - „За EcoFlow": трети бутон в „EcoFlow в България";
 * - „Гаранция": „ДИ СИ 2008 ООД" в първия абзац на текста става линк.
 *
 * Пипа САМО тези места; останалото се сравнява преди и след записа.
 * Повторяем — каквото вече е направено, се прескача. Архив преди записа.
 *
 *   npm run links:za-di-si [-- --dry-run]
 */
import config from '@payload-config'
import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { getPayload } from 'payload'

import { createBackup } from './lib/backup'
import { revalidateServer } from './import-product-core'

const ADRES = '/za-di-si-2008'
const dryRun = process.argv.includes('--dry-run')
const payload = await getPayload({ config })
const log = (m: string) => console.log(m)
const json = (x: unknown) => JSON.stringify(x)

type Възел = { type?: string; text?: string; format?: number; children?: Възел[]; [k: string]: unknown }

/* ─── какво би се сменило ─── */

const footer = await payload.findGlobal({ slug: 'footer', depth: 0 })
const колони = structuredClone(footer.columns ?? [])
let футърНов = false
for (const к of колони) {
  const линкове = к.links ?? []
  if (линкове.some((l) => l.url === ADRES)) break
  const i = линкове.findIndex((l) => l.url === '/za-ecoflow')
  if (i >= 0) {
    линкове.splice(i + 1, 0, { label: 'За ДИ СИ 2008', url: ADRES } as (typeof линкове)[number])
    футърНов = true
    break
  }
}

const страница = async (slug: string) =>
  (await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1, depth: 0, draft: true })).docs[0]

const зaEcoFlow = await страница('za-ecoflow')
const зaLayout = structuredClone(зaEcoFlow?.layout ?? [])
let бутонНов = false
for (const b of зaLayout) {
  if (b.blockType !== 'textSection' || b.heading !== 'EcoFlow в България') continue
  const бутони = b.buttons ?? []
  if (!бутони.some((x) => x.link === ADRES)) {
    бутони.push({ label: 'За ДИ СИ 2008', link: ADRES } as (typeof бутони)[number])
    b.buttons = бутони
    бутонНов = true
  }
}

const гаранция = await страница('garanciya')
const гLayout = structuredClone(гаранция?.layout ?? [])
let линкНов = false
const editorConfig = await editorConfigFactory.default({ config: payload.config })
const образец = convertMarkdownToLexical({ editorConfig, markdown: `[**ДИ СИ 2008 ООД**](${ADRES})` }) as unknown as {
  root: { children: Възел[] }
}
const линкВъзел = образец.root.children[0]!.children!.find((n) => n.type === 'link' || n.type === 'autolink')
for (const b of гLayout) {
  if (b.blockType !== 'richText' || линкНов) continue
  const първи = (b.content as unknown as { root?: { children?: Възел[] } } | null)?.root?.children?.find(
    (n) => n.type === 'paragraph',
  )
  const деца = първи?.children ?? []
  if (деца.some((n) => n.type === 'link')) break
  const i = деца.findIndex((n) => n.type === 'text' && n.text === 'ДИ СИ 2008 ООД')
  if (i >= 0 && линкВъзел) {
    деца.splice(i, 1, structuredClone(линкВъзел))
    линкНов = true
  }
  break
}

log(`футър: ${футърНов ? 'ще добави „За ДИ СИ 2008" след „За EcoFlow"' : 'без промяна'}`)
log(`„За EcoFlow": ${бутонНов ? 'ще добави трети бутон' : 'без промяна'}`)
log(`„Гаранция": ${линкНов ? 'ще направи „ДИ СИ 2008 ООД" линк' : 'без промяна'}`)
if (dryRun || (!футърНов && !бутонНов && !линкНов)) process.exit(0)

/*
  Върху копие (`DATABASE_URI=file:./tmp-…`) — без архив: той пише в общата
  папка `backups/` и чисти „своите" стари архиви (CLAUDE.md, т. 17).
*/
if (String(process.env.DATABASE_URI ?? '').includes('tmp-')) {
  log('копие на базата — без архив')
} else {
  const { doc } = await createBackup(payload, { label: 'Преди линковете към „За ДИ СИ 2008"', trigger: 'ръчно' })
  log(`Архив: „${doc.label}" (№ ${doc.id})`)
}

/* ─── запис + проверка, че нищо друго не е мръднало ─── */

if (футърНов) {
  const след = await payload.updateGlobal({ slug: 'footer', data: { columns: колони }, depth: 0 })
  const без = (c: typeof колони) => json(c.map((к) => ({ ...к, links: (к.links ?? []).filter((l) => l.url !== ADRES).map(({ label, url }) => ({ label, url })) })))
  if (без(след.columns ?? []) !== без(footer.columns ?? [])) throw new Error('футърът се промени и другаде')
  log('✓ футър')
}

const запиши = async (p: NonNullable<typeof зaEcoFlow>, layout: typeof зaLayout, име: string, промяна: (b: (typeof зaLayout)[number]) => boolean) => {
  const след = await payload.update({ collection: 'pages', id: p.id, data: { layout, _status: 'published' }, depth: 0 })
  const преди = p.layout ?? []
  const сега = след.layout ?? []
  if (преди.length !== сега.length) throw new Error(`${име}: броят секции се промени`)
  преди.forEach((b, i) => {
    if (промяна(b)) return
    const чисто = (x: unknown) => json(x).replace(/"id":"[^"]*",?/g, '')
    if (чисто(b) !== чисто(сега[i])) throw new Error(`${име}: секция ${i + 1} (${b.blockType}) се промени`)
  })
  log(`✓ ${име}`)
}

if (бутонНов && зaEcoFlow) {
  await запиши(зaEcoFlow, зaLayout, '„За EcoFlow"', (b) => b.blockType === 'textSection' && b.heading === 'EcoFlow в България')
}
if (линкНов && гаранция) {
  let първиТекст = true
  await запиши(гаранция, гLayout, '„Гаранция"', (b) => {
    if (b.blockType !== 'richText' || !първиТекст) return false
    първиТекст = false
    return true
  })
}

log(await revalidateServer())
process.exit(0)
