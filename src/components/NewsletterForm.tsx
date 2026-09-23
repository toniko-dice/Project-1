'use client'

import { useState } from 'react'

/**
 * Форма за абониране за бюлетина.
 *
 * Праща към `POST /api/subscribers/subscribe` — сървърен път, който прави
 * проверките. Колекцията „Абонати" не е отворена за публично създаване.
 *
 * Отметката за съгласие е задължителна и текстът ѝ идва от „Общи
 * настройки", защото при промяна в закона се сменя от админа, не от кода.
 */
export const NewsletterForm = ({ consentText }: { consentText: string }) => {
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [company, setCompany] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!consent) {
      setError('Нужно е съгласие, за да ви запишем.')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/subscribers/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          consent,
          company,
          source: window.location.pathname,
        }),
      })

      const data = (await res.json()) as { ok?: boolean; message?: string; error?: string }

      if (res.ok && data.ok) {
        setDone(data.message ?? 'Благодарим!')
      } else {
        setError(data.error ?? 'Нещо се обърка. Опитайте по-късно.')
      }
    } catch {
      setError('Няма връзка със сървъра. Проверете интернета си.')
    } finally {
      setSending(false)
    }
  }

  // Съобщението застава на мястото на формата — няма какво повече да се прави тук.
  if (done) {
    return (
      <p role="status" className="text-sm font-medium text-brand">
        {done}
      </p>
    )
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="newsletter-email" className="mb-1 block text-xs font-medium">
            Имейл адрес
          </label>
          <input
            id="newsletter-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? 'newsletter-error' : undefined}
            placeholder="ime@primer.bg"
            className="min-h-11 w-full rounded-md border border-line bg-surface px-3 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="mt-auto inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-brand px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-dark disabled:cursor-default disabled:opacity-60"
        >
          {sending ? 'Изпращане…' : 'Абонирайте се'}
        </button>
      </div>

      {/*
        Капан за роботи. Скрит е от очи и от екранни четци, а `tabIndex`
        го изважда от реда на фокуса — човек няма как да го попълни.
      */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="newsletter-company">Фирма</label>
        <input
          id="newsletter-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs leading-relaxed">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 cursor-pointer"
        />
        <span className="text-ink-muted">{consentText}</span>
      </label>

      {error ? (
        <p id="newsletter-error" role="alert" className="mt-2 text-xs font-medium text-alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}
