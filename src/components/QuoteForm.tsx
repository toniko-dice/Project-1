'use client'

import { ArrowClockwise, Check, MagnifyingGlass, Minus, Paperclip, Plus, X } from '@phosphor-icons/react'
import Link from 'next/link'
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'

import {
  CLIENT_TYPES,
  CONSULTATION,
  DOCUMENTS,
  FILE_ACCEPT,
  fileError,
  MAX_QTY,
  PROCUREMENT,
  PURPOSES,
  TIMEFRAMES,
  validateQuote,
  type QuotePayload,
} from '@/lib/quote/options'

export type QuoteProduct = { id: number; title: string; image: string | null; trimmed: boolean; search: string }
export type QuoteTab = { label: string; ids: number[] }
type Texts = { successTitle: string; successText: string; successCopy: string; successButton: string }

type Fields = Omit<QuotePayload, 'items' | 'consent'> & { consent: boolean }

const EMPTY: Fields = {
  clientType: '',
  organization: '',
  eik: '',
  city: '',
  contactName: '',
  position: '',
  email: '',
  phone: '',
  otherProducts: '',
  purposes: [],
  timeframe: '',
  budget: '',
  procurement: '',
  documents: [],
  deliveryTo: '',
  consultation: '',
  details: '',
  consent: false,
}

/* ─────────── дребни части ─────────── */

const inputCls = (bad: boolean, width = 'w-full') =>
  `h-11 ${width} rounded-lg border bg-surface px-3 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-muted/70 focus:border-ink ${
    bad ? 'border-alert' : 'border-line-strong'
  }`

const FieldError = ({ id, msg }: { id: string; msg?: string }) =>
  msg ? (
    <p id={id} className="mt-1 text-[13px] text-alert" role="alert">
      {msg}
    </p>
  ) : null

const Label = ({ htmlFor, children, req }: { htmlFor?: string; children: ReactNode; req?: boolean }) => (
  <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
    {children}
    {req ? <span className="text-alert"> *</span> : null}
  </label>
)

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  // `min-w-0`: fieldset по подразбиране не се свива под съдържанието си и плочките го разпъваха извън телефона.
  <fieldset className="min-w-0 rounded-xl bg-surface p-5 sm:p-7">
    <legend className="float-left mb-5 w-full text-lg font-semibold">{title}</legend>
    <div className="clear-both">{children}</div>
  </fieldset>
)

/**
 * Количеството — поле между − и + на плочката и в списъка (едно и също
 * число и на двете места: стойността е в общия списък).
 *
 * Само цифри (буквите се изхвърлят), от 1 до 9999; докато се пише, може да
 * е празно. При излизане от полето празно или 0 маха продукта. `type="text"`
 * с `inputMode="numeric"`, не `type="number"`: числовото поле приема „e",
 * „-" и „," и се върти с колелото на мишката.
 */
const QtyInput = ({
  value,
  onChange,
  label,
  compact = false,
}: {
  value: number
  onChange: (n: number) => void
  label: string
  compact?: boolean
}) => {
  const [text, setText] = useState(String(value))
  useEffect(() => setText(String(value)), [value])
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={4}
      autoComplete="off"
      aria-label={label}
      value={text}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 4)
        setText(digits)
        const n = Number(digits)
        if (digits && n >= 1) onChange(Math.min(n, MAX_QTY))
      }}
      onBlur={() => {
        const n = Number(text)
        if (!text || n < 1) onChange(0)
        else setText(String(value))
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          ;(e.target as HTMLInputElement).blur()
        }
      }}
      className={`rounded-md border border-line-strong bg-surface text-center tabular outline-none focus:border-ink ${
        compact ? 'h-8 w-12 px-1 text-sm font-semibold' : 'h-9 w-20 px-2 text-[15px]'
      }`}
    />
  )
}

/**
 * Снимката на плочка/ред — готовият малък файл (до 240 px, webp) като
 * обикновен `<img>`: без оптимизатора на Next, който в режим за разработка
 * оразмеряваше всяка снимка при първото поискване.
 */
const Thumb = ({ p, size, eager = false }: { p: QuoteProduct; size: number; eager?: boolean }) => (
  <span className="relative block shrink-0" style={{ width: size, height: size }}>
    {p.image ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={p.image}
        alt=""
        width={size}
        height={size}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className={`absolute inset-0 size-full object-contain ${p.trimmed ? 'p-[12%]' : ''}`}
      />
    ) : null}
  </span>
)

/*
  Всички плочки се зареждат мързеливо: те са под първия екран — над тях
  стоят въведението и трите реда с предимства. До 7 октомври 2026 първите
  12 се теглеха веднага, заедно с първото зареждане
  (`task-mobilna-optimizaciya.md`, т. 1).
*/

/* ─────────── формата ─────────── */

/**
 * Формата за оферта (`quoteForm`). Проверките са същите като на сървъра
 * (`validateQuote` в `src/lib/quote/options.ts`); сървърът ги прави наново.
 *
 * Продуктите: плочки по табове, търсене и списък „Избрани продукти" пълнят
 * ЕДИН общ списък (`избрани`: номер → бройка). Без цени.
 *
 * При грешка (поле, CAPTCHA, мрежа) попълненото остава — нищо не се чисти.
 */
export const QuoteFormClient = ({
  products,
  tabs,
  privacyUrl,
  texts,
}: {
  products: QuoteProduct[]
  tabs: QuoteTab[]
  privacyUrl: string
  texts: Texts
}) => {
  const uid = useId()
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])

  const [f, setF] = useState<Fields>(EMPTY)
  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => setF((s) => ({ ...s, [k]: v }))
  const toggleIn = (k: 'purposes' | 'documents', v: string) =>
    setF((s) => ({ ...s, [k]: s[k].includes(v) ? s[k].filter((x) => x !== v) : [...s[k], v] }))

  /* Избраните — по реда на добавяне. */
  const [избрани, setИзбрани] = useState<{ id: number; qty: number }[]>([])
  const qtyOf = (id: number) => избрани.find((i) => i.id === id)?.qty ?? 0
  const setQty = (id: number, qty: number) =>
    setИзбрани((list) => {
      if (qty < 1) return list.filter((i) => i.id !== id)
      return list.some((i) => i.id === id) ? list.map((i) => (i.id === id ? { ...i, qty } : i)) : [...list, { id, qty }]
    })
  const toggle = (id: number) => setQty(id, qtyOf(id) ? 0 : 1)
  const общо = избрани.reduce((s, i) => s + i.qty, 0)

  const [tab, setTab] = useState(0)
  const [q, setQ] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const намерени = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean)
    if (!words.length) return []
    return products.filter((p) => words.every((w) => p.search.includes(w))).slice(0, 8)
  }, [q, products])

  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [captcha, setCaptcha] = useState<{ token: string; svg: string } | null>(null)
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const loadCaptcha = useCallback(async () => {
    setCaptchaAnswer('')
    try {
      const r = await fetch('/api/oferta/captcha', { cache: 'no-store' })
      setCaptcha((await r.json()) as { token: string; svg: string })
    } catch {
      setCaptcha(null)
    }
  }, [])
  useEffect(() => {
    void loadCaptcha()
  }, [loadCaptcha])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<{ number: string | null; email: string } | null>(null)
  const [sheet, setSheet] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const topRef = useRef<HTMLDivElement>(null)

  const err = (k: string) => errors[k]
  const aria = (k: string) =>
    errors[k] ? { 'aria-invalid': true as const, 'aria-describedby': `${uid}-${k}-err` } : {}

  const focusFirstError = (keys: string[]) => {
    requestAnimationFrame(() => {
      const el = formRef.current?.querySelector<HTMLElement>(
        keys.map((k) => `[data-field="${k}"]`).join(','),
      )
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el?.querySelector<HTMLElement>('input,select,textarea,button')?.focus({ preventScroll: true })
    })
  }

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (sending) return
    const payload: QuotePayload = { ...f, items: избрани.map((i) => ({ product: i.id, quantity: i.qty })) }
    const local = validateQuote(payload)
    if (file) {
      const fe = fileError(file.name, file.type, file.size)
      if (fe) local.attachment = fe
    }
    if (!captchaAnswer.trim()) local.captcha = 'Въведете символите от картинката.'
    setErrors(local)
    if (Object.keys(local).length) {
      setMessage('Моля, поправете отбелязаните полета.')
      focusFirstError(Object.keys(local))
      return
    }

    const fd = new FormData(e.currentTarget) // капанът `website` идва оттук
    const body = new FormData()
    for (const [k, v] of Object.entries(f)) {
      if (Array.isArray(v)) v.forEach((x) => body.append(k, x))
      else if (k === 'consent') body.set(k, v ? 'yes' : '')
      else body.set(k, String(v))
    }
    body.set('items', JSON.stringify(payload.items))
    body.set('website', String(fd.get('website') ?? ''))
    body.set('captchaToken', captcha?.token ?? '')
    body.set('captchaAnswer', captchaAnswer)
    if (file) body.set('attachment', file)

    setSending(true)
    setMessage('')
    try {
      const r = await fetch('/api/oferta', { method: 'POST', body })
      // Отговор без JSON — грешка на сървъра, не на връзката.
      const j = (await r.json().catch(() => ({
        ok: false,
        message: 'Заявката не беше приета поради грешка на сървъра. Попълненото е запазено — опитайте отново или се обадете.',
        newCaptcha: true,
      }))) as {
        ok: boolean
        number?: string | null
        email?: string
        errors?: Record<string, string>
        message?: string
        newCaptcha?: boolean
      }
      if (j.ok) {
        setDone({ number: j.number ?? null, email: j.email ?? f.email })
        requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
        return
      }
      setErrors(j.errors ?? {})
      setMessage(j.message ?? 'Заявката не беше изпратена. Опитайте отново.')
      if (j.newCaptcha) void loadCaptcha()
      if (j.errors) focusFirstError(Object.keys(j.errors))
    } catch {
      setMessage('Няма връзка със сървъра. Попълненото е запазено — опитайте отново след малко.')
    } finally {
      setSending(false)
    }
  }

  /* ─────────── след изпращане ─────────── */

  if (done) {
    const title = done.number
      ? texts.successTitle.replace('{номер}', done.number)
      : texts.successTitle.replace(/\s*№\s*\{номер\}/, '')
    return (
      <div ref={topRef} className="mt-6 scroll-mt-24 rounded-xl bg-surface p-7 text-center sm:p-12" role="status">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#e6f4ea] text-[#2b8a3e]">
          <Check size={28} weight="bold" aria-hidden="true" />
        </span>
        <h3 className="mt-5 text-2xl font-semibold">{title}</h3>
        {texts.successText ? <p className="mx-auto mt-3 max-w-xl text-[15px] text-ink-muted">{texts.successText}</p> : null}
        {texts.successCopy && done.email ? (
          <p className="mx-auto mt-2 max-w-xl text-[15px] text-ink-muted">
            {texts.successCopy.replace('{имейл}', done.email)}
          </p>
        ) : null}
        <Link
          href="/"
          className="mt-7 inline-flex h-12 cursor-pointer items-center justify-center rounded-full bg-ink px-8 text-[15px] font-medium text-white hover:bg-night"
        >
          {texts.successButton}
        </Link>
      </div>
    )
  }

  /* ─────────── списъкът с избраните — на компютър под плочките, на телефон в панела отдолу ─────────── */

  const selectedList = (
    <div>
      {избрани.length ? (
        <ul className="divide-y divide-line">
          {избрани.map((i) => {
            const p = byId.get(i.id)
            if (!p) return null
            return (
              <li key={i.id} className="flex items-center gap-3 py-2.5">
                <Thumb p={p} size={44} />
                <span className="min-w-0 flex-1 text-sm leading-snug">{p.title}</span>
                <QtyInput value={i.qty} onChange={(n) => setQty(i.id, n)} label={`Количество — ${p.title}`} />
                <button
                  type="button"
                  onClick={() => setQty(i.id, 0)}
                  aria-label={`Махни ${p.title}`}
                  className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-tile hover:text-ink"
                >
                  <X size={16} weight="bold" aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="py-3 text-sm text-ink-muted">Още няма избрани продукти — изберете от плочките или потърсете по име.</p>
      )}
      <p className="mt-2 border-t border-line pt-3 text-sm font-semibold" aria-live="polite">
        Общо: {избрани.length} продукта, {общо} броя
      </p>
    </div>
  )

  const текущ = tabs[tab] ?? tabs[0]

  /*
    Полето на фокус не застава под лепнещия хедър горе, нито под лентата
    „Избрани (N)" долу на телефон (`task-mobilna-optimizaciya.md`, т. 5).
  */
  return (
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate
      className="mt-6 flex flex-col gap-5 max-md:[&_input]:scroll-mb-20 max-md:[&_input]:scroll-mt-20 max-md:[&_select]:scroll-mb-20 max-md:[&_textarea]:scroll-mb-20 max-md:[&_textarea]:scroll-mt-20"
    >
      <div ref={topRef} className="scroll-mt-24" />

      {/* Капан за роботи — невидим за човек и за екранни четци. */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        <label>
          Уебсайт
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      {message ? (
        <p className="rounded-lg border border-alert/30 bg-[#fff1f0] px-4 py-3 text-sm text-alert" role="alert">
          {message}
        </p>
      ) : null}

      {/* ─────────── А. Организация ─────────── */}
      <Section title="Организация">
        <div className="grid gap-4 sm:grid-cols-2">
          <div data-field="clientType" className="sm:col-span-2">
            <Label req>Тип клиент</Label>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Тип клиент" {...aria('clientType')}>
              {CLIENT_TYPES.map((o) => (
                <label
                  key={o.value}
                  className={`flex min-h-10 cursor-pointer items-center rounded-full border px-4 text-sm transition-colors max-md:min-h-11 max-md:text-[15px] ${
                    f.clientType === o.value ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface hover:border-ink'
                  }`}
                >
                  <input
                    type="radio"
                    name="clientType"
                    value={o.value}
                    checked={f.clientType === o.value}
                    onChange={() => set('clientType', o.value)}
                    className="sr-only"
                  />
                  {o.label}
                </label>
              ))}
            </div>
            <FieldError id={`${uid}-clientType-err`} msg={err('clientType')} />
          </div>
          <div data-field="organization">
            <Label htmlFor={`${uid}-org`} req>Име на организацията</Label>
            <input id={`${uid}-org`} className={inputCls(!!err('organization'))} value={f.organization} onChange={(e) => set('organization', e.target.value)} autoComplete="organization" {...aria('organization')} />
            <FieldError id={`${uid}-organization-err`} msg={err('organization')} />
          </div>
          <div data-field="eik">
            <Label htmlFor={`${uid}-eik`}>ЕИК / БУЛСТАТ (по желание)</Label>
            <input id={`${uid}-eik`} inputMode="numeric" className={inputCls(!!err('eik'))} value={f.eik} onChange={(e) => set('eik', e.target.value)} autoComplete="off" {...aria('eik')} />
            <FieldError id={`${uid}-eik-err`} msg={err('eik')} />
          </div>
          <div data-field="city" className="sm:col-span-2">
            <Label htmlFor={`${uid}-city`} req>Град / община</Label>
            <input id={`${uid}-city`} className={inputCls(!!err('city'))} value={f.city} onChange={(e) => set('city', e.target.value)} autoComplete="address-level2" {...aria('city')} />
            <FieldError id={`${uid}-city-err`} msg={err('city')} />
          </div>
        </div>
      </Section>

      {/* ─────────── Б. Лице за контакт ─────────── */}
      <Section title="Лице за контакт">
        <div className="grid gap-4 sm:grid-cols-2">
          <div data-field="contactName">
            <Label htmlFor={`${uid}-name`} req>Име и фамилия</Label>
            <input id={`${uid}-name`} className={inputCls(!!err('contactName'))} value={f.contactName} onChange={(e) => set('contactName', e.target.value)} autoComplete="name" {...aria('contactName')} />
            <FieldError id={`${uid}-contactName-err`} msg={err('contactName')} />
          </div>
          <div data-field="position">
            <Label htmlFor={`${uid}-pos`}>Длъжност</Label>
            <input id={`${uid}-pos`} className={inputCls(!!err('position'))} value={f.position} onChange={(e) => set('position', e.target.value)} autoComplete="organization-title" />
            <FieldError id={`${uid}-position-err`} msg={err('position')} />
          </div>
          <div data-field="email">
            <Label htmlFor={`${uid}-email`} req>Имейл</Label>
            <input id={`${uid}-email`} type="email" inputMode="email" className={inputCls(!!err('email'))} value={f.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" {...aria('email')} />
            <FieldError id={`${uid}-email-err`} msg={err('email')} />
          </div>
          <div data-field="phone">
            <Label htmlFor={`${uid}-phone`} req>Телефон</Label>
            <input id={`${uid}-phone`} type="tel" className={inputCls(!!err('phone'))} value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+359 …" autoComplete="tel" {...aria('phone')} />
            <FieldError id={`${uid}-phone-err`} msg={err('phone')} />
          </div>
        </div>
      </Section>

      {/* ─────────── В. Продукти и количества ─────────── */}
      <Section title="Продукти и количества">
        <div data-field="items">
          <p className="-mt-2 mb-4 text-sm text-ink-muted">
            Изберете продуктите от плочките или ги потърсете по име. Без цени — ние изготвяме офертата.
            <span className="text-alert"> *</span>
          </p>

          {/* Търсене */}
          <div className="relative mb-4">
            <label htmlFor={`${uid}-q`} className="mb-1.5 block text-sm font-medium">Добавете продукт</label>
            <div className="relative">
              <MagnifyingGlass size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
              <input
                id={`${uid}-q`}
                type="search"
                role="combobox"
                aria-expanded={searchOpen && намерени.length > 0}
                aria-controls={`${uid}-q-list`}
                autoComplete="off"
                placeholder="Напр. delta 3, панел 400W, кабел…"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setSearchOpen(true)
                }}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (намерени[0]) {
                      if (!qtyOf(намерени[0].id)) setQty(намерени[0].id, 1)
                      setQ('')
                    }
                  }
                  if (e.key === 'Escape') setSearchOpen(false)
                }}
                className={`${inputCls(false)} pl-10`}
              />
            </div>
            {searchOpen && намерени.length ? (
              <ul id={`${uid}-q-list`} role="listbox" className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-lg border border-line bg-surface py-1 shadow-lg">
                {намерени.map((p) => {
                  const in_ = qtyOf(p.id) > 0
                  return (
                    <li key={p.id} role="option" aria-selected={in_}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          if (!in_) setQty(p.id, 1)
                          setQ('')
                          setSearchOpen(false)
                        }}
                        className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left text-sm hover:bg-tile"
                      >
                        <Thumb p={p} size={36} />
                        <span className="flex-1">{p.title}</span>
                        {in_ ? <span className="text-xs text-ink-muted">избран</span> : <Plus size={14} aria-hidden="true" />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : searchOpen && q.trim().length > 1 ? (
              <p className="absolute z-20 mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-muted shadow-lg">
                Няма такъв продукт — опишете го в „Други продукти или изисквания“.
              </p>
            ) : null}
          </div>

          {/* Табове */}
          <div role="tablist" aria-label="Категории" className="scroll-row mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {tabs.map((t, i) => (
              <button
                key={t.label}
                type="button"
                role="tab"
                aria-selected={i === tab}
                onClick={() => setTab(i)}
                className={`h-9 shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-4 text-sm transition-colors ${
                  i === tab ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface hover:border-ink'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Плочки */}
          <div role="tabpanel" className="max-h-[440px] overflow-y-auto rounded-lg border border-line bg-canvas p-2 sm:max-h-[520px]">
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {(текущ?.ids ?? []).map((id) => {
                const p = byId.get(id)
                if (!p) return null
                const n = qtyOf(id)
                return (
                  <li
                    key={id}
                    className={`relative flex flex-col rounded-lg bg-surface transition-shadow ${
                      n ? 'ring-2 ring-ink' : 'ring-1 ring-line hover:ring-line-strong'
                    }`}
                  >
                    <button
                      type="button"
                      aria-pressed={n > 0}
                      onClick={() => toggle(id)}
                      className="flex flex-1 cursor-pointer flex-col items-center gap-1.5 p-2 text-center"
                    >
                      <Thumb p={p} size={96} />
                      <span className="line-clamp-3 text-[12px] leading-tight">{p.title}</span>
                    </button>
                    {n ? (
                      <>
                        <span className="pointer-events-none absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-ink text-white">
                          <Check size={12} weight="bold" aria-hidden="true" />
                        </span>
                        <div className="flex items-center justify-between gap-1 border-t border-line px-1.5 py-1">
                          <button type="button" onClick={() => setQty(id, n - 1)} aria-label={`По-малко — ${p.title}`} className="flex size-8 cursor-pointer items-center justify-center rounded-full hover:bg-tile">
                            <Minus size={14} weight="bold" aria-hidden="true" />
                          </button>
                          <QtyInput compact value={n} onChange={(q) => setQty(id, q)} label={`Количество — ${p.title}`} />
                          <button type="button" onClick={() => setQty(id, Math.min(n + 1, MAX_QTY))} aria-label={`Повече — ${p.title}`} className="flex size-8 cursor-pointer items-center justify-center rounded-full hover:bg-tile">
                            <Plus size={14} weight="bold" aria-hidden="true" />
                          </button>
                        </div>
                      </>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Избраните — на компютър */}
          <div className="mt-5 hidden rounded-lg border border-line p-4 md:block">
            <h4 className="mb-1 text-[15px] font-semibold">Избрани продукти</h4>
            {selectedList}
          </div>
          <FieldError id={`${uid}-items-err`} msg={err('items')} />

          <div data-field="otherProducts" className="mt-5">
            <Label htmlFor={`${uid}-other`}>Други продукти или изисквания</Label>
            <textarea id={`${uid}-other`} rows={3} className={`${inputCls(!!err('otherProducts'))} h-auto py-2.5`} value={f.otherProducts} onChange={(e) => set('otherProducts', e.target.value)} placeholder="Неща, които ги няма в списъка — модел, количество, изисквания." />
            <FieldError id={`${uid}-otherProducts-err`} msg={err('otherProducts')} />
          </div>
        </div>

        {/* Избраните — на телефон: лента отдолу, отваря панел */}
        <div className="sticky bottom-0 z-30 -mx-5 mt-4 md:hidden">
          {sheet ? (
            <div className="max-h-[60vh] overflow-y-auto rounded-t-xl border-t border-line bg-surface px-5 pb-3 pt-4 shadow-[0_-8px_24px_rgba(0,0,0,0.12)]">
              <div className="mb-1 flex items-center justify-between">
                <h4 className="text-[15px] font-semibold">Избрани продукти</h4>
                <button type="button" onClick={() => setSheet(false)} aria-label="Затвори списъка" className="flex size-9 cursor-pointer items-center justify-center rounded-full hover:bg-tile">
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              {selectedList}
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setSheet((s) => !s)}
            aria-expanded={sheet}
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 bg-ink text-[15px] font-medium text-white"
          >
            Избрани ({избрани.length}) · {общо} бр.
          </button>
        </div>
      </Section>

      {/* ─────────── Г. Подробности ─────────── */}
      <Section title="Подробности">
        <div className="grid gap-5 sm:grid-cols-2">
          <div data-field="purposes" className="sm:col-span-2">
            <Label>За какво ще се ползват</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {PURPOSES.map((o) => (
                <label key={o.value} className="flex cursor-pointer items-center gap-2.5 text-sm max-md:min-h-11">
                  <input type="checkbox" className="size-4 accent-[#1a1a1a] max-md:size-5" checked={f.purposes.includes(o.value)} onChange={() => toggleIn('purposes', o.value)} />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
          <div data-field="timeframe">
            <Label htmlFor={`${uid}-time`}>Кога ви трябват</Label>
            <select id={`${uid}-time`} className={inputCls(false)} value={f.timeframe} onChange={(e) => set('timeframe', e.target.value)}>
              <option value="">— изберете —</option>
              {TIMEFRAMES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div data-field="procurement">
            <Label htmlFor={`${uid}-proc`}>Начин на възлагане</Label>
            <select id={`${uid}-proc`} className={inputCls(false)} value={f.procurement} onChange={(e) => set('procurement', e.target.value)}>
              <option value="">— изберете —</option>
              {PROCUREMENT.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div data-field="budget">
            <Label htmlFor={`${uid}-budget`}>Ориентировъчен бюджет</Label>
            <input id={`${uid}-budget`} className={inputCls(!!err('budget'))} value={f.budget} onChange={(e) => set('budget', e.target.value)} />
            <FieldError id={`${uid}-budget-err`} msg={err('budget')} />
          </div>
          <div data-field="deliveryTo">
            <Label htmlFor={`${uid}-deliv`}>Доставка до</Label>
            <input id={`${uid}-deliv`} className={inputCls(!!err('deliveryTo'))} value={f.deliveryTo} onChange={(e) => set('deliveryTo', e.target.value)} placeholder="Адрес или град" />
            <FieldError id={`${uid}-deliveryTo-err`} msg={err('deliveryTo')} />
          </div>
          <div data-field="documents">
            <Label>Нужни документи</Label>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {DOCUMENTS.map((o) => (
                <label key={o.value} className="flex cursor-pointer items-center gap-2.5 text-sm max-md:min-h-11">
                  <input type="checkbox" className="size-4 accent-[#1a1a1a] max-md:size-5" checked={f.documents.includes(o.value)} onChange={() => toggleIn('documents', o.value)} />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
          <div data-field="consultation">
            <Label>Нужна ли е консултация или монтаж</Label>
            <div className="flex gap-6">
              {CONSULTATION.map((o) => (
                <label key={o.value} className="flex cursor-pointer items-center gap-2.5 text-sm max-md:min-h-11">
                  <input type="radio" name="consultation" className="size-4 accent-[#1a1a1a] max-md:size-5" checked={f.consultation === o.value} onChange={() => set('consultation', o.value)} />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
          <div data-field="attachment" className="sm:col-span-2">
            <Label htmlFor={`${uid}-file`}>Прикачен файл</Label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-line-strong bg-surface px-4 text-sm hover:border-ink">
                <Paperclip size={16} aria-hidden="true" />
                {file ? 'Друг файл' : 'Изберете файл'}
                <input
                  ref={fileRef}
                  id={`${uid}-file`}
                  type="file"
                  accept={FILE_ACCEPT}
                  className="sr-only"
                  onChange={(e) => {
                    const fl = e.target.files?.[0] ?? null
                    setFile(fl)
                    setErrors((s) => {
                      const { attachment: _, ...rest } = s
                      const fe = fl ? fileError(fl.name, fl.type, fl.size) : null
                      return fe ? { ...rest, attachment: fe } : rest
                    })
                  }}
                />
              </label>
              {file ? (
                <span className="flex items-center gap-2 text-sm">
                  {file.name} <span className="text-ink-muted">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null)
                      if (fileRef.current) fileRef.current.value = ''
                    }}
                    aria-label="Махни файла"
                    className="flex size-8 cursor-pointer items-center justify-center rounded-full hover:bg-tile"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </span>
              ) : (
                <span className="text-[13px] text-ink-muted">PDF, DOC, DOCX, XLS, XLSX, JPG или PNG, до 10 MB</span>
              )}
            </div>
            <FieldError id={`${uid}-attachment-err`} msg={err('attachment')} />
          </div>
          <div data-field="details" className="sm:col-span-2">
            <Label htmlFor={`${uid}-details`}>Допълнителна информация</Label>
            <textarea id={`${uid}-details`} rows={4} className={`${inputCls(!!err('details'))} h-auto py-2.5`} value={f.details} onChange={(e) => set('details', e.target.value)} />
            <FieldError id={`${uid}-details-err`} msg={err('details')} />
          </div>
        </div>
      </Section>

      {/* ─────────── Д. Съгласие, CAPTCHA, изпращане ─────────── */}
      <div className="rounded-xl bg-surface p-5 sm:p-7">
        <div data-field="consent">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug max-md:min-h-11 max-md:py-1">
            <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[#1a1a1a] max-md:size-5" checked={f.consent} onChange={(e) => set('consent', e.target.checked)} {...aria('consent')} />
            <span>
              Съгласен/на съм с{' '}
              <Link href={privacyUrl} target="_blank" className="underline underline-offset-4">
                Политиката за поверителност
              </Link>
              <span className="text-alert"> *</span>
            </span>
          </label>
          <FieldError id={`${uid}-consent-err`} msg={err('consent')} />
        </div>

        <div data-field="captcha" className="mt-6">
          <Label htmlFor={`${uid}-captcha`} req>Въведете символите от картинката</Label>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="block h-14 w-[180px] overflow-hidden rounded-lg border border-line bg-canvas"
              role="img"
              aria-label="Код за проверка"
              dangerouslySetInnerHTML={{ __html: captcha?.svg ?? '' }}
            />
            <button type="button" onClick={() => void loadCaptcha()} className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm text-ink-muted hover:bg-tile hover:text-ink">
              <ArrowClockwise size={16} aria-hidden="true" />
              Нов код
            </button>
            <input
              id={`${uid}-captcha`}
              className={inputCls(!!err('captcha'), 'w-44')}
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              {...aria('captcha')}
            />
          </div>
          <FieldError id={`${uid}-captcha-err`} msg={err('captcha')} />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="mt-7 inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-ink px-10 text-[15px] font-medium text-white transition-colors hover:bg-night disabled:cursor-wait disabled:opacity-60 sm:w-auto"
        >
          {sending ? 'Изпращане…' : 'Изпрати заявката'}
        </button>
      </div>
    </form>
  )
}
