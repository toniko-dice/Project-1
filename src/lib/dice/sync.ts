import { createLocalReq, type Payload } from 'payload'

import type { Availability } from '../availability'
import { AVAILABILITY } from '../availability'
import { createBackup } from '../backup'
import { formatEur } from '../format'
import { SITE_URL } from '../site-url'
import { isLastPiece } from './last-piece'
import { rowLabel, съпостави } from './match'
import { DiceFileError, type DiceRow, eanНередност, finalPrice, isEcoFlow, mapAvailability, parseDiceXml } from './parse'
import { ЦЕНОВИ_КОНТЕКСТ, новПакет, оценка, type Level } from './prices'

/**
 * Синхронизация с dice.bg (`task-dice-xml-sinhronizaciya.md`,
 * `task-dice-odobrenie-ceni.md`).
 *
 *   plan  — пресмята какво би се сменило (бутонът „Провери");
 *   run   — същото, плюс предпазителите, записа, лога, опресняването на
 *           сайта и отчета по имейл.
 *
 * Два режима („Режим" в „Връзка с dice.bg"):
 * - **Тестов** (по подразбиране) — наличност и брой се записват веднага;
 *   новите цени отиват в „Цени за одобрение" и излизат на сайта чак след
 *   одобрение. Без график — само с бутона.
 * - **Автоматичен** — всичко се записва направо; цените от едно пускане
 *   са един пакет в „История на цените" (`priceBatch` на лога), който се
 *   връща с едно натискане.
 *
 * Пипат се САМО цена, зачертана цена, наличност и брой. Продукти не се
 * създават, не се трият, не се публикуват. Съвпадение — по `Identifier`
 * (= SKU), после по EAN (`ean`, `ean2`); по име никога — `match.ts`.
 * Цената и зачертаната — `finalPrice` в `parse.ts`.
 */

export type DiceMode = 'test' | 'auto'

export type DiceSettings = {
  mode?: DiceMode | null
  url?: string | null
  hour?: number | null
  updatePrice?: boolean | null
  updateAvailability?: boolean | null
  lastPieceThreshold?: number | null
  reportEmail?: string | null
  lastMatched?: number | null
  lastAutoDate?: string | null
  backupDone?: boolean | null
  testXml?: string | null
  testFileName?: string | null
  testFileAt?: string | null
}

type Product = {
  id: number
  title: string
  sku?: string | null
  ean?: string | null
  ean2?: string | null
  price?: number | null
  compareAtPrice?: number | null
  availability?: string | null
  stockQty?: number | null
  hideLastPiece?: boolean | null
  noSync?: boolean | null
  _status?: string | null
}

export type Change = { id: number; product: string; field: string; old: string; new: string }

/** Нова цена от dice за един продукт — в тестов режим става „Цена за одобрение". */
export type PriceProposal = {
  id: number
  title: string
  sku: string
  currentPrice: number | null
  newPrice: number
  currentCompare: number | null
  newCompare: number | null
  pct: number | null
  abs: number | null
  absPct: number
  level: Level
  warn: boolean
  /** Същата стойност вече е отказана — не излиза отново. */
  rejected: boolean
}

export type Plan = {
  mode: DiceMode
  /** Откъде е файлът: адресът или качения файл. */
  source: string
  rows: number
  matched: number
  /** Наличност и брой; в автоматичен режим — и цените. */
  changes: Change[]
  updates: { id: number; title: string; data: Record<string, unknown>; draftOnly: boolean }[]
  /** Всички нови цени (и в двата режима) — за таблицата и предпазителя. */
  prices: PriceProposal[]
  /** Продукти, при които файлът дава цената, която вече е на сайта — чакащото им се маха. */
  samePrice: number[]
  unchanged: number
  notFound: { sku: string; ean: string; name: string }[]
  missingInFile: { id: number; title: string }[]
  withoutIds: { id: number; title: string }[]
  skippedNoSync: number
  errors: string[]
  /** Не спират продукта — например SpecialPrice ≥ Price. */
  warnings: string[]
  /** Редове, пропуснати без грешка (друг артикул в dice със същия EAN). */
  skipped: string[]
  /** „Нередности във файла на dice" — за оправяне там. */
  irregular: { sku: string; name: string; ean: string; problem: string }[]
  abort: string | null
}

const ПОЛЕ = { price: 'Цена', compareAtPrice: 'Стара цена', availability: 'Наличност', stockQty: 'Брой' } as const
const норм = (s: string | null | undefined) => (s ?? '').trim().toLowerCase()
const цифри = (s: string | null | undefined) => (s ?? '').replace(/\D/g, '')
const пари = (n: number | null | undefined) => (typeof n === 'number' ? formatEur(n) : '—')
const наличност = (v: string | null | undefined) => (v ? (AVAILABILITY[v as Availability]?.admin ?? v) : '—')
const ключЦена = (price: number, compare: number | null) => `${price}|${compare ?? ''}`

/* ─────────── сваляне ─────────── */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** 60 s на опит; при автоматичното пускане — 3 опита през 5 минути. */
export const fetchDiceXml = async (url: string, attempts = 1, pauseMs = 5 * 60_000): Promise<string> => {
  let last = ''
  for (let i = 1; i <= attempts; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(60_000), headers: { Accept: 'application/xml,text/xml,*/*' } })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return await r.text()
    } catch (e) {
      last = (e as Error).message
      if (i < attempts) await sleep(pauseMs)
    }
  }
  throw new DiceFileError(`Файлът не се изтегли (${attempts} опит${attempts > 1 ? 'а' : ''}): ${last}`)
}

/**
 * Файлът за пускането: качения („Качи XML файл за тест"), ако има такъв —
 * иначе адреса. Автоматичното пускане ползва САМО адреса.
 */
export const readDiceXml = async (
  s: DiceSettings,
  opts: { useUpload?: boolean; attempts?: number } = {},
): Promise<{ xml: string; source: string; upload: boolean }> => {
  // Качен ли е файл — по името: и празен файл е тест (за предпазителите).
  if (opts.useUpload !== false && s.testFileName) {
    return { xml: s.testXml ?? '', source: `качен файл „${s.testFileName || 'XML'}" (${s.testFileAt || '—'})`, upload: true }
  }
  if (!s.url?.trim()) throw new DiceFileError('Няма адрес на XML и няма качен файл в „Връзка с dice.bg".')
  return { xml: await fetchDiceXml(s.url.trim(), opts.attempts ?? 1), source: s.url.trim(), upload: false }
}

/* ─────────── план ─────────── */

const всичкиПродукти = async (payload: Payload): Promise<Product[]> => {
  // Последната версия (`draft: true`) — както я вижда админът.
  const r = await payload.find({
    collection: 'products',
    draft: true,
    pagination: false,
    depth: 0,
    overrideAccess: true,
    select: {
      title: true, sku: true, ean: true, ean2: true, price: true, compareAtPrice: true,
      availability: true, stockQty: true, hideLastPiece: true, noSync: true, _status: true,
    },
  })
  return r.docs as unknown as Product[]
}

/** Продукти, публикувани, но с непубликувани промени отгоре — записът отива в черновата. */
const сНепубликувани = async (payload: Payload, ids: number[]): Promise<Set<number>> => {
  if (!ids.length) return new Set()
  const pub = await payload.find({
    collection: 'products',
    where: { id: { in: ids }, _status: { equals: 'published' } },
    pagination: false,
    depth: 0,
    overrideAccess: true,
    select: { _status: true },
  })
  return new Set(pub.docs.map((d) => d.id as number))
}

/** Отказаните стойности по продукт — „същата стойност не се показва отново". */
const отказани = async (payload: Payload): Promise<Map<number, Set<string>>> => {
  const r = await payload.find({
    collection: 'price-approvals',
    where: { status: { equals: 'rejected' } },
    pagination: false,
    depth: 0,
    overrideAccess: true,
    select: { product: true, newPrice: true, newCompare: true },
  })
  const m = new Map<number, Set<string>>()
  for (const d of r.docs as unknown as { product?: number | null; newPrice?: number | null; newCompare?: number | null }[]) {
    if (typeof d.product !== 'number' || typeof d.newPrice !== 'number') continue
    m.set(d.product, (m.get(d.product) ?? new Set()).add(ключЦена(d.newPrice, d.newCompare ?? null)))
  }
  return m
}

export const planSync = async (
  payload: Payload,
  rows: DiceRow[],
  s: DiceSettings,
  source = '',
  upload = false,
): Promise<Plan> => {
  const mode: DiceMode = s.mode === 'auto' ? 'auto' : 'test'
  const updatePrice = s.updatePrice !== false
  const updateAvailability = s.updateAvailability !== false
  const threshold = typeof s.lastPieceThreshold === 'number' ? s.lastPieceThreshold : 1

  const products = await всичкиПродукти(payload)
  const съвпадение = съпостави(rows, products)
  const отказаниСтойности = mode === 'test' ? await отказани(payload) : new Map<number, Set<string>>()

  const plan: Plan = {
    mode, source, rows: rows.length, matched: 0, changes: [], updates: [], prices: [], samePrice: [], unchanged: 0,
    notFound: [], missingInFile: [], withoutIds: [], skippedNoSync: 0,
    errors: [...съвпадение.errors], warnings: [...съвпадение.warnings], skipped: [...съвпадение.skipped],
    irregular: [], abort: null,
  }
  for (const row of rows) {
    const problem = eanНередност(row.ean)
    if (problem) plan.irregular.push({ sku: row.sku ?? '', name: row.name, ean: row.ean ?? '', problem })
  }
  for (const row of съвпадение.notFound) {
    if (isEcoFlow(row)) plan.notFound.push({ sku: row.sku ?? '', ean: row.ean ?? '', name: row.name })
  }
  const видяни = new Set<number>(съвпадение.matches.map((m) => m.product.id))

  for (const { row, product: p } of съвпадение.matches) {
    plan.matched++
    if (p.noSync) { plan.skippedNoSync++; continue }

    const data: Record<string, unknown> = {}
    if (updatePrice) {
      const цена = finalPrice(row)
      if (!цена.ok) {
        plan.errors.push(`${p.title}: ${цена.error} — продуктът не е пипнат`)
        continue
      }
      if (цена.warning) plan.warnings.push(`${p.title} (${rowLabel(row)}): ${цена.warning}`)
      const сменена = цена.price !== (p.price ?? null)
      const смененаЗачертана = (p.compareAtPrice ?? null) !== цена.compareAtPrice
      if (сменена || смененаЗачертана) {
        const о = оценка(p.price, цена.price, цена.compareAtPrice)
        plan.prices.push({
          id: p.id, title: p.title, sku: p.sku ?? '',
          currentPrice: p.price ?? null, newPrice: цена.price,
          currentCompare: p.compareAtPrice ?? null, newCompare: цена.compareAtPrice,
          pct: о.pct, abs: о.abs, absPct: сменена ? о.absPct : 0, level: сменена ? о.level : о.warn ? 'red' : 'ok', warn: о.warn,
          rejected: отказаниСтойности.get(p.id)?.has(ключЦена(цена.price, цена.compareAtPrice)) ?? false,
        })
        if (mode === 'auto') {
          if (сменена) data.price = цена.price
          if (смененаЗачертана) data.compareAtPrice = цена.compareAtPrice
        }
      } else {
        plan.samePrice.push(p.id)
      }
    }
    if (updateAvailability) {
      const a = mapAvailability(row)
      if (a === 'unknown') plan.errors.push(`${p.title}: непозната наличност „${row.availabilityRaw}" — наличността не е пипната`)
      else if (a && a !== (p.availability ?? 'in-stock')) data.availability = a
      if (row.qty !== null && row.qty !== (p.stockQty ?? null)) data.stockQty = row.qty
    }

    const ключове = Object.keys(data) as (keyof typeof ПОЛЕ)[]
    const чакаЦена = plan.prices.at(-1)?.id === p.id && !plan.prices.at(-1)!.rejected
    if (!ключове.length) {
      if (!чакаЦена) plan.unchanged++
      continue
    }
    for (const k of ключове) {
      const стара = (p as Record<string, unknown>)[k]
      const нова = data[k]
      const f = k === 'availability' ? наличност : k === 'stockQty' ? (v: unknown) => (v ?? '—').toString() : (v: unknown) => пари(v as number | null)
      plan.changes.push({ id: p.id, product: p.title, field: ПОЛЕ[k], old: f(стара as never), new: f(нова as never) })
    }
    // Етикетът — по новите стойности.
    const след = { ...p, ...data }
    plan.updates.push({ id: p.id, title: p.title, data: { ...data, lastPiece: isLastPiece(след, threshold) }, draftOnly: false })
  }

  for (const p of products) {
    if (!видяни.has(p.id)) plan.missingInFile.push({ id: p.id, title: p.title })
    if (!норм(p.sku) && !цифри(p.ean) && !цифри(p.ean2)) plan.withoutIds.push({ id: p.id, title: p.title })
  }

  // Публикувани с непубликувани промени отгоре — записът е в черновата.
  const чернови = products.filter((p) => p._status === 'draft').map((p) => p.id)
  const публикувани = await сНепубликувани(payload, чернови)
  const вЧернова = new Set(чернови)
  for (const u of plan.updates) {
    // Чернова остава чернова — синхронизацията не публикува нищо.
    if (вЧернова.has(u.id)) u.draftOnly = true
    if (публикувани.has(u.id)) {
      plan.errors.push(`${u.title}: има непубликувани промени — новите стойности са записани в черновата и излизат на сайта при „Публикувай"`)
    }
  }

  /*
    Предпазители — и в двата режима; при съмнение нищо не се записва.
    „По-малко от половината от предния път" — само за файла от адреса:
    качен тестов файл с няколко продукта иначе винаги би спрял.
  */
  const предишни = upload ? 0 : (s.lastMatched ?? 0)
  if (предишни > 0 && plan.matched < предишни * 0.5) {
    plan.abort = `Съвпаднаха ${plan.matched} продукта, а предния път — ${предишни}. Вероятно файлът е непълен или с друг формат.`
  } else if (plan.matched > 0) {
    const скокове = plan.prices.filter(
      (c) => typeof c.currentPrice === 'number' && c.currentPrice > 0 && Math.abs(c.newPrice - c.currentPrice) / c.currentPrice > 0.4,
    ).length
    if (скокове > plan.matched * 0.3) {
      plan.abort = `${скокове} от ${plan.matched} съвпаднали продукта биха сменили цената с над 40 %. Вероятно грешка във файла.`
    }
  }
  return plan
}

/* ─────────── пускане ─────────── */

export type RunResult = {
  result: 'ok' | 'partial' | 'aborted' | 'error'
  plan: Plan | null
  message: string
  logId?: number
  priceBatch?: string
  pendingNew?: number
}

const g = globalThis as { __diceSyncRunning?: boolean }

export const runSync = async (
  payload: Payload,
  opts: {
    trigger: 'автоматично' | 'ръчно'
    user?: string | null
    attempts?: number
    useUpload?: boolean
    /**
     * Режим само за това пускане, без да се пипа настройката — за проверка на
     * нощния път при „Тестов" (`src/dice-sync-test.ts`). Такова пускане не
     * пише `lastAutoDate`: не е истинското нощно и не бива да го прескача.
     */
    forceMode?: DiceMode
  },
): Promise<RunResult> => {
  /*
    Главната база е на сървъра (`task-kachvane-server.md`, т. 10) — локално
    синхронизацията е изключена с `DICE_SYNC_DISABLED=true` в `.env`, иначе
    локалната база би имала други цени от сървърната. „Провери" работи.
  */
  if (process.env.DICE_SYNC_DISABLED === 'true') {
    return {
      result: 'aborted',
      plan: null,
      message: 'Синхронизацията с dice.bg е изключена на тази машина (DICE_SYNC_DISABLED=true) — пуска се само на сървъра.',
    }
  }
  if (g.__diceSyncRunning) return { result: 'aborted', plan: null, message: 'Предната синхронизация още върви — пропуснато.' }
  g.__diceSyncRunning = true
  const записани = (await payload.findGlobal({ slug: 'dice-sync', depth: 0, overrideAccess: true })) as DiceSettings
  const s: DiceSettings = opts.forceMode ? { ...записани, mode: opts.forceMode } : записани
  let plan: Plan | null = null
  let result: RunResult['result'] = 'ok'
  let message = ''
  let revalidated = ''
  let priceBatch = ''
  let чакащи = { нови: 0, махнати: 0 }
  let отКачен = false
  try {
    const { xml, source, upload } = await readDiceXml(s, { useUpload: opts.useUpload, attempts: opts.attempts })
    отКачен = upload
    plan = await planSync(payload, parseDiceXml(xml), s, source, upload)

    if (plan.abort) {
      result = 'aborted'
      message = `Спряна без промени: ${plan.abort}`
    } else {
      if ((plan.updates.length || plan.prices.length) && !s.backupDone) {
        // Преди първата истинска синхронизация — архив на базата.
        await createBackup(payload, { includeMedia: false, label: 'Преди първата синхронизация с dice.bg', trigger: 'ръчно' })
        await payload.updateGlobal({ slug: 'dice-sync', data: { backupDone: true }, overrideAccess: true, depth: 0 })
      }
      if (plan.mode === 'auto' && plan.prices.length) priceBatch = новПакет('С')
      await записвай(payload, plan, priceBatch)
      if (plan.mode === 'test') чакащи = await заОдобрение(payload, plan)
      result = plan.errors.length ? 'partial' : 'ok'
      const обновени = new Set(plan.updates.map((u) => u.id)).size
      message =
        `Обновени ${обновени} продукта` +
        (plan.mode === 'test' ? `, цени за одобрение: ${чакащи.нови} нови/сменени` : `, нови цени: ${plan.prices.length}`) +
        `, без промяна ${plan.unchanged}, ненамерени ${plan.notFound.length}, грешки ${plan.errors.length}, предупреждения ${plan.warnings.length}.`
      if (plan.updates.length) revalidated = await опресниСайта()
    }
    await чистиРешени(payload)
  } catch (e) {
    result = e instanceof DiceFileError ? 'aborted' : 'error'
    message = `${result === 'aborted' ? 'Спряна без промени' : 'Грешка'}: ${(e as Error).message}`
  } finally {
    g.__diceSyncRunning = false
  }

  const kога = new Date().toLocaleString('bg-BG', { timeZone: 'Europe/Sofia' })
  const log = await payload.create({
    collection: 'dice-syncs',
    overrideAccess: true,
    depth: 0,
    data: {
      title: `${kога} — ${РЕЗУЛТАТ[result]}`,
      trigger: opts.trigger,
      user: opts.user ?? '',
      result,
      summary: message + (plan?.source ? `\nФайл: ${plan.source}` : '') + (revalidated ? `\nСайт: ${revalidated}` : ''),
      updated: plan ? new Set(plan.updates.map((u) => u.id)).size : 0,
      unchanged: plan?.unchanged ?? 0,
      notFoundCount: plan?.notFound.length ?? 0,
      errorCount: plan?.errors.length ?? (result === 'ok' ? 0 : 1),
      changes: plan?.changes.map((c) => `${c.product} — ${c.field}: ${c.old} → ${c.new}`).join('\n') ?? '',
      notFound: plan?.notFound.map((r) => `${r.name || '(без име)'} — Identifier ${r.sku || '—'}, EAN ${r.ean || '—'}`).join('\n') ?? '',
      missingInFile: plan?.missingInFile.map((p) => p.title).join('\n') ?? '',
      errors: [...(plan?.errors ?? []), ...(result === 'aborted' || result === 'error' ? [message] : [])].join('\n'),
      warnings: plan?.warnings.join('\n') ?? '',
      skipped: plan?.skipped.join('\n') ?? '',
      irregular: plan?.irregular.map((r) => `${r.name || '(без име)'} — Identifier ${r.sku || '—'}, EAN „${r.ean}": ${r.problem}`).join('\n') ?? '',
      priceBatch,
    } as never,
  })
  await пазиПоследните(payload, 90)

  const lastRun = `${kога} (${opts.trigger}${opts.user ? `, ${opts.user}` : ''}) — ${РЕЗУЛТАТ[result]}. ${message}`
  await payload.updateGlobal({
    slug: 'dice-sync',
    overrideAccess: true,
    depth: 0,
    data: {
      lastRun,
      // Броят за предпазителя — само от файла на адреса, не от качен тестов.
      ...(plan && !plan.abort && result !== 'error' && !отКачен ? { lastMatched: plan.matched } : {}),
      ...(opts.trigger === 'автоматично' && !opts.forceMode ? { lastAutoDate: днес() } : {}),
    },
  })

  // Имейл: при нови чакащи цени, промени (наличност; в авт. режим — и цени), грешки или спиране.
  const има = plan && (чакащи.нови > 0 || plan.changes.length > 0 || plan.errors.length > 0)
  if (s.reportEmail?.trim() && (result !== 'ok' || има)) {
    await отчет(payload, s.reportEmail.trim(), result, message, plan, opts.trigger).catch((e) =>
      payload.logger.error(`dice.bg: отчетът не се изпрати — ${(e as Error).message}`),
    )
  }
  return { result, plan, message, logId: log.id as number, priceBatch, pendingNew: чакащи.нови }
}

/**
 * Тестов режим: новите цени → „Цени за одобрение". Чакащ запис за същия
 * продукт се обновява (не се трупат дубли); отказана стойност не излиза
 * отново; файл с цената, която вече е на сайта, маха чакащото.
 */
const заОдобрение = async (payload: Payload, plan: Plan) => {
  const сега = new Date().toISOString()
  let нови = 0
  let махнати = 0
  const чакащи = new Map<number, { id: number; newPrice?: number | null; newCompare?: number | null }>()
  const r = await payload.find({
    collection: 'price-approvals', where: { status: { equals: 'pending' } }, pagination: false, depth: 0, overrideAccess: true,
    select: { product: true, newPrice: true, newCompare: true },
  })
  for (const d of r.docs as unknown as { id: number; product?: number | null; newPrice?: number | null; newCompare?: number | null }[]) {
    if (typeof d.product === 'number') чакащи.set(d.product, d)
  }
  for (const p of plan.prices) {
    const стар = чакащи.get(p.id)
    if (p.rejected) {
      // Същата отказана стойност — чакащ запис (ако има стар с друга цена) остава какъвто е.
      continue
    }
    const data = {
      productTitle: p.title,
      product: p.id,
      sku: p.sku,
      currentPrice: p.currentPrice,
      newPrice: p.newPrice,
      currentCompare: p.currentCompare,
      newCompare: p.newCompare,
      changePct: p.pct === null ? null : Math.round(p.pct * 10) / 10,
      changeAbs: p.abs === null ? null : Math.round(p.abs * 100) / 100,
      changeAbsPct: Math.round(p.absPct * 10) / 10,
      level: p.level,
      warn: p.warn,
      xmlDate: сега,
      status: 'pending' as const,
    }
    if (стар) {
      if (стар.newPrice !== p.newPrice || (стар.newCompare ?? null) !== p.newCompare) нови++
      await payload.update({ collection: 'price-approvals', id: стар.id, data, overrideAccess: true, depth: 0 })
    } else {
      await payload.create({ collection: 'price-approvals', data, overrideAccess: true, depth: 0 })
      нови++
    }
  }
  if (plan.samePrice.length) {
    const del = await payload.delete({
      collection: 'price-approvals',
      where: { and: [{ status: { equals: 'pending' } }, { product: { in: plan.samePrice } }] },
      overrideAccess: true,
    })
    махнати = del.docs.length
  }
  return { нови, махнати }
}

/** Решените одобрения се пазят 180 дни; чакащите — докато се решат. */
const чистиРешени = async (payload: Payload) => {
  const граница = new Date(Date.now() - 180 * 24 * 3600_000).toISOString()
  await payload.delete({
    collection: 'price-approvals',
    where: { and: [{ status: { in: ['approved', 'rejected'] } }, { decidedAt: { less_than: граница } }] },
    overrideAccess: true,
  })
}

/**
 * Опресняването на кеша — през HTTP, както при вноса: задачата по график
 * върви извън заявка към Next и куките на продуктите там не опресняват нищо.
 */
const опресниСайта = async (): Promise<string> => {
  const server = process.env.INTERNAL_SERVER_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  try {
    const r = await fetch(`${server}/api/products/revalidate`, {
      method: 'POST',
      headers: { 'x-revalidate-key': process.env.PAYLOAD_SECRET ?? '' },
      signal: AbortSignal.timeout(10_000),
    })
    return r.ok ? 'опреснен' : `отказ на опресняването (${r.status})`
  } catch {
    return `сървърът ${server} не отговаря — новото ще се види при следващия старт`
  }
}

const РЕЗУЛТАТ: Record<RunResult['result'], string> = {
  ok: 'успешна',
  partial: 'с грешки при отделни продукти',
  aborted: 'спряна без промени',
  error: 'грешка',
}

export const днес = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Sofia' })

/**
 * Записът — в една транзакция. ВНИМАНИЕ: при SQLite грешка по средата
 * (`SQLITE_BUSY`) вече записаните продукти остават (12 октомври 2026) —
 * пускай отвън само с `PRAGMA busy_timeout` (CLAUDE.md, „Връзка с dice.bg").
 * Цените в автоматичен режим носят пакета за „История на цените".
 */
const записвай = async (payload: Payload, plan: Plan, priceBatch: string) => {
  if (!plan.updates.length) return
  const req = await createLocalReq(
    { context: { diceSync: true, [ЦЕНОВИ_КОНТЕКСТ]: { source: 'sync', batch: priceBatch, user: 'синхронизация' } } },
    payload,
  )
  const tx = await payload.db.beginTransaction()
  if (tx) req.transactionID = tx
  try {
    for (const u of plan.updates) {
      await payload.update({
        collection: 'products',
        id: u.id,
        data: (u.draftOnly ? u.data : { ...u.data, _status: 'published' }) as never,
        ...(u.draftOnly ? { draft: true } : {}),
        depth: 0,
        overrideAccess: true,
        req,
      })
    }
    if (tx) await payload.db.commitTransaction(tx)
  } catch (e) {
    if (tx) await payload.db.rollbackTransaction(tx)
    throw new Error(`записът е прекъснат: ${(e as Error).message}`)
  }
}

const пазиПоследните = async (payload: Payload, keep: number) => {
  const стари = await payload.find({
    collection: 'dice-syncs', sort: '-createdAt', limit: 500, page: 1, depth: 0, overrideAccess: true, select: { title: true },
  })
  const излишни = стари.docs.slice(keep).map((d) => d.id)
  if (излишни.length) await payload.delete({ collection: 'dice-syncs', where: { id: { in: излишни } }, overrideAccess: true })
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

const процент = (p: { pct: number | null; abs: number | null }) =>
  p.pct === null ? '—' : `${p.pct > 0 ? '+' : ''}${p.pct.toFixed(1).replace('.', ',')} % (${p.abs! > 0 ? '+' : ''}${пари(p.abs)})`

const отчет = async (payload: Payload, to: string, result: RunResult['result'], message: string, plan: Plan | null, trigger: string) => {
  const ред = (cells: string[], th = false, bg = '') =>
    `<tr${bg ? ` style="background:${bg}"` : ''}>${cells.map((c) => `<${th ? 'th' : 'td'} style="border:1px solid #ddd;padding:4px 8px;text-align:left;font-size:13px">${esc(c)}</${th ? 'th' : 'td'}>`).join('')}</tr>`
  const таблица = (title: string, head: string[], rows: string[][], colors: string[] = []) =>
    rows.length
      ? `<h3 style="font:600 15px Arial;margin:20px 0 6px">${esc(title)} (${rows.length})</h3><table style="border-collapse:collapse;font-family:Arial">${ред(head, true)}${rows.map((r, i) => ред(r, false, colors[i] ?? '')).join('')}</table>`
      : ''

  // Всички чакащи сега — червените най-отгоре.
  let чакащиHtml = ''
  let чакащиText: string[] = []
  if (plan?.mode === 'test') {
    const r = await payload.find({
      collection: 'price-approvals', where: { status: { equals: 'pending' } }, sort: '-changeAbsPct', pagination: false, depth: 0, overrideAccess: true,
    })
    const docs = (r.docs as unknown as { productTitle?: string; currentPrice?: number; newPrice?: number; changePct?: number; changeAbs?: number; level?: string }[])
      .sort((a, b) => Number(b.level === 'red') - Number(a.level === 'red'))
    if (docs.length) {
      const линк = `${SITE_URL}/admin/collections/price-approvals`
      чакащиHtml =
        `<p style="font-size:15px;margin:12px 0"><strong>${docs.length} цени чакат одобрение</strong> — <a href="${линк}">Цени за одобрение</a></p>` +
        таблица(
          'Чакащи цени',
          ['Продукт', 'Сега', 'Нова', 'Промяна'],
          docs.map((d) => [
            `${d.level === 'red' ? '⚠ ' : ''}${d.productTitle ?? ''}`,
            пари(d.currentPrice), пари(d.newPrice),
            процент({ pct: d.changePct ?? null, abs: d.changeAbs ?? null }),
          ]),
          docs.map((d) => (d.level === 'red' ? '#fde2e1' : d.level === 'orange' ? '#fff1db' : '')),
        )
      чакащиText = [`${docs.length} цени чакат одобрение: ${линк}`, '']
    }
  }

  const html = `<div style="font-family:Arial,sans-serif;color:#111">
<p style="font-size:15px"><strong>Синхронизация с dice.bg — ${esc(РЕЗУЛТАТ[result])}</strong> (${esc(trigger)}, режим „${plan?.mode === 'auto' ? 'Автоматичен' : 'Тестов'}")</p>
${чакащиHtml}
<p style="font-size:14px">${esc(message)}</p>
${таблица('Промени', ['Продукт', 'Поле', 'Старо', 'Ново'], plan?.changes.map((c) => [c.product, c.field, c.old, c.new]) ?? [])}
${таблица('Грешки', ['Описание'], plan?.errors.map((e) => [e]) ?? [])}
${таблица('Предупреждения', ['Описание'], plan?.warnings.map((e) => [e]) ?? [])}
${таблица('Ненамерени в сайта (EcoFlow)', ['Име', 'Identifier', 'EAN'], plan?.notFound.map((r) => [r.name, r.sku, r.ean]) ?? [])}
${таблица('Пропуснати редове', ['Описание'], plan?.skipped.map((e) => [e]) ?? [])}
${таблица('Нередности във файла на dice', ['Име', 'Identifier', 'EAN', 'Нередност'], plan?.irregular.map((r) => [r.name, r.sku, r.ean, r.problem]) ?? [])}
</div>`
  const text = [
    `Синхронизация с dice.bg — ${РЕЗУЛТАТ[result]} (${trigger})`,
    ...чакащиText,
    message,
    '',
    ...(plan?.changes.map((c) => `${c.product} — ${c.field}: ${c.old} → ${c.new}`) ?? []),
    ...(plan?.errors ?? []),
    ...(plan?.warnings ?? []),
    ...(plan?.irregular.length ? ['', 'Нередности във файла на dice:', ...plan.irregular.map((r) => `${r.name} — Identifier ${r.sku || '—'}, EAN „${r.ean}": ${r.problem}`)] : []),
  ].join('\n')
  await payload.sendEmail({ to, subject: `dice.bg синхронизация: ${message.slice(0, 90)}`, html, text })
}
