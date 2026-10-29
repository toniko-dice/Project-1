/**
 * Етап 4 на `task-dokumenti.md` — документите в колекцията „Документи".
 *
 *   npm run import:dokumenti [-- --dry-run]        (локалната база)
 *   npm run import:dokumenti:server [-- --dry-run] (базата на сървъра; качва PDF-ите)
 *
 * Чете `content/dokumenti/opis.json` (в git) и от папката с документите
 * (`DOKUMENTI_ROOT`, иначе `content/dokumenti`): `svaleni.json`, `originali/`,
 * `bg-oficialni/`, `bg-prevodi/` + `prevodi-gotovi.json`. Четири вида записи:
 *  - официален BG — `bg-oficialni/<slug>.pdf`, ключ: адресът на източника;
 *  - оригинал PDF — от `svaleni.json`; еднакви по SHA-256 адреси → ЕДИН документ
 *    с всичките им продукти; ключ: SHA-256;
 *  - оригинал от онлайн ръководство без BG — `originali/…/<slug>-user-manual-en.pdf`;
 *    ключ: адресът на източника;
 *  - превод (етап 5) — от `prevodi-gotovi.json` (само минали проверката,
 *    `scripts/dokumenti/prevod-pdf.mjs`); заглавието, продуктите и „Скрит" — на
 *    оригинала, връзка „Оригинал"; ключ: езикът „bg-prevod" + оригиналът.
 * Повторяем: съществуващ запис се обновява (данните; файлът — само ако е сменен).
 * Документ без видим продукт в сайта → „Скрит". Архив преди записа (освен на копие).
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import config from '@payload-config'
import { getPayload } from 'payload'

import { createBackup } from './lib/backup'
import { revalidateServer } from './import-product-core'

type Red = {
  zaglavie: string
  vid: string
  ezik: string
  tip: string
  adres: string
  produkti: string[]
  produkti_imena?: string[]
  skrit: boolean
  bg_iztochnik: string
  bg_adres?: string
  data: string
}
type Свален = { fail: string; sha256: string; zaglavie: string }
type Ключ = { field: 'sha256' | 'sourceUrl'; value: string }
type Готов = { bg_fail: string; original: { sha256?: string; sourceUrl?: string }; sha256: string; stranici: number }

const dryRun = process.argv.includes('--dry-run')
const ROOT = process.cwd()
const DOC_ROOT = path.resolve(/* turbopackIgnore: true */ ROOT, process.env.DOKUMENTI_ROOT || 'content/dokumenti')
const log = (m: string) => console.log(m)

const ВИД: Record<string, string> = {
  'Ръководство за потребителя': 'rakovodstvo',
  'Кратко ръководство (Quick Start)': 'kratko',
  'Инструкции за безопасност': 'bezopasnost',
  'Ръководство за монтаж': 'montazh',
  Друго: 'drugo',
}
const ВИД_BG: Record<string, string> = {
  rakovodstvo: 'Ръководство за потребителя',
  kratko: 'Кратко ръководство',
  bezopasnost: 'Инструкции за безопасност',
  montazh: 'Ръководство за монтаж',
  drugo: 'Документ',
}

/** „EcoFlow DELTA 3 Max Portable Power Station_User Manual V1.0 (EN)" → „EcoFlow DELTA 3 Max Portable Power Station". */
const име = (t: string) =>
  t
    .replace(/\.pdf$/i, '')
    .replace(/[_\s-]+(User Manual|User manual|Quick Start Guide|QSG|Safety Instructions?|Installation Guide|What's in the Box|Handleiding|Руководство пользователя)(?=$|[^A-Za-z]).*$/i, '') // не `\b`: „_" е „буква" за него
    .replace(/\s*\((EN|RU|NL)\)\s*$/, '')
    .replace(/_/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
/**
 * Един файл под няколко заглавия (EcoFlow сочи един PDF от няколко продукта) →
 * едно име с всички: общото начало и край + различната част, през „/".
 * „EcoFlow 160W Lightweight …" + „EcoFlow 220W Lightweight …" → „EcoFlow 160W/220W Lightweight …".
 */
const общоИме = (заглавия: string[]) => {
  const имена = [...new Set(заглавия.map(име))]
  if (имена.length < 2) return имена[0] ?? ''
  const думи = имена.map((n) => n.split(' '))
  const еднакви = (k: (d: string[]) => string | undefined) => думи.every((d) => k(d) === k(думи[0]!))
  let нач = 0
  while (нач < думи[0]!.length && еднакви((d) => d[нач])) нач++
  let край = 0
  while (край < думи[0]!.length - нач && еднакви((d) => d[d.length - 1 - край])) край++
  const среди = думи.map((d) => d.slice(нач, d.length - край).join(' '))
  if (среди.some((x) => !x)) return имена.join(' / ')
  return [...думи[0]!.slice(0, нач), среди.join('/'), ...думи[0]!.slice(думи[0]!.length - край)].join(' ')
}
const версия = (t: string) => t.match(/\bV\s?(\d+(?:\.\d+)*)/i)?.[1] ?? null
const sha = (f: string) => createHash('sha256').update(readFileSync(f)).digest('hex')

const payload = await getPayload({ config })
const opis = JSON.parse(readFileSync(path.join(/* turbopackIgnore: true */ ROOT, 'content/dokumenti/opis.json'), 'utf8')) as Red[]
const свалени = JSON.parse(readFileSync(path.join(DOC_ROOT, 'svaleni.json'), 'utf8')) as Record<string, Свален>

// Продуктите: slug → id (само съществуващите; видимостта вече е в описа).
const продукти = new Map<string, number>()
for (const p of (await payload.find({ collection: 'products', pagination: false, depth: 0, select: { slug: true }, draft: true })).docs) {
  продукти.set(p.slug as string, p.id as number)
}

type Запис = {
  key: Ключ
  /** Само при превод: ключът на оригинала (ключът на самия превод е „bg-prevod" + оригиналът). */
  original?: Ключ
  file: string
  data: Record<string, unknown>
}
const записи: Запис[] = []
const ids = (slugs: string[]) => [...new Set(slugs)].map((s) => продукти.get(s)).filter((x): x is number => Boolean(x))

// 1. Официалните на български.
const поBg = new Map<string, Red[]>()
for (const r of opis) if (r.bg_iztochnik === 'официален' && r.bg_adres) поBg.set(r.bg_adres, [...(поBg.get(r.bg_adres) ?? []), r])
for (const [адрес, редове] of поBg) {
  const slug = адрес.replace(/^.*?\/product\//, '').replace(/[/?].*$/, '')
  const file = path.join(DOC_ROOT, 'bg-oficialni', `${slug}.pdf`)
  const prod = ids(редове.flatMap((r) => r.produkti))
  const осн = редове.find((r) => r.tip === 'online') ?? редове[0]!
  // Името: от заглавието на EcoFlow (онлайн ръководството), а за тези извън центъра за сваляне — от продукта.
  const имеНа = осн.tip === 'online' ? име(осн.zaglavie) : (осн.produkti_imena?.[0] ?? `EcoFlow ${slug}`)
  записи.push({
    key: { field: 'sourceUrl', value: адрес },
    file,
    data: {
      title: `Ръководство за потребителя — ${имеНа}`,
      kind: 'rakovodstvo',
      language: 'bg-oficialen',
      products: prod,
      sourceTitle: осн.tip === 'online' ? осн.zaglavie : null,
      sourceUrl: адрес,
      sourceLanguage: 'BG',
      sourceDate: осн.data || null,
      hidden: prod.length === 0,
    },
  })
}

// 2. Оригиналите PDF — по SHA-256 (един файл → един документ с всичките му продукти).
const поSha = new Map<string, { s: Свален; редове: Red[] }>()
for (const [url, s] of Object.entries(свалени)) {
  const r = opis.find((x) => x.adres === url)
  if (!r) continue
  const g = поSha.get(s.sha256) ?? { s, редове: [] }
  g.редове.push(r)
  поSha.set(s.sha256, g)
}
for (const [хеш, { s, редове }] of поSha) {
  const осн = редове[0]!
  const kind = ВИД[осн.vid] ?? 'drugo'
  const prod = ids(редове.filter((r) => !r.skrit).flatMap((r) => r.produkti))
  записи.push({
    key: { field: 'sha256', value: хеш },
    file: path.join(DOC_ROOT, s.fail),
    data: {
      title: `${ВИД_BG[kind]} — ${общоИме(редове.map((r) => r.zaglavie))}`,
      kind,
      language: 'original',
      products: prod,
      sourceTitle: осн.zaglavie,
      sourceUrl: осн.adres,
      sourceLanguage: осн.ezik,
      sourceDate: осн.data || null,
      version: версия(осн.zaglavie),
      hidden: prod.length === 0,
    },
  })
}

// 3. Оригиналите от онлайн ръководства без официален BG (отпечатани на английски).
for (const r of opis.filter((x) => x.tip === 'online' && x.bg_iztochnik !== 'официален')) {
  const slug = r.adres.replace(/^.*?\/product\//, '').replace(/[/?].*$/, '')
  const file = path.join(DOC_ROOT, 'originali', r.produkti[0] || 'bez-produkt', `${slug}-user-manual-en.pdf`)
  const prod = ids(r.skrit ? [] : r.produkti)
  записи.push({
    key: { field: 'sourceUrl', value: r.adres },
    file,
    data: {
      title: `Ръководство за потребителя — ${име(r.zaglavie)}`,
      kind: 'rakovodstvo',
      language: 'original',
      products: prod,
      sourceTitle: r.zaglavie,
      sourceUrl: r.adres,
      sourceLanguage: 'EN',
      sourceDate: r.data || null,
      hidden: prod.length === 0,
    },
  })
}

// 4. Преводите — само готовите (минали проверката).
const готовиF = path.join(DOC_ROOT, 'prevodi-gotovi.json')
const готови = existsSync(готовиF) ? (JSON.parse(readFileSync(готовиF, 'utf8')) as Record<string, Готов>) : {}
for (const [id, g] of Object.entries(готови)) {
  const k: Ключ = g.original.sha256 ? { field: 'sha256', value: g.original.sha256 } : { field: 'sourceUrl', value: g.original.sourceUrl! }
  const ориг = записи.find((z) => !z.original && z.key.field === k.field && z.key.value === k.value)
  if (!ориг) throw new Error(`превод „${id}": няма такъв оригинал в описа — нищо не е записано`)
  записи.push({
    key: k,
    original: k,
    file: path.join(DOC_ROOT, g.bg_fail),
    data: {
      title: ориг.data.title,
      kind: ориг.data.kind,
      language: 'bg-prevod',
      products: ориг.data.products,
      sourceTitle: ориг.data.sourceTitle,
      sourceUrl: ориг.data.sourceUrl,
      sourceLanguage: ориг.data.sourceLanguage,
      sourceDate: ориг.data.sourceDate,
      version: ориг.data.version ?? null,
      hidden: ориг.data.hidden,
    },
  })
}

// Проверка на файловете преди каквото и да е писане.
const липсват = записи.filter((z) => !existsSync(z.file))
if (липсват.length) {
  липсват.forEach((z) => log(`ЛИПСВА: ${path.relative(DOC_ROOT, z.file)}`))
  throw new Error(`${липсват.length} файла липсват — нищо не е записано`)
}
log(`Документи: ${записи.length} (официален BG ${записи.filter((z) => z.data.language === 'bg-oficialen').length}, преводи ${записи.filter((z) => z.data.language === 'bg-prevod').length}, оригинали ${записи.filter((z) => z.data.language === 'original').length}; скрити ${записи.filter((z) => z.data.hidden).length})`)
if (dryRun) process.exit(0)

if (String(process.env.DATABASE_URI ?? '').includes('tmp-')) log('копие на базата — без архив')
else {
  const { doc } = await createBackup(payload, { label: 'Преди вноса на документите', trigger: 'ръчно' })
  log(`Архив: „${doc.label}" (№ ${doc.id})`)
}

let нови = 0
let обновени = 0
let сФайл = 0
const намери = async (where: Record<string, unknown>) =>
  (await payload.find({ collection: 'documents', where: where as never, limit: 1, depth: 0 })).docs[0] as
    | { id: number; sha256?: string | null }
    | undefined
// Оригиналите преди преводите — преводът сочи оригинала.
for (const z of [...записи.filter((x) => !x.original), ...записи.filter((x) => x.original)]) {
  const хеш = sha(z.file)
  let същ: { id: number; sha256?: string | null } | undefined
  let data: Record<string, unknown> = { ...z.data, sha256: хеш }
  if (z.original) {
    const ориг = await намери({ [z.original.field]: { equals: z.original.value }, language: { equals: 'original' } })
    if (!ориг) throw new Error(`оригиналът на превода „${String(z.data.title)}" липсва в базата`)
    същ = await намери({ language: { equals: 'bg-prevod' }, original: { equals: ориг.id } })
    data = { ...data, original: ориг.id }
  } else {
    същ = await намери({ [z.key.field]: { equals: z.key.value }, language: { not_equals: 'bg-prevod' } })
  }
  if (!същ) {
    await payload.create({ collection: 'documents', data: data as never, filePath: z.file, depth: 0 })
    нови++
  } else if (същ.sha256 !== хеш) {
    await payload.update({ collection: 'documents', id: същ.id, data: data as never, filePath: z.file, depth: 0, overwriteExistingFiles: true })
    сФайл++
  } else {
    await payload.update({ collection: 'documents', id: същ.id, data: data as never, depth: 0 })
    обновени++
  }
}
log(`✓ нови ${нови}, обновени ${обновени}, със сменен файл ${сФайл}`)
log(await revalidateServer())
process.exit(0)
