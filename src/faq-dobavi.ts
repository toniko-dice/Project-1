/**
 * Въпроси и отговори към продуктите (`task-faq-river-delta.md`) — от файл
 * `{ heading, anchorLabel, produkti: { <slug>: [{ question, answer }] } }`.
 *
 *   npm run faq:dobavi content/faq-dopalnenie.json [-- --dry-run]
 *
 * За всеки продукт — и в базата, и в `content/<slug>/sadarzhanie.json`:
 *
 * - без блок „Въпроси и отговори" → нов, след „Спецификации" (`specTable`);
 *   без тях — преди „Бележки под линия" (`footnotes`); иначе накрая —
 *   както е при DELTA Pro 3;
 * - с блок → новите въпроси най-отдолу; съществуващите не се пипат;
 *   въпрос, който вече го има (без главни букви и препинателни знаци), се
 *   прескача. Повторно пускане не дублира нищо.
 *
 * В базата се пипа САМО този блок: останалите секции и полетата на
 * продукта се сравняват преди и след записа. Публикуван продукт остава
 * публикуван; ако има непубликувани промени от админа, записът отива в
 * черновата (иначе би публикувал и тях — както `import:seo`). Чернова
 * остава чернова. Запис с `depth: 0` (CLAUDE.md, т. 18). Архив преди
 * записа (без архив върху копие).
 */
import config from '@payload-config'
import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'

import { createBackup } from './lib/backup'
import { нормален } from './lib/faq'
import { revalidateServer } from './import-product-core'

type Въпрос = { question: string; answer: string }
type Секция = { blockType?: string; heading?: string | null; anchorLabel?: string | null; items?: Въпрос[] | null; [k: string]: unknown }

const args = process.argv.slice(2).filter((a) => a !== '--')
const dryRun = args.includes('--dry-run')
const файл = args.find((a) => !a.startsWith('--'))
if (!файл) throw new Error('Посочете файла: npm run faq:dobavi content/faq-dopalnenie.json')
const копие = String(process.env.DATABASE_URI ?? '').includes('tmp-')
const CONTENT = path.resolve(process.env.CONTENT_ROOT ?? 'content')
const log = (m: string) => console.log(m)
const чисто = (x: unknown) => JSON.stringify(x).replace(/"id":"[^"]*",?/g, '')

const вход = JSON.parse(fs.readFileSync(path.resolve(файл), 'utf8')) as {
  heading?: string
  anchorLabel?: string
  produkti: Record<string, Въпрос[]>
}
const HEADING = вход.heading || 'Често задавани въпроси'
const ANCHOR = вход.anchorLabel || 'Въпроси'

/**
 * Добавя въпросите в списък от секции (базата или `sekcii`) — на място.
 * Връща колко нови въпроса е добавил и дали блокът е нов.
 */
const добави = (секции: Секция[], нови: Въпрос[]): { добавени: number; нов: boolean; индекс: number } => {
  let i = секции.findIndex((s) => s.blockType === 'faqBlock')
  let нов = false
  if (i < 0) {
    const spec = секции.findIndex((s) => s.blockType === 'specTable')
    const бележки = секции.findIndex((s) => s.blockType === 'footnotes')
    i = spec >= 0 ? spec + 1 : бележки >= 0 ? бележки : секции.length
    секции.splice(i, 0, { blockType: 'faqBlock', anchorLabel: ANCHOR, heading: HEADING, items: [] })
    нов = true
  }
  const блок = секции[i]!
  const има = new Set((блок.items ?? []).map((q) => нормален(q.question)))
  const items = [...(блок.items ?? [])]
  let добавени = 0
  for (const q of нови) {
    const k = нормален(q.question)
    if (!q.question?.trim() || !q.answer?.trim() || има.has(k)) continue
    има.add(k)
    items.push({ question: q.question.trim(), answer: q.answer.trim() })
    добавени += 1
  }
  блок.items = items
  return { добавени, нов, индекс: i }
}

const payload = await getPayload({ config })

/* ─────────── какво би се сменило ─────────── */

type План = {
  slug: string
  id: number
  sections: Секция[]
  индекс: number
  преди: Секция[]
  draft: boolean
  добавени: number
  нов: boolean
  файлПът: string
  файл: { sekcii?: Секция[] } & Record<string, unknown>
  файлДобавени: number
}
const план: План[] = []
const грешки: string[] = []

for (const [slug, въпроси] of Object.entries(вход.produkti)) {
  const p = (
    await payload.find({ collection: 'products', where: { slug: { equals: slug } }, depth: 0, draft: true, limit: 1 })
  ).docs[0]
  if (!p) {
    грешки.push(`${slug}: няма такъв продукт — пропуснат`)
    continue
  }
  const файлПът = path.join(CONTENT, slug, 'sadarzhanie.json')
  if (!fs.existsSync(файлПът)) {
    грешки.push(`${slug}: няма ${path.relative(process.cwd(), файлПът)} — пропуснат`)
    continue
  }

  /*
    Публикуван продукт с непубликувани промени → черновата (иначе записът
    би публикувал и тях). `p` е последната версия; главният ред — публикуваното.
  */
  const публикуван = p._status === 'published'
  let draft = !публикуван
  if (публикуван) {
    const главен = await payload.findByID({ collection: 'products', id: p.id, depth: 0, draft: false })
    if (чисто(главен.sections) !== чисто(p.sections)) draft = true
  }

  const преди = structuredClone(p.sections ?? []) as Секция[]
  const sections = structuredClone(преди)
  const { добавени, нов, индекс } = добави(sections, въпроси)

  const файлJson = JSON.parse(fs.readFileSync(файлПът, 'utf8')) as План['файл']
  const sekcii = (файлJson.sekcii ?? []) as Секция[]
  const { добавени: файлДобавени } = добави(sekcii, въпроси)
  файлJson.sekcii = sekcii

  план.push({ slug, id: p.id, sections, индекс, преди, draft, добавени, нов, файлПът, файл: файлJson, файлДобавени })
  log(
    `${slug}: ${нов ? 'нов блок' : 'към съществуващия блок'}, +${добавени} в базата, +${файлДобавени} във файла` +
      (draft && публикуван ? ' (има непубликувани промени — в черновата)' : '') +
      (!публикуван ? ' (чернова)' : ''),
  )
}
грешки.forEach((e) => log(`⚠ ${e}`))

const заБазата = план.filter((p) => p.добавени > 0)
const заФайла = план.filter((p) => p.файлДобавени > 0)
log(`Общо: ${заБазата.reduce((s, p) => s + p.добавени, 0)} въпроса в ${заБазата.length} продукта (база), ${заФайла.reduce((s, p) => s + p.файлДобавени, 0)} във ${заФайла.length} файла.`)
if (dryRun || (!заБазата.length && !заФайла.length)) process.exit(0)

if (заБазата.length) {
  if (копие) log('копие на базата — без архив')
  else {
    const { doc } = await createBackup(payload, { label: 'Преди въпросите за RIVER и DELTA', trigger: 'ръчно' })
    log(`Архив: „${doc.label}" (№ ${doc.id})`)
  }
}

/* ─────────── запис + проверка ─────────── */

for (const p of заБазата) {
  const before = await payload.findByID({ collection: 'products', id: p.id, depth: 0, draft: true })
  const след = await payload.update({
    collection: 'products',
    id: p.id,
    data: { sections: p.sections as never, ...(p.draft ? {} : { _status: 'published' as const }) },
    draft: p.draft,
    depth: 0,
  })
  const сега = (след.sections ?? []) as Секция[]
  /* Останалите секции — без промяна; новият блок е единствената разлика. */
  const безНовия = сега.filter((_, i) => !(p.нов && i === p.индекс))
  if (безНовия.length !== p.преди.length) throw new Error(`${p.slug}: броят секции не съвпада`)
  безНовия.forEach((s, i) => {
    const стара = p.преди[i]!
    if (s.blockType === 'faqBlock') {
      const стари = (стара.items ?? []).map((q) => [q.question, q.answer])
      if (JSON.stringify((s.items ?? []).slice(0, стари.length).map((q) => [q.question, q.answer])) !== JSON.stringify(стари)) {
        throw new Error(`${p.slug}: съществуващите въпроси се промениха`)
      }
      return
    }
    if (чисто(s) !== чисто(стара)) throw new Error(`${p.slug}: секция ${i + 1} (${s.blockType}) се промени`)
  })
  const останало = (d: Record<string, unknown>) =>
    чисто({ ...d, sections: null, updatedAt: null, _status: null, searchText: null, lastPiece: null })
  /* Сравнява се прочетеното по един и същ начин преди и след — отговорът на записа подава полетата различно. */
  const после = await payload.findByID({ collection: 'products', id: p.id, depth: 0, draft: true })
  if (останало(после as never) !== останало(before as never)) {
    const разлики = Object.keys({ ...before, ...после }).filter(
      (k) => !['sections', 'updatedAt', '_status', 'searchText', 'lastPiece'].includes(k) &&
        чисто((before as unknown as Record<string, unknown>)[k]) !== чисто((после as unknown as Record<string, unknown>)[k]),
    )
    throw new Error(`${p.slug}: промени се и друго в продукта — ${разлики.join(', ')}`)
  }
  log(`✓ ${p.slug} — +${p.добавени}${p.draft ? ' (чернова)' : ''}`)
}

for (const p of заФайла) {
  /* Видът на файла се пази: краят на реда (LF/CRLF) и новият ред накрая. */
  const стар = fs.readFileSync(p.файлПът, 'utf8')
  const текст = JSON.stringify(p.файл, null, 2) + (/\r?\n$/.test(стар) ? '\n' : '')
  fs.writeFileSync(p.файлПът, стар.includes('\r\n') ? текст.replace(/\n/g, '\r\n') : текст)
  log(`✓ ${path.relative(process.cwd(), p.файлПът)} — +${p.файлДобавени}`)
}

if (заБазата.length) log(await revalidateServer())
process.exit(0)
