import { createLocalReq, type Payload } from 'payload'

import type { Availability } from '../availability'
import { AVAILABILITY } from '../availability'
import { createBackup } from '../backup'
import { formatEur } from '../format'
import { isLastPiece } from './last-piece'
import { DiceFileError, type DiceRow, isEcoFlow, mapAvailability, parseDiceXml } from './parse'

/**
 * Синхронизация с dice.bg (`task-dice-xml-sinhronizaciya.md`).
 *
 *   plan  — тегли файла и пресмята какво би се сменило (бутонът „Провери");
 *   run   — същото, плюс предпазителите, записа в една транзакция, лога,
 *           опресняването на сайта и отчета по имейл.
 *
 * Пипат се САМО цена, стара цена, наличност и брой. Продукти не се
 * създават, не се трият, не се публикуват. Съвпадение — по SKU, после по
 * EAN (`ean`, `ean2`); по име никога.
 */

export type DiceSettings = {
  enabled?: boolean | null
  url?: string | null
  hour?: number | null
  updatePrice?: boolean | null
  updateAvailability?: boolean | null
  lastPieceThreshold?: number | null
  reportEmail?: string | null
  lastMatched?: number | null
  lastAutoDate?: string | null
  backupDone?: boolean | null
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
export type Plan = {
  rows: number
  matched: number
  changes: Change[]
  updates: { id: number; title: string; data: Record<string, unknown>; draftOnly: boolean }[]
  unchanged: number
  notFound: { sku: string; ean: string; name: string }[]
  missingInFile: { id: number; title: string }[]
  withoutIds: { id: number; title: string }[]
  skippedNoSync: number
  errors: string[]
  abort: string | null
}

const ПОЛЕ = { price: 'Цена', compareAtPrice: 'Стара цена', availability: 'Наличност', stockQty: 'Брой' } as const
const норм = (s: string | null | undefined) => (s ?? '').trim().toLowerCase()
const цифри = (s: string | null | undefined) => (s ?? '').replace(/\D/g, '')
const пари = (n: number | null | undefined) => (typeof n === 'number' ? formatEur(n) : '—')
const наличност = (v: string | null | undefined) => (v ? (AVAILABILITY[v as Availability]?.admin ?? v) : '—')

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

export const planSync = async (payload: Payload, rows: DiceRow[], s: DiceSettings): Promise<Plan> => {
  const updatePrice = s.updatePrice !== false
  const updateAvailability = s.updateAvailability !== false
  const threshold = typeof s.lastPieceThreshold === 'number' ? s.lastPieceThreshold : 1

  const products = await всичкиПродукти(payload)
  const поSku = new Map<string, Product[]>()
  const поEan = new Map<string, Product[]>()
  const добави = (m: Map<string, Product[]>, k: string, p: Product) => k && m.set(k, [...(m.get(k) ?? []), p])
  for (const p of products) {
    добави(поSku, норм(p.sku), p)
    добави(поEan, цифри(p.ean), p)
    if (цифри(p.ean2) !== цифри(p.ean)) добави(поEan, цифри(p.ean2), p)
  }

  const plan: Plan = {
    rows: rows.length, matched: 0, changes: [], updates: [], unchanged: 0, notFound: [],
    missingInFile: [], withoutIds: [], skippedNoSync: 0, errors: [], abort: null,
  }
  const видяни = new Set<number>()
  const цени: { old: number; new: number }[] = []

  for (const row of rows) {
    const етикет = `${row.name || '(без име)'} [SKU ${row.sku ?? '—'}, EAN ${row.ean ?? '—'}]`
    const поКод = row.sku ? (поSku.get(норм(row.sku)) ?? []) : []
    const поБаркод = row.ean ? (поEan.get(цифри(row.ean)) ?? []) : []

    if (поКод.length > 1) { plan.errors.push(`${етикет}: SKU съвпада с ${поКод.length} продукта (${поКод.map((p) => p.title).join(', ')}) — не е пипнат`); continue }
    if (!поКод.length && поБаркод.length > 1) { plan.errors.push(`${етикет}: EAN съвпада с ${поБаркод.length} продукта (${поБаркод.map((p) => p.title).join(', ')}) — не е пипнат`); continue }
    if (поКод.length && поБаркод.length && !поБаркод.some((p) => p.id === поКод[0]!.id)) {
      plan.errors.push(`${етикет}: SKU сочи „${поКод[0]!.title}", а EAN — „${поБаркод[0]!.title}" — не е пипнат`)
      continue
    }
    const p = поКод[0] ?? поБаркод[0]
    if (!p) {
      if (isEcoFlow(row)) plan.notFound.push({ sku: row.sku ?? '', ean: row.ean ?? '', name: row.name })
      continue
    }
    if (видяни.has(p.id)) { plan.errors.push(`${етикет}: „${p.title}" вече е съвпаднал с друг ред във файла — вторият не е пипнат`); continue }
    видяни.add(p.id)
    plan.matched++
    if (p.noSync) { plan.skippedNoSync++; continue }

    const data: Record<string, unknown> = {}
    if (updatePrice) {
      if (row.price === null || row.price <= 0) {
        plan.errors.push(`${p.title}: невалидна цена във файла („${row.priceRaw}") — продуктът не е пипнат`)
        continue
      }
      if (row.price !== p.price) {
        data.price = row.price
        if (typeof p.price === 'number' && p.price > 0) цени.push({ old: p.price, new: row.price })
      }
      // Стара цена — само ако е по-висока от крайната; иначе намалението е отпаднало.
      const стара = row.oldPrice !== null && row.oldPrice > row.price ? row.oldPrice : null
      if ((p.compareAtPrice ?? null) !== стара) data.compareAtPrice = стара
    }
    if (updateAvailability) {
      const a = mapAvailability(row)
      if (a === 'unknown') plan.errors.push(`${p.title}: непозната наличност „${row.availabilityRaw}" — наличността не е пипната`)
      else if (a && a !== (p.availability ?? 'in-stock')) data.availability = a
      if (row.qty !== null && row.qty !== (p.stockQty ?? null)) data.stockQty = row.qty
    }

    const ключове = Object.keys(data) as (keyof typeof ПОЛЕ)[]
    if (!ключове.length) { plan.unchanged++; continue }
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

  /* Предпазители — при съмнение нищо не се записва. */
  const предишни = s.lastMatched ?? 0
  if (предишни > 0 && plan.matched < предишни * 0.5) {
    plan.abort = `Съвпаднаха ${plan.matched} продукта, а предния път — ${предишни}. Вероятно файлът е непълен или с друг формат.`
  } else if (plan.matched > 0) {
    const скокове = цени.filter((c) => Math.abs(c.new - c.old) / c.old > 0.4).length
    if (скокове > plan.matched * 0.3) {
      plan.abort = `${скокове} от ${plan.matched} съвпаднали продукта биха сменили цената с над 40 %. Вероятно грешка във файла.`
    }
  }
  return plan
}

/* ─────────── пускане ─────────── */

export type RunResult = { result: 'ok' | 'partial' | 'aborted' | 'error'; plan: Plan | null; message: string; logId?: number }

const g = globalThis as { __diceSyncRunning?: boolean }

export const runSync = async (
  payload: Payload,
  opts: { trigger: 'автоматично' | 'ръчно'; user?: string | null; attempts?: number },
): Promise<RunResult> => {
  if (g.__diceSyncRunning) return { result: 'aborted', plan: null, message: 'Предната синхронизация още върви — пропуснато.' }
  g.__diceSyncRunning = true
  const s = (await payload.findGlobal({ slug: 'dice-sync', depth: 0, overrideAccess: true })) as DiceSettings
  let plan: Plan | null = null
  let result: RunResult['result'] = 'ok'
  let message = ''
  let revalidated = ''
  try {
    if (!s.url?.trim()) throw new DiceFileError('Няма адрес на XML файла в „Връзка с dice.bg".')
    const rows = parseDiceXml(await fetchDiceXml(s.url.trim(), opts.attempts ?? 1))
    plan = await planSync(payload, rows, s)

    if (plan.abort) {
      result = 'aborted'
      message = `Спряна без промени: ${plan.abort}`
    } else {
      if (plan.updates.length && !s.backupDone) {
        // Преди първата истинска синхронизация — архив на базата.
        await createBackup(payload, { includeMedia: false, label: 'Преди първата синхронизация с dice.bg', trigger: 'ръчно' })
        await payload.updateGlobal({ slug: 'dice-sync', data: { backupDone: true }, overrideAccess: true, depth: 0 })
      }
      await записвай(payload, plan)
      result = plan.errors.length ? 'partial' : 'ok'
      message = `Обновени ${new Set(plan.updates.map((u) => u.id)).size} продукта, без промяна ${plan.unchanged}, ненамерени ${plan.notFound.length}, грешки ${plan.errors.length}.`
      if (plan.updates.length) revalidated = await опресниСайта()
    }
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
      summary: message + (revalidated ? `\nСайт: ${revalidated}` : ''),
      updated: plan ? new Set(plan.updates.map((u) => u.id)).size : 0,
      unchanged: plan?.unchanged ?? 0,
      notFoundCount: plan?.notFound.length ?? 0,
      errorCount: plan?.errors.length ?? (result === 'ok' ? 0 : 1),
      changes: plan?.changes.map((c) => `${c.product} — ${c.field}: ${c.old} → ${c.new}`).join('\n') ?? '',
      notFound: plan?.notFound.map((r) => `${r.name || '(без име)'} — SKU ${r.sku || '—'}, EAN ${r.ean || '—'}`).join('\n') ?? '',
      missingInFile: plan?.missingInFile.map((p) => p.title).join('\n') ?? '',
      errors: [...(plan?.errors ?? []), ...(result === 'aborted' || result === 'error' ? [message] : [])].join('\n'),
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
      ...(plan && !plan.abort && result !== 'error' ? { lastMatched: plan.matched } : {}),
      ...(opts.trigger === 'автоматично' ? { lastAutoDate: днес() } : {}),
    },
  })

  if (s.reportEmail?.trim() && (result !== 'ok' || (plan && (plan.changes.length || plan.errors.length)))) {
    await отчет(payload, s.reportEmail.trim(), result, message, plan, opts.trigger).catch((e) =>
      payload.logger.error(`dice.bg: отчетът не се изпрати — ${(e as Error).message}`),
    )
  }
  return { result, plan, message, logId: log.id as number }
}

/**
 * Опресняването на кеша — през HTTP, както при вноса: задачата по график
 * върви извън заявка към Next и куките на продуктите там не опресняват нищо.
 */
const опресниСайта = async (): Promise<string> => {
  const server = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
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

/** Записът — в ЕДНА транзакция; при грешка нищо не остава наполовина. */
const записвай = async (payload: Payload, plan: Plan) => {
  if (!plan.updates.length) return
  const req = await createLocalReq({ context: { diceSync: true } }, payload)
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
    throw new Error(`записът е върнат изцяло: ${(e as Error).message}`)
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

const отчет = async (payload: Payload, to: string, result: RunResult['result'], message: string, plan: Plan | null, trigger: string) => {
  const ред = (cells: string[], th = false) =>
    `<tr>${cells.map((c) => `<${th ? 'th' : 'td'} style="border:1px solid #ddd;padding:4px 8px;text-align:left;font-size:13px">${esc(c)}</${th ? 'th' : 'td'}>`).join('')}</tr>`
  const таблица = (title: string, head: string[], rows: string[][]) =>
    rows.length
      ? `<h3 style="font:600 15px Arial;margin:20px 0 6px">${esc(title)} (${rows.length})</h3><table style="border-collapse:collapse;font-family:Arial">${ред(head, true)}${rows.map((r) => ред(r)).join('')}</table>`
      : ''
  const html = `<div style="font-family:Arial,sans-serif;color:#111">
<p style="font-size:15px"><strong>Синхронизация с dice.bg — ${esc(РЕЗУЛТАТ[result])}</strong> (${esc(trigger)})</p>
<p style="font-size:14px">${esc(message)}</p>
${таблица('Промени', ['Продукт', 'Поле', 'Старо', 'Ново'], plan?.changes.map((c) => [c.product, c.field, c.old, c.new]) ?? [])}
${таблица('Грешки', ['Описание'], plan?.errors.map((e) => [e]) ?? [])}
${таблица('Ненамерени в сайта (EcoFlow)', ['Име', 'SKU', 'EAN'], plan?.notFound.map((r) => [r.name, r.sku, r.ean]) ?? [])}
</div>`
  const text = [`Синхронизация с dice.bg — ${РЕЗУЛТАТ[result]} (${trigger})`, message, '', ...(plan?.changes.map((c) => `${c.product} — ${c.field}: ${c.old} → ${c.new}`) ?? []), ...(plan?.errors ?? [])].join('\n')
  await payload.sendEmail({ to, subject: `dice.bg синхронизация: ${message.slice(0, 90)}`, html, text })
}
