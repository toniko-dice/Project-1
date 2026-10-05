/**
 * Смислени имена на снимките — ЕДНО име навсякъде (`task-snimki-imena.md`).
 *
 * Правилото (т. 1 на задачата):
 *   - главна снимка и галерия на продукт → `<slug>-<позиция>` (главната е 1);
 *   - снимка в секция → `<slug>-<котва или sekciya-N>-<K>`;
 *   - снимка в няколко продукта → по ПЪРВИЯ, който я ползва (по `_order`);
 *   - снимка извън продуктите → транслитерираният alt, иначе мястото;
 *   - заето име → `-2`, `-3`…
 *
 * Смяната пипа: файловете в `media/` (оригинал и размери) и записа в
 * Медия (номерът и alt остават), `content/<slug>/sadarzhanie.json`
 * (галерия, секции, `_prevod_nadpisi`, `_svali_snimki` → `{url, file}`),
 * текстовите файлове в папката на продукта, файловете в подпапките ѝ и
 * трите общи папки (`snimki/`, `_originali/`, `za-prevod/`).
 *
 * В базата снимките се сочат САМО по номер — проверено на 5 октомври 2026
 * върху всички текстови колони: нито един път `/api/media/file/…` и нито
 * едно име на файл извън таблицата `media`. Затова връзките не се пипат.
 *
 * Повторяемо: имената се пресмятат от съдържанието, не от сегашните имена,
 * и снимка, която вече е с правилното име, не се докосва.
 */
import fs from 'fs/promises'
import path from 'path'
import type { Payload } from 'payload'

import {
  bareStem,
  caseSafeStem,
  CONTENT_ROOT,
  exists,
  ORIGINALI_DIR,
  productFolders,
  SNIMKI_DIR,
} from './import-product-core'
import { slugify } from './lib/slug'
import {
  адресиЗаСваляне,
  ИЗОБРАЖЕНИЕ,
  именаВСекции,
  катоОригинала,
  смениИменатаВСъдържанието,
  fileNameFromUrl,
  type СвалиСнимки,
} from './lib/snimki-sadarzhanie'

export const MEDIA_DIR = path.join(process.cwd(), 'media')
export const ZA_PREVOD_DIR = path.join(CONTENT_ROOT, 'za-prevod')
export const CSV_FILE = path.join(CONTENT_ROOT, 'snimki-imena.csv')

/** Колекциите без снимки за сайта — не се обхождат. */
const БЕЗ = new Set(['media', 'backups', 'users', 'subscribers', 'redirects'])

const НАЙ_ДЪЛГО = 60

type Размер = {
  filename?: string | null
  width?: number | null
  height?: number | null
  mimeType?: string | null
  filesize?: number | null
}
type MediaDoc = {
  id: number
  filename?: string | null
  alt?: string | null
  originalName?: string | null
  sizes?: Record<string, Размер | null> | null
}

/** Една снимка в Медия и новото ѝ име. */
export type ЗаписНаСмяна = {
  id: number
  стар: string
  нов: string
  място: string
  къде: string[]
}

export type Преименуване = { dir: string; от: string; до: string }

export type ПланЗаИмена = {
  записи: ЗаписНаСмяна[]
  /** Записи, които вече са с правилното име. */
  същите: number
  /** Нов текст на файл (JSON, .md, .txt) — пълен път → съдържание. */
  текстове: Map<string, string>
  файлове: Преименуване[]
  /** Файлове в общите папки и имена в съдържанието без снимка в Медия. */
  безСъвпадение: { файл: string; къде: string }[]
  проблеми: string[]
}

/* ─────────── помощни ─────────── */

const основа = (filename: string): string => path.basename(filename, path.extname(filename))

/**
 * Транслитерация за имената на снимките: „ц" е „c", както в slug-овете на
 * сайта (`kapacitet-wh`, `portativni-elektrocentrali`), а не „ts" на общата
 * `slugify`. Общата не се пипа — от нея зависят котвите на страниците и
 * адресите, които админът тепърва създава.
 */
const слъг = (text: string): string => slugify(text.replace(/[цЦ]/g, 'c'))

/** Транслитерира и реже до `НАЙ_ДЪЛГО` знака по тире. */
const име = (text: string): string => {
  const s = слъг(text.replace(/\.(jpe?g|png|webp|avif|gif)$/i, ''))
  if (s.length <= НАЙ_ДЪЛГО) return s
  const срязан = s.slice(0, НАЙ_ДЪЛГО)
  const тире = срязан.lastIndexOf('-')
  return (тире > 20 ? срязан.slice(0, тире) : срязан).replace(/-+$/, '')
}

type Поле = {
  type: string
  name?: string
  relationTo?: string | string[]
  fields?: Поле[]
  flattenedFields?: Поле[]
  blocks?: { slug: string; fields?: Поле[]; flattenedFields?: Поле[] }[]
  blockReferences?: (string | { slug: string; fields?: Поле[]; flattenedFields?: Поле[] })[]
  tabs?: { name?: string; fields?: Поле[] }[]
}

const полетаНа = (x: { fields?: Поле[]; flattenedFields?: Поле[] }): Поле[] =>
  x.flattenedFields ?? x.fields ?? []

const къмМедия = (relationTo: Поле['relationTo']) =>
  relationTo === 'media' || (Array.isArray(relationTo) && relationTo.includes('media'))

const номер = (v: unknown): number | null => {
  if (typeof v === 'number') return v
  if (v && typeof v === 'object' && typeof (v as { id?: unknown }).id === 'number') {
    return (v as { id: number }).id
  }
  return null
}

/** Снимки в rich text (Lexical): възли `upload` към Медия. */
const отRichText = (node: unknown, out: number[]): void => {
  if (Array.isArray(node)) return node.forEach((n) => отRichText(n, out))
  if (!node || typeof node !== 'object') return
  const n = node as Record<string, unknown>
  if (n.type === 'upload' && n.relationTo === 'media') {
    const id = номер(n.value)
    if (id !== null) out.push(id)
  }
  for (const v of Object.values(n)) if (v && typeof v === 'object') отRichText(v, out)
}

/**
 * Номерата на снимките в данните, в реда на полетата.
 * `blocksById` — общите блокове (`blockReferences`) по slug.
 */
const снимкиВ = (
  fields: Поле[],
  data: unknown,
  blocksById: Map<string, { fields?: Поле[]; flattenedFields?: Поле[] }>,
  out: { id: number; поле: string }[] = [],
  горе = '',
): { id: number; поле: string }[] => {
  if (!data || typeof data !== 'object') return out
  const d = data as Record<string, unknown>
  for (const f of fields) {
    const горно = горе || f.name || ''
    switch (f.type) {
      case 'upload':
      case 'relationship': {
        if (!къмМедия(f.relationTo) || !f.name) break
        const v = d[f.name]
        for (const x of Array.isArray(v) ? v : [v]) {
          const id = номер(x && typeof x === 'object' && 'value' in x ? (x as { value: unknown }).value : x)
          if (id !== null) out.push({ id, поле: горно })
        }
        break
      }
      case 'array':
        for (const row of (f.name ? (d[f.name] as unknown[]) : null) ?? []) {
          снимкиВ(полетаНа(f), row, blocksById, out, горно)
        }
        break
      case 'group':
      case 'tab':
        снимкиВ(полетаНа(f), f.name ? d[f.name] : d, blocksById, out, горно)
        break
      case 'row':
      case 'collapsible':
        снимкиВ(полетаНа(f), d, blocksById, out, горе)
        break
      case 'tabs':
        for (const t of f.tabs ?? []) снимкиВ(t.fields ?? [], t.name ? d[t.name] : d, blocksById, out, горе || t.name || '')
        break
      case 'blocks':
        for (const row of (f.name ? (d[f.name] as Record<string, unknown>[]) : null) ?? []) {
          const блок = блокЗа(f, row?.blockType, blocksById)
          if (блок) снимкиВ(полетаНа(блок), row, blocksById, out, горно)
        }
        break
      case 'richText': {
        const ids: number[] = []
        if (f.name) отRichText(d[f.name], ids)
        for (const id of ids) out.push({ id, поле: горно })
        break
      }
    }
  }
  return out
}

const блокЗа = (
  f: Поле,
  slug: unknown,
  blocksById: Map<string, { fields?: Поле[]; flattenedFields?: Поле[] }>,
) => {
  if (typeof slug !== 'string') return null
  const вътре = f.blocks?.find((b) => b.slug === slug)
  if (вътре) return вътре
  for (const r of f.blockReferences ?? []) {
    if (typeof r === 'string' ? r === slug : r.slug === slug) {
      return typeof r === 'string' ? (blocksById.get(r) ?? null) : r
    }
  }
  return blocksById.get(slug) ?? null
}

/* ─────────── 1. новите имена ─────────── */

/**
 * Новата основа за всеки запис в Медия.
 *
 * Пресмята се в определен ред — продуктите по `_order`, после всичко
 * останало — и първият, който ползва снимката, ѝ дава името. Заетите
 * имена се пазят без регистъра: на Windows `A.webp` и `a.webp` са един файл.
 */
export const новиИмена = async (
  payload: Payload,
): Promise<{ поЗапис: Map<number, { основа: string; място: string }>; медия: MediaDoc[] }> => {
  const blocksById = new Map(
    (payload.config.blocks ?? []).map((b) => [b.slug, b as unknown as { fields?: Поле[]; flattenedFields?: Поле[] }]),
  )
  const медия = (
    await payload.find({ collection: 'media', pagination: false, depth: 0, sort: 'id' })
  ).docs as unknown as MediaDoc[]
  const има = new Set(медия.map((m) => m.id))

  const заети = new Set<string>()
  const поЗапис = new Map<number, { основа: string; място: string }>()
  /*
    Първо се събират ВСИЧКИ заявки и чак после се раздават имената:
    неизползваните снимки пазят името си и то трябва да е заето, преди
    първият продукт да си избере.
  */
  const заявки: { id: number; желано: string; място: string }[] = []
  const дай = (id: number, желано: string, място: string) => {
    if (има.has(id) && желано) заявки.push({ id, желано, място })
  }

  /* Продуктите — по `_order`, и черновите. */
  const productsCfg = payload.collections.products!.config
  const productFields = полетаНа(productsCfg as never)
  const продукти = (
    await payload.find({ collection: 'products', pagination: false, depth: 0, sort: '_order', draft: false })
  ).docs as unknown as Record<string, unknown>[]

  for (const p of продукти) {
    const slug = String(p.slug)
    const гл = номер(p.image)
    if (гл !== null) дай(гл, `${slug}-1`, `продукт ${slug} — главна снимка`)
    ;((p.gallery as { image?: unknown }[]) ?? []).forEach((g, i) => {
      const id = номер(g?.image)
      if (id !== null) дай(id, `${slug}-${i + 2}`, `продукт ${slug} — галерия ${i + 2}`)
    })

    const sectionsField = productFields.find((f) => f.name === 'sections')
    const котви = new Set<string>()
    ;((p.sections as Record<string, unknown>[]) ?? []).forEach((s, j) => {
      const блок = sectionsField ? блокЗа(sectionsField, s.blockType, blocksById) : null
      if (!блок) return
      /*
        Котвата („Надпис в менюто на страницата"), иначе заглавието на
        секцията — до четири думи, иначе `sekciya-N`.
      */
      const надпис = typeof s.anchorLabel === 'string' ? s.anchorLabel.trim() : ''
      const заглавие = (typeof s.heading === 'string' ? s.heading : '')
        .split(/\s+/)
        .filter((дума) => /[\p{L}\p{N}]/u.test(дума))
        .slice(0, 4)
        .join(' ')
      const име = надпис || заглавие
      const база = (име && слъг(име)) || `sekciya-${j + 1}`
      let котва = база
      for (let n = 2; котви.has(котва); n += 1) котва = `${база}-${n}`
      котви.add(котва)
      снимкиВ(полетаНа(блок), s, blocksById).forEach(({ id }, k) =>
        дай(id, `${slug}-${котва}-${k + 1}`, `продукт ${slug} — секция ${име ? `„${име}"` : j + 1}`),
      )
    })

    const други = productFields.filter((f) => !['image', 'gallery', 'sections'].includes(f.name ?? ''))
    const броячи = new Map<string, number>()
    for (const { id, поле } of снимкиВ(други, p, blocksById)) {
      const n = (броячи.get(поле) ?? 0) + 1
      броячи.set(поле, n)
      дай(id, `${slug}-${слъг(поле) || 'snimka'}-${n}`, `продукт ${slug} — поле ${поле}`)
    }
  }

  /* Всичко останало: alt, иначе мястото. */
  const altНа = new Map(медия.map((m) => [m.id, m.alt ?? '']))
  const позАлт = (id: number, резерв: string, място: string) => дай(id, име(altНа.get(id) ?? '') || резерв, място)

  for (const c of payload.config.collections) {
    if (c.slug === 'products' || БЕЗ.has(c.slug) || c.slug.startsWith('payload-')) continue
    const docs = (
      await payload.find({
        collection: c.slug as never,
        pagination: false,
        depth: 0,
        ...((c as { orderable?: boolean }).orderable ? { sort: '_order' } : { sort: 'id' }),
      })
    ).docs as Record<string, unknown>[]
    for (const doc of docs) {
      const кой = String(doc.slug ?? doc.title ?? doc.name ?? doc.id)
      for (const { id, поле } of снимкиВ(полетаНа(c as never), doc, blocksById)) {
        позАлт(id, име(`${c.slug}-${кой}-${поле}`), `${c.slug} ${кой} — ${поле}`)
      }
    }
  }
  for (const g of payload.config.globals) {
    const doc = (await payload.findGlobal({ slug: g.slug as never, depth: 0 })) as Record<string, unknown>
    for (const { id, поле } of снимкиВ(полетаНа(g as never), doc, blocksById)) {
      позАлт(id, име(`${g.slug}-${поле}`), `глобал ${g.slug} — ${поле}`)
    }
  }

  /*
    Неизползваните (стари копия, сочени само от стари версии) пазят името
    си — по решение на собственика. Името им е заето за всички останали.
  */
  const ползвани = new Set(заявки.map((з) => з.id))
  for (const m of медия) {
    if (ползвани.has(m.id) || !m.filename) continue
    заети.add(основа(m.filename).toLowerCase())
    поЗапис.set(m.id, { основа: основа(m.filename), място: 'не се ползва — остава със старото име' })
  }

  for (const { id, желано, място } of заявки) {
    if (поЗапис.has(id)) continue
    let нова = желано
    for (let n = 2; заети.has(нова); n += 1) нова = `${желано}-${n}`
    заети.add(нова)
    поЗапис.set(id, { основа: нова, място })
  }

  return { поЗапис, медия }
}

/* ─────────── 2. планът ─────────── */

/** Основите в папката на продукта с повече от едно съдържание — същото като `mediaStem` във вноса. */
const многоРазширения = async (root: string): Promise<Set<string>> => {
  const { createHash } = await import('crypto')
  const поОснова = new Map<string, string[]>()
  for (const e of await fs.readdir(root, { withFileTypes: true })) {
    if (!e.isDirectory()) continue
    for (const name of await fs.readdir(path.join(root, e.name))) {
      if (!path.extname(name)) continue
      const s = bareStem(name)
      поОснова.set(s, [...(поОснова.get(s) ?? []), path.join(root, e.name, name)])
    }
  }
  const out = new Set<string>()
  for (const [s, files] of поОснова) {
    if (files.length < 2) continue
    const hashes = new Set<string>()
    for (const f of files) hashes.add(createHash('md5').update(await fs.readFile(f)).digest('hex'))
    if (hashes.size > 1) out.add(s)
  }
  return out
}

type Съдържание = {
  galeriya?: { file?: string }[]
  sekcii?: unknown
  _prevod_nadpisi?: unknown
  _svali_snimki?: СвалиСнимки
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Сменя имената в текст (`.md`, `.txt`), но НЕ в адрес — адресът е
 * откъдето се сваля. Ред, който е само адрес, получава новото име отзад.
 */
const смениВТекст = (текст: string, карта: Map<string, string>, адреси: Map<string, string>): string => {
  const редове = текст.split(/(\r?\n)/)
  for (let i = 0; i < редове.length; i += 2) {
    const ред = редове[i]!
    const адрес = ред.trim()
    if (/^https?:\/\/\S+$/.test(адрес)) {
      const нов = адреси.get(адрес)
      if (нов && нов !== fileNameFromUrl(адрес) && !ред.includes('→')) редове[i] = `${ред}  →  ${нов}`
      continue
    }
    let нов = ред
    for (const [от, до] of карта) {
      if (от === до || !нов.includes(от)) continue
      нов = нов.replace(new RegExp(`(?<![\\w./-])${escape(от)}(?![\\w-])`, 'g'), до)
    }
    редове[i] = нов
  }
  return редове.join('')
}

export const планЗаИмена = async (payload: Payload): Promise<ПланЗаИмена> => {
  const { поЗапис, медия } = await новиИмена(payload)

  const проблеми: string[] = []
  const безСъвпадение: ПланЗаИмена['безСъвпадение'] = []
  const текстове = new Map<string, string>()
  const файлове: Преименуване[] = []
  const къде = new Map<number, string[]>()
  const отбележи = (id: number, т: string) => {
    const l = къде.get(id) ?? []
    if (!l.includes(т)) l.push(т)
    къде.set(id, l)
  }

  /** Запис в Медия по точната основа (с регистъра, както вноса). */
  const поОснова = new Map<string, MediaDoc>()
  for (const m of медия) if (m.filename) поОснова.set(основа(m.filename), m)
  const новаОснова = (id: number) => поЗапис.get(id)!.основа

  /** Старото име в съдържанието → новото; за общите папки. */
  const поИме = new Map<string, string>()
  const поСтараОснова = new Map<string, Set<string>>()
  const запомни = (стар: string, нов: string, папка: string) => {
    const било = поИме.get(стар)
    if (било && било !== нов) {
      проблеми.push(`${стар}: в ${папка} е ${нов}, другаде — ${било}. Общите папки не се пипат за това име.`)
      поИме.set(стар, '')
    } else if (било === undefined) поИме.set(стар, нов)
    const s = bareStem(стар)
    поСтараОснова.set(s, new Set([...(поСтараОснова.get(s) ?? []), bareStem(нов)]))
  }

  /* ─── папките на продуктите ─── */
  for (const folder of await productFolders()) {
    const root = path.join(CONTENT_ROOT, folder)
    const jsonPath = path.join(root, 'sadarzhanie.json')
    const оригинал = await fs.readFile(jsonPath, 'utf-8')
    let c: Съдържание
    try {
      c = JSON.parse(оригинал) as Съдържание
    } catch {
      проблеми.push(`content/${folder}/sadarzhanie.json не е валиден JSON — прескочен`)
      continue
    }

    const много = await многоРазширения(root)
    const запис = (file: string): MediaDoc | null => {
      const s = bareStem(file)
      const stem = много.has(s) ? `${s}-${path.extname(file).slice(1).toLowerCase()}` : s
      return поОснова.get(stem) ?? поОснова.get(caseSafeStem(stem)) ?? null
    }

    const адреси = адресиЗаСваляне(c._svali_snimki)
    const имена = new Set<string>()
    for (const g of c.galeriya ?? []) if (typeof g?.file === 'string') имена.add(g.file)
    именаВСекции(c.sekcii, имена)
    const prevod =
      c._prevod_nadpisi && typeof c._prevod_nadpisi === 'object' && !Array.isArray(c._prevod_nadpisi)
        ? (c._prevod_nadpisi as Record<string, unknown>)
        : null
    for (const k of Object.keys(prevod ?? {})) if (!k.startsWith('_') && ИЗОБРАЖЕНИЕ.test(k)) имена.add(k)
    for (const a of адреси) имена.add(a.file)

    const карта = new Map<string, string>()
    for (const n of имена) {
      const m = запис(n)
      if (!m) {
        if (!адреси.some((a) => a.file === n) || (c.galeriya ?? []).some((g) => g.file === n)) {
          безСъвпадение.push({ файл: n, къде: `content/${folder}/sadarzhanie.json — няма снимка в Медия` })
        }
        continue
      }
      const нов = `${новаОснова(m.id)}${path.extname(n).toLowerCase()}`
      карта.set(n, нов)
      запомни(n, нов, folder)
      отбележи(m.id, `content/${folder}`)
    }

    /* JSON */
    const данни = JSON.parse(оригинал) as Record<string, unknown>
    смениИменатаВСъдържанието(данни, карта)
    const новJson = катоОригинала(оригинал, данни)
    if (новJson !== оригинал) текстове.set(jsonPath, новJson)

    /* .md и .txt в папката */
    const новиАдреси = new Map(адреси.map((a) => [a.url, карта.get(a.file) ?? a.file]))
    for (const e of await fs.readdir(root, { withFileTypes: true })) {
      if (!e.isFile() || !/\.(md|txt)$/i.test(e.name)) continue
      const p = path.join(root, e.name)
      const т = await fs.readFile(p, 'utf-8')
      const нов = смениВТекст(т, карта, новиАдреси)
      if (нов !== т) текстове.set(p, нов)
    }

    /* файловете в подпапките */
    for (const e of await fs.readdir(root, { withFileTypes: true })) {
      if (!e.isDirectory()) continue
      const dir = path.join(root, e.name)
      for (const f of await fs.readdir(dir)) {
        const нов = карта.get(f)
        if (нов && нов !== f) файлове.push({ dir, от: f, до: нов })
      }
    }
  }

  /* ─── трите общи папки ─── */
  const мОснова = new Map<string, string>()
  for (const m of медия) if (m.filename) мОснова.set(основа(m.filename), новаОснова(m.id))

  for (const dir of [SNIMKI_DIR, ORIGINALI_DIR, ZA_PREVOD_DIR]) {
    if (!(await exists(dir))) continue
    const тук = await fs.readdir(dir)
    const ниски = new Set(тук.map((f) => f.toLowerCase()))
    const цели = new Set<string>()
    for (const f of тук.sort()) {
      if (!ИЗОБРАЖЕНИЕ.test(f)) continue
      const ext = path.extname(f).toLowerCase()
      const s = bareStem(f)
      const поСтара = поСтараОснова.get(s)
      const нов =
        поИме.get(f) ||
        (мОснова.has(s) ? `${мОснова.get(s)}${ext}` : '') ||
        (поСтара?.size === 1 ? `${[...поСтара][0]}${ext}` : '')
      if (!нов) {
        безСъвпадение.push({ файл: f, къде: `${path.basename(dir)}/ — няма снимка с това име` })
        continue
      }
      // Същата основа, друго разширение — `PC_02.jpg` (превод) до `PC_02.png` (прозрачен).
      const крайно = `${bareStem(нов)}${ext}`
      if (крайно === f) continue
      if (цели.has(крайно.toLowerCase()) || (ниски.has(крайно.toLowerCase()) && крайно.toLowerCase() !== f.toLowerCase())) {
        проблеми.push(`${path.basename(dir)}/${f} → ${крайно}: името вече е заето — не е преименуван`)
        continue
      }
      цели.add(крайно.toLowerCase())
      файлове.push({ dir, от: f, до: крайно })
      const m = поОснова.get(s) ?? [...поОснова.values()].find((x) => x.filename && новаОснова(x.id) === bareStem(нов))
      if (m) отбележи(m.id, `${path.basename(dir)}/`)
    }
    // spisak.md в „за превод"
    const spisak = path.join(dir, 'spisak.md')
    if (dir === ZA_PREVOD_DIR && (await exists(spisak))) {
      const т = await fs.readFile(spisak, 'utf-8')
      const нов = смениВТекст(т, new Map([...поИме].filter(([, v]) => v)), new Map())
      if (нов !== т) текстове.set(spisak, нов)
    }
  }

  /* ─── редовете за Медия ─── */
  const записи: ЗаписНаСмяна[] = []
  let същите = 0
  for (const m of медия) {
    if (!m.filename) continue
    const { основа: нова, място } = поЗапис.get(m.id)!
    const нов = `${нова}${path.extname(m.filename).toLowerCase()}`
    if (нов === m.filename) {
      същите += 1
      continue
    }
    записи.push({ id: m.id, стар: m.filename, нов, място, къде: [`Медия № ${m.id}`, ...(къде.get(m.id) ?? [])] })
  }

  return { записи, същите, текстове, файлове, безСъвпадение, проблеми }
}

/* ─────────── 3. CSV ─────────── */

const клетка = (s: string) => (/[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)

/** Точка и запетая и BOM — иначе Excel на български Windows слага всичко в една клетка. */
export const csvЗаПлана = (план: ПланЗаИмена): string => {
  const редове = [['старо име', 'ново име', 'продукт/място', 'къде']]
  for (const з of план.записи) редове.push([з.стар, з.нов, з.място, з.къде.join(', ')])
  for (const ф of план.файлове) {
    if (!план.записи.some((з) => bareStem(з.нов) === bareStem(ф.до))) {
      редове.push([ф.от, ф.до, '—', path.relative(CONTENT_ROOT, ф.dir).replace(/\\/g, '/') || 'content'])
    }
  }
  for (const б of план.безСъвпадение) редове.push([б.файл, '', 'без съвпадение', б.къде])
  return '﻿' + редове.map((r) => r.map(клетка).join(';')).join('\r\n') + '\r\n'
}

/* ─────────── 4. смяната ─────────── */

const размерНов = (старОснова: string, новаОсн: string, р: Размер): string | null => {
  if (!р.filename) return null
  if (р.filename.startsWith(`${старОснова}-`)) return `${новаОсн}${р.filename.slice(старОснова.length)}`
  return `${новаОсн}-${р.width}x${р.height}${path.extname(р.filename)}`
}

/**
 * Прилага плана. Файловете в `media/` се местят запис по запис и чак
 * после се пише записът; ако записът падне, файловете се връщат.
 * Запис, чието ново име още е заето от файл на ДРУГ запис (който тепърва
 * ще се премести), чака; затворен кръг минава през временно име.
 */
export const приложиПлана = async (
  payload: Payload,
  план: ПланЗаИмена,
  log: (m: string) => void,
): Promise<{ медия: number; неуспешни: string[] }> => {
  const неуспешни: string[] = []
  const docs = new Map(
    (
      (await payload.find({ collection: 'media', pagination: false, depth: 0 })).docs as unknown as MediaDoc[]
    ).map((d) => [d.id, d]),
  )

  type Ход = { id: number; от: string[]; до: string[]; данни: Record<string, unknown> }
  const ходове: Ход[] = []
  for (const з of план.записи) {
    const d = docs.get(з.id)
    if (!d?.filename) continue
    const старОсн = основа(d.filename)
    const новаОсн = основа(з.нов)
    const от = [d.filename]
    const до = [з.нов]
    const sizes: Record<string, Размер | null> = {}
    for (const [k, р] of Object.entries(d.sizes ?? {})) {
      if (!р?.filename) {
        sizes[k] = р
        continue
      }
      // Размер без файл (стар остатък от подмяна) — чисти се, иначе адресът му дава 500.
      if (!(await exists(path.join(MEDIA_DIR, р.filename)))) {
        sizes[k] = { filename: null, width: null, height: null, mimeType: null, filesize: null }
        log(`  · № ${з.id}: размерът ${k} (${р.filename}) липсва на диска — изчистен`)
        continue
      }
      const н = размерНов(старОсн, новаОсн, р)!
      // Два размера с един файл (`large` и `full` при 2000 px оригинал) — мести се веднъж.
      if (!от.includes(р.filename)) {
        от.push(р.filename)
        до.push(н)
      }
      sizes[k] = { filename: н, width: р.width, height: р.height, mimeType: р.mimeType, filesize: р.filesize }
    }
    ходове.push({
      id: з.id,
      от,
      до,
      данни: { filename: з.нов, sizes, ...(d.originalName ? {} : { originalName: d.filename }) },
    })
  }

  const наДиска = async (f: string) => exists(path.join(MEDIA_DIR, f))
  const собствени = (х: Ход) => new Set(х.от.map((f) => f.toLowerCase()))

  const премести = async (х: Ход, от: string[], до: string[]) => {
    const готови: [string, string][] = []
    try {
      for (let i = 0; i < от.length; i += 1) {
        if (от[i] === до[i]) continue
        if (!(await наДиска(от[i]!))) {
          log(`  ⚠ № ${х.id}: липсва файлът ${от[i]} — прескочен`)
          continue
        }
        await fs.rename(path.join(MEDIA_DIR, от[i]!), path.join(MEDIA_DIR, до[i]!))
        готови.push([от[i]!, до[i]!])
      }
      return готови
    } catch (e) {
      for (const [a, b] of готови.reverse()) await fs.rename(path.join(MEDIA_DIR, b), path.join(MEDIA_DIR, a)).catch(() => {})
      throw e
    }
  }

  let чакащи = ходове
  let готови = 0
  const временни = new Map<number, string[]>()
  while (чакащи.length) {
    const следващи: Ход[] = []
    for (const х of чакащи) {
      const мои = собствени(х)
      let свободно = true
      for (const f of х.до) if (!мои.has(f.toLowerCase()) && (await наДиска(f))) свободно = false
      if (!свободно) {
        следващи.push(х)
        continue
      }
      const от = временни.get(х.id) ?? х.от
      let преместени: [string, string][] = []
      try {
        преместени = await премести(х, от, х.до)
        await payload.update({ collection: 'media', id: х.id, data: х.данни as never, depth: 0 })
        готови += 1
        if (готови % 100 === 0) log(`  … ${готови} от ${ходове.length}`)
      } catch (e) {
        for (const [a, b] of преместени.reverse()) {
          await fs.rename(path.join(MEDIA_DIR, b), path.join(MEDIA_DIR, a)).catch(() => {})
        }
        неуспешни.push(`№ ${х.id} ${х.от[0]}: ${(e as Error).message}`)
      }
    }
    if (следващи.length === чакащи.length) {
      // Затворен кръг: първият минава през временно име, за да освободи своето.
      const х = следващи[0]!
      const врем = х.от.map((f) => `__ime-${х.id}-${f}`)
      await премести(х, временни.get(х.id) ?? х.от, врем)
      временни.set(х.id, врем)
      х.от = врем
    }
    чакащи = следващи
  }

  /* съдържанието */
  for (const [p, т] of план.текстове) await fs.writeFile(p, т, 'utf-8')
  for (const ф of план.файлове) {
    const от = path.join(ф.dir, ф.от)
    const до = path.join(ф.dir, ф.до)
    if (!(await exists(от))) continue
    if (ф.от.toLowerCase() !== ф.до.toLowerCase() && (await exists(до))) {
      неуспешни.push(`${path.relative(CONTENT_ROOT, до)}: вече съществува — ${ф.от} не е преименуван`)
      continue
    }
    await fs.rename(от, до)
  }

  return { медия: готови, неуспешни }
}

/* ─────────── 5. след внос ─────────── */

/**
 * Новите снимки от вноса получават името си по правилото — веднага след
 * вноса, със същия план и същата смяна като `snimki:imena`. Така и
 * `_svali_snimki` става `[{url, file}]`, а `za-prevod/` и `spisak.md`
 * (пресмятат се след това) са с новите имена.
 *
 * Връща редовете за обобщението: какво е преименувано и кои файлове в
 * `content/snimki/` не отговарят на нито една снимка — те иначе стоят там
 * мълчаливо и собственикът мисли, че преводът е качен.
 */
export const именаСледВнос = async (
  payload: Payload,
  opts: { dryRun?: boolean; log?: (m: string) => void } = {},
): Promise<string[]> => {
  const план = await планЗаИмена(payload)
  const редове: string[] = []
  const има = план.записи.length || план.текстове.size || план.файлове.length

  if (има && opts.dryRun) {
    редове.push(`Нови имена на снимки: ${план.записи.length} биха се сменили в Медия`)
  } else if (има) {
    const { медия, неуспешни } = await приложиПлана(payload, план, opts.log ?? (() => {}))
    редове.push(`Нови имена на снимки: ${медия} в Медия, ${план.файлове.length} файла в content/`)
    for (const з of план.записи) редове.push(`  ${з.стар} → ${з.нов}`)
    for (const н of неуспешни) редове.push(`  ✗ ${н}`)
    if (план.записи.length) {
      // Таблицата в git расте с всяка смяна — за справка кое откъде е дошло.
      const нови = csvЗаПлана({ ...план, файлове: [], безСъвпадение: [] }).split('\r\n').slice(1).join('\r\n')
      await fs.appendFile(CSV_FILE, нови, 'utf-8')
    }
  }

  const вСнимки = план.безСъвпадение.filter((б) => б.къде.startsWith('snimki/'))
  if (вСнимки.length) {
    редове.push(`⚠ content/snimki/: ${вСнимки.length} файла не отговарят на нито една снимка — проверете името:`)
    for (const б of вСнимки) редове.push(`  ${б.файл}`)
  }
  return редове
}
