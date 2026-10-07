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
      if (!r.ok) throw new Error()
      window.location.assign(next)
    } catch {
      setError('Грешен имейл или парола.')
      setBusy(false)
    }
  }

  const input =
    'mt-1.5 h-11 w-full rounded-lg border border-[#d4d4d4] bg-white px-3 text-[15px] text-black outline-none transition-colors focus:border-black'

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
      <label className="block text-sm font-medium text-black">
        Имейл
        <input name="email" type="email" autoComplete="username" required className={input} />
      </label>
      <label className="block text-sm font-medium text-black">
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
        <p role="alert" className="text-sm text-[#c62828]">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="mt-1 h-11 cursor-pointer rounded-lg bg-black text-sm font-semibold text-white transition-colors hover:bg-[#222] disabled:cursor-wait disabled:opacity-70"
      >
        {busy ? 'Влизане…' : 'Вход'}
      </button>
      <Link href="/admin/forgot" className="text-center text-sm text-[#555] underline-offset-4 hover:text-black hover:underline">
        Забравена парола?
      </Link>
    </form>
  )
}
