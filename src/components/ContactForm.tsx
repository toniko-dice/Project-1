'use client'

import { ArrowClockwise, Check } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import { type ReactNode, useCallback, useEffect, useId, useRef, useState } from 'react'

import { type ContactErrors, MESSAGE_MAX, validateContact } from '@/lib/contact'

const inputCls = (bad: boolean, width = 'w-full') =>
  `h-12 ${width} rounded-lg border bg-surface px-3 text-base text-ink outline-none transition-colors placeholder:text-ink-muted/70 focus:border-ink ${
    bad ? 'border-alert' : 'border-line-strong'
  }`

const FieldError = ({ id, msg }: { id: string; msg?: string }) =>
  msg ? (
    <p id={id} className="mt-1 text-[13px] text-alert" role="alert">
      {msg}
    </p>
  ) : null

const Label = ({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) => (
  <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
    {children}
    <span className="text-alert"> *</span>
  </label>
)

type Fields = { name: string; phone: string; email: string; message: string; consent: boolean }
const EMPTY: Fields = { name: '', phone: '', email: '', message: '', consent: false }

/**
 * Формата на `/kontakti` (`task-futar.md`). Проверките — `validateContact`,
 * същите като на сървъра (`POST /api/kontakti`), който ги прави наново.
 * Защитата е като на формата за оферта: CAPTCHA (същият път за картинка),
 * капан `website`, честота на сървъра. При грешка попълненото остава.
 */
export const ContactForm = ({ privacyUrl, successText }: { privacyUrl: string; successText: string }) => {
  const uid = useId()
  const [f, setF] = useState<Fields>(EMPTY)
  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => setF((s) => ({ ...s, [k]: v }))

  const [captcha, setCaptcha] = useState<{ token: string; svg: string } | null>(null)
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const loadCaptcha = useCallback(async () => {
    let нов: { token: string; svg: string } | null = null
    try {
      const r = await fetch('/api/oferta/captcha', { cache: 'no-store' })
      нов = (await r.json()) as { token: string; svg: string }
    } catch {
      // Без връзка — полето остава без картинка; „Нов код" пробва пак.
    }
    setCaptcha(нов)
    setCaptchaAnswer('')
  }, [])
  useEffect(() => {
    // Картинката се тегли след зареждане (външна заявка) — както във формата за оферта.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCaptcha()
  }, [loadCaptcha])

  const [errors, setErrors] = useState<ContactErrors>({})
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const topRef = useRef<HTMLDivElement>(null)

  const err = (k: keyof ContactErrors) => errors[k]
  const aria = (k: keyof ContactErrors) =>
    errors[k] ? { 'aria-invalid': true as const, 'aria-describedby': `${uid}-${k}-err` } : {}

  const focusFirstError = (keys: string[]) =>
    requestAnimationFrame(() => {
      const el = formRef.current?.querySelector<HTMLElement>(keys.map((k) => `[data-field="${k}"]`).join(','))
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el?.querySelector<HTMLElement>('input,textarea')?.focus({ preventScroll: true })
    })

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (sending) return
    const local = validateContact(f)
    if (!captchaAnswer.trim()) local.captcha = 'Въведете символите от картинката.'
    setErrors(local)
    if (Object.keys(local).length) {
      setMessage('Моля, поправете отбелязаните полета.')
      focusFirstError(Object.keys(local))
      return
    }
    const website = String(new FormData(e.currentTarget).get('website') ?? '')

    setSending(true)
    setMessage('')
    try {
      const r = await fetch('/api/kontakti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...f,
          website,
          captchaToken: captcha?.token ?? '',
          captchaAnswer,
          page: document.referrer,
        }),
      })
      const j = (await r.json().catch(() => ({
        ok: false,
        message: 'Съобщението не беше прието поради грешка на сървъра. Попълненото е запазено — опитайте отново.',
        newCaptcha: true,
      }))) as { ok: boolean; email?: string; errors?: ContactErrors; message?: string; newCaptcha?: boolean }
      if (j.ok) {
        setDone(j.email ?? f.email)
        requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
        return
      }
      setErrors(j.errors ?? {})
      setMessage(j.message ?? 'Съобщението не беше изпратено. Опитайте отново.')
      if (j.newCaptcha) void loadCaptcha()
      if (j.errors) focusFirstError(Object.keys(j.errors))
    } catch {
      setMessage('Няма връзка със сървъра. Попълненото е запазено — опитайте отново след малко.')
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <div ref={topRef} className="scroll-mt-24 rounded-xl bg-surface p-7 text-center sm:p-10" role="status">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#e6f4ea] text-[#2b8a3e]">
          <Check size={28} weight="bold" aria-hidden="true" />
        </span>
        <p className="mx-auto mt-5 max-w-md text-lg font-medium">{successText.replace('{имейл}', done)}</p>
      </div>
    )
  }

  const дължина = f.message.trim().length

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={submit}
      className="relative flex flex-col gap-5 rounded-xl bg-surface p-5 sm:p-7 [&_input]:scroll-mt-24 [&_textarea]:scroll-mt-24"
    >
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

      <div data-field="name">
        <Label htmlFor={`${uid}-name`}>Име</Label>
        <input id={`${uid}-name`} className={inputCls(!!err('name'))} value={f.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" {...aria('name')} />
        <FieldError id={`${uid}-name-err`} msg={err('name')} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div data-field="phone">
          <Label htmlFor={`${uid}-phone`}>Телефон</Label>
          <input id={`${uid}-phone`} type="tel" inputMode="tel" className={inputCls(!!err('phone'))} value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+359 …" autoComplete="tel" {...aria('phone')} />
          <FieldError id={`${uid}-phone-err`} msg={err('phone')} />
        </div>
        <div data-field="email">
          <Label htmlFor={`${uid}-email`}>Имейл</Label>
          <input id={`${uid}-email`} type="email" inputMode="email" className={inputCls(!!err('email'))} value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="ime@primer.bg" autoComplete="email" {...aria('email')} />
          <FieldError id={`${uid}-email-err`} msg={err('email')} />
        </div>
      </div>

      <div data-field="message">
        <Label htmlFor={`${uid}-message`}>Съобщение</Label>
        <textarea
          id={`${uid}-message`}
          rows={6}
          maxLength={MESSAGE_MAX + 200}
          className={`${inputCls(!!err('message'))} h-auto min-h-36 py-2.5`}
          value={f.message}
          onChange={(e) => set('message', e.target.value)}
          {...aria('message')}
        />
        <div className="mt-1 flex items-start justify-between gap-3">
          <FieldError id={`${uid}-message-err`} msg={err('message')} />
          <span className={`ml-auto shrink-0 text-xs tabular ${дължина > MESSAGE_MAX ? 'text-alert' : 'text-ink-muted'}`} aria-live="polite">
            {дължина} / {MESSAGE_MAX}
          </span>
        </div>
      </div>

      <div data-field="consent">
        <label className="flex min-h-11 cursor-pointer items-start gap-3 py-1 text-sm leading-snug">
          <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-[#1a1a1a]" checked={f.consent} onChange={(e) => set('consent', e.target.checked)} {...aria('consent')} />
          <span>
            Съгласен/на съм личните ми данни да бъдат обработени съгласно{' '}
            <Link href={privacyUrl} target="_blank" className="underline underline-offset-4">
              Политиката за поверителност
            </Link>
            .<span className="text-alert"> *</span>
          </span>
        </label>
        <FieldError id={`${uid}-consent-err`} msg={err('consent')} />
      </div>

      <div data-field="captcha">
        <Label htmlFor={`${uid}-captcha`}>Въведете символите от картинката</Label>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="block h-14 w-[180px] overflow-hidden rounded-lg border border-line bg-canvas"
            role="img"
            aria-label="Код за проверка"
            dangerouslySetInnerHTML={{ __html: captcha?.svg ?? '' }}
          />
          <button type="button" onClick={() => void loadCaptcha()} className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm text-ink-muted hover:bg-tile hover:text-ink">
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
        className="inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-ink px-10 text-[15px] font-medium text-white transition-colors hover:bg-night disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:self-start"
      >
        {sending ? 'Изпращане…' : 'Изпрати съобщението'}
      </button>
    </form>
  )
}
