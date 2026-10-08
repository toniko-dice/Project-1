/**
 * Еднократно (`task-futar.md`) — новият футър и махането на телефона на
 * фирмата от съдържанието в базата:
 *
 * - „Футър": четирите колони (`FOOTER_COLUMNS`), без правните линкове долу;
 * - „Общи настройки" и „Данни за офертите": полето за телефон се изпразва
 *   (полетата остават);
 * - правните страници: „Имейл: support@dice.bg, тел. …" → „… или формата за
 *   контакт" (линк);
 * - „Гаранция": „Свържете се с нас на support@dice.bg или през формата за
 *   контакт." (линк) — телефонът там вече е махнат от админа;
 * - „За ДИ СИ 2008": редът „Телефон" от „Фирмени данни" и текстът в „Имате
 *   въпрос?" (+ бутон „Контакти") — както в `content/stranici/`.
 *
 * Пипа САМО тези места; останалото се сравнява преди и след записа.
 * Спира, ако страница има непубликувани промени (записът публикува).
 * Повторяем. Архив преди записа (без архив върху копие).
 *
 *   npm run futar:kontakti [-- --dry-run]
 */
import config from '@payload-config'
import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { getPayload } from 'payload'

import type { Page } from './payload-types'
import { createBackup } from './lib/backup'
import { FOOTER_COLUMNS } from './lib/footer-columns'
import { CONTACT_PATH } from './lib/legal'
import { revalidateServer } from './import-product-core'

const dryRun = process.argv.includes('--dry-run')
const копие = String(process.env.DATABASE_URI ?? '').includes('tmp-')
const payload = await getPayload({ config })
const log = (m: string) => console.log(m)
const json = (x: unknown) => JSON.stringify(x)
const чисто = (x: unknown) => json(x).replace(/"id":"[^"]*",?/g, '')
const ТЕЛЕФОН = /\+?359\s?879\s?437\s?744|0879\s?437\s?744/

type Възел = { type?: string; text?: string; children?: Възел[]; fields?: { url?: string }; [k: string]: unknown }

/* Линкът „формата за контакт" — възелът, както го прави вносът от Markdown. */
const editorConfig = await editorConfigFactory.default({ config: payload.config })
const линк = (
  convertMarkdownToLexical({ editorConfig, markdown: `[формата за контакт](${CONTACT_PATH})` }) as unknown as {
    root: { children: Възел[] }
  }
).root.children[0]!.children!.find((n) => n.type === 'link')!
const текст = (образец: Възел, t: string): Възел => ({ ...structuredClone(образец), text: t })

/** Обхожда всички възли на rich text. */
const всички = function* (n: Възел | undefined): Generator<Възел> {
  if (!n) return
  yield n
  for (const c of n.children ?? []) yield* всички(c)
}

/* ─────────── какво би се сменило ─────────── */

const промени: string[] = []

const footer = await payload.findGlobal({ slug: 'footer', depth: 0 })
const колони = (footer.columns ?? []).map((c) => ({ heading: c.heading, links: (c.links ?? []).map(({ label, url }) => ({ label, url })) }))
const футърНов = json(колони) !== json(FOOTER_COLUMNS) || (footer.legalLinks ?? []).length > 0
if (футърНов) промени.push('футър: четирите колони, без правните линкове долу')

const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
const настройкиНови = Boolean(settings.phone?.trim())
if (настройкиНови) промени.push(`„Общи настройки": телефонът (${settings.phone}) се изпразва`)

const offer = await payload.findGlobal({ slug: 'offer-settings', depth: 0 })
const офертиНови = Boolean(offer.company?.phone?.trim())
if (офертиНови) промени.push(`„Данни за офертите": телефонът (${offer.company?.phone}) се изпразва`)

type Страница = Page
type Блок = NonNullable<Страница['layout']>[number]
const поправки: { страница: Страница; layout: Блок[]; сменени: Set<number>; какво: string[] }[] = []

const страници = (
  await payload.find({
    collection: 'pages',
    where: { slug: { in: ['obshti-usloviya', 'poveritelnost', 'biskvitki', 'garanciya', 'za-di-si-2008'] } },
    depth: 0,
    draft: true,
    pagination: false,
  })
).docs

for (const p of страници) {
  const layout = structuredClone(p.layout ?? []) as Блок[]
  const сменени = new Set<number>()
  const какво: string[] = []

  layout.forEach((b, i) => {
    if (b.blockType === 'richText') {
      const root = (b.content as unknown as { root?: Възел } | null)?.root
      for (const n of всички(root)) {
        const деца = n.children
        if (!деца) continue
        for (let j = 0; j < деца.length; j++) {
          const c = деца[j]!
          /* Правните: „…Имейл: support@dice.bg, тел. +359 879 437 744." */
          if (c.type === 'text' && c.text && /,\s*тел\.\s*/.test(c.text) && ТЕЛЕФОН.test(c.text)) {
            const m = c.text.match(/,\s*тел\.\s*(\+?359\s?879\s?437\s?744)/)!
            const преди = c.text.slice(0, m.index!)
            const след = c.text.slice(m.index! + m[0].length)
            деца.splice(j, 1, текст(c, `${преди} или `), structuredClone(линк), текст(c, след || '.'))
            сменени.add(i)
            какво.push('телефонът в текста → „или формата за контакт"')
          }
          /* „Гаранция": имейлът (линк), после „  Пригответе:" — без „или през формата". */
          const предишен = деца[j - 1]
          if (
            c.type === 'text' &&
            /^\s+Пригответе:/.test(c.text ?? '') &&
            предишен &&
            (предишен.type === 'autolink' || предишен.type === 'link') &&
            String(предишен.fields?.url ?? '').startsWith('mailto:') &&
            !деца.some((x) => x.type === 'link' && x.fields?.url === CONTACT_PATH)
          ) {
            деца.splice(j, 1, текст(c, ' или през '), structuredClone(линк), текст(c, `. ${c.text!.trim()}`))
            сменени.add(i)
            какво.push('„или през формата за контакт" след имейла')
          }
        }
      }
    }
    if (b.blockType === 'simpleTable') {
      const редове = b.rows ?? []
      const без = редове.filter((r) => !(r.cells?.[0]?.value === 'Телефон' && ТЕЛЕФОН.test(r.cells?.[1]?.value ?? '')))
      if (без.length !== редове.length) {
        b.rows = без
        сменени.add(i)
        какво.push('ред „Телефон" от таблицата')
      }
    }
    if (b.blockType === 'textSection' && b.body && ТЕЛЕФОН.test(b.body)) {
      b.body = 'Пишете ни през формата за контакт или на support@dice.bg.'
      const бутони = b.buttons ?? []
      if (!бутони.some((x) => x.link === CONTACT_PATH)) {
        b.buttons = [{ label: 'Контакти', link: CONTACT_PATH } as (typeof бутони)[number], ...бутони]
      }
      сменени.add(i)
      какво.push(`„${b.heading}": текстът без телефон + бутон „Контакти"`)
    }
  })

  if (сменени.size) {
    поправки.push({ страница: p, layout, сменени, какво })
    промени.push(`/${p.slug}: ${какво.join('; ')}`)
  }
}

if (!промени.length) {
  log('без промяна')
  process.exit(0)
}
промени.forEach((p) => log(`• ${p}`))

/* Записът публикува — непубликувани промени в админа биха излезли заедно с него. */
for (const { страница } of поправки) {
  const публикувана = await payload.findByID({ collection: 'pages', id: страница.id, depth: 0, draft: false })
  if (чисто(публикувана.layout) !== чисто(страница.layout)) {
    throw new Error(`/${страница.slug} има непубликувани промени в админа — публикувайте ги или ги отхвърлете и пуснете пак`)
  }
}
if (dryRun) process.exit(0)

/* Върху копие — без архив: той пише в общата папка `backups/` (CLAUDE.md, т. 17). */
if (копие) log('копие на базата — без архив')
else {
  const { doc } = await createBackup(payload, { label: 'Преди новия футър и махането на телефона', trigger: 'ръчно' })
  log(`Архив: „${doc.label}" (№ ${doc.id})`)
}

/* ─────────── запис + проверка, че нищо друго не е мръднало ─────────── */

if (футърНов) {
  const след = await payload.updateGlobal({ slug: 'footer', data: { columns: FOOTER_COLUMNS, legalLinks: [] }, depth: 0 })
  const останало = (f: typeof footer) => чисто({ ...f, columns: null, legalLinks: null, updatedAt: null })
  if (останало(след) !== останало(footer)) throw new Error('футърът се промени и другаде')
  log('✓ футър')
}
if (настройкиНови) {
  const след = await payload.updateGlobal({ slug: 'site-settings', data: { phone: '' }, depth: 0 })
  const останало = (s: typeof settings) => чисто({ ...s, phone: null, updatedAt: null })
  if (останало(след) !== останало(settings)) throw new Error('„Общи настройки" се промениха и другаде')
  log('✓ „Общи настройки" — без телефон')
}
if (офертиНови) {
  await payload.updateGlobal({ slug: 'offer-settings', data: { company: { ...offer.company, phone: '' } }, depth: 0 })
  log('✓ „Данни за офертите" — без телефон')
}

for (const { страница, layout, сменени } of поправки) {
  const след = await payload.update({ collection: 'pages', id: страница.id, data: { layout, _status: 'published' }, depth: 0 })
  const преди = страница.layout ?? []
  const сега = след.layout ?? []
  if (преди.length !== сега.length) throw new Error(`/${страница.slug}: броят секции се промени`)
  преди.forEach((b, i) => {
    if (сменени.has(i)) return
    if (чисто(b) !== чисто(сега[i])) throw new Error(`/${страница.slug}: секция ${i + 1} (${b.blockType}) се промени`)
  })
  if (ТЕЛЕФОН.test(json(сега))) throw new Error(`/${страница.slug}: телефонът още е там`)
  log(`✓ /${страница.slug}`)
}

log(await revalidateServer())
process.exit(0)
