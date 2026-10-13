'use client'

import { Eye, EyeSlash } from '@phosphor-icons/react'
import Link from 'next/link'
import { useState, type FormEvent } from 'react'

/**
 * Формата на `/vhod` — входът на Payload (`POST /api/users/login`), същата
 * бисквитка `payload-token` като в админа: един вход за сайта и за админа.
 */
export const VhodForm = ({ next }: { next: string }) => {
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setBusy(true)
    setError('')
    try {
      const r = await fetch('/api/users/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
      })
      if (r.status === 429) {
        // Ограничението на nginx — 10 опита в минута от един адрес (без бан).
        setError('Твърде много опити за вход. Изчакайте минута и опитайте пак.')
        setBusy(false)
        return
      }
      if (!r.ok) {
        // Заключен профил (`maxLoginAttempts`) — Payload връща 401 със „…заключен" / „locked".
        const msg = ((await r.json().catch(() => null)) as { errors?: { message?: string }[] } | null)?.errors?.[0]?.message ?? ''
        setError(
          /заключен|locked/i.test(msg)
            ? 'Профилът е заключен за 15 минути след няколко грешни опита. Опитайте по-късно или помолете администратор да го отключи.'
            : 'Грешен имейл или парола.',
        )
        setBusy(false)
        return
      }
      window.location.assign(next)
    } catch {
      setError('Няма връзка със сървъра. Опитайте пак.')
      setBusy(false)
    }
  }

  // Цветовете са в `.vhod-*` (globals.css) — стъклената карта и бялата резерва без `backdrop-filter`.
  const input = 'vhod-input mt-1.5 h-[46px] w-full rounded-[10px] px-3 text-base text-black outline-none'

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
      <label className="vhod-label block text-[13px] font-medium">
        Имейл
        <input name="email" type="email" autoComplete="username" required className={input} />
      </label>
      <label className="vhod-label block text-[13px] font-medium">
        Парола
        <span className="relative block">
          <input
            name="password"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            required
            className={`${input} pr-11 [&::-ms-clear]:hidden [&::-ms-reveal]:hidden`}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? 'Скрий паролата' : 'Покажи паролата'}
            className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-[#666] hover:text-black"
          >
            {show ? <EyeSlash size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>
      {error ? (
        <p role="alert" className="vhod-error text-sm">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="vhod-button mt-1 h-[46px] cursor-pointer rounded-[10px] text-[15px] font-semibold transition-colors disabled:cursor-wait disabled:opacity-70"
      >
        {busy ? 'Влизане…' : 'Вход'}
      </button>
      <Link href="/admin/forgot" className="vhod-link text-center text-[13px] underline-offset-4 hover:underline">
        Забравена парола?
      </Link>
    </form>
  )
}
