'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

/** Колко секунди стои една част на телефон. */
const СЕКУНДИ = 4

/**
 * Тъмната лента най-горе („Безплатна доставка … · Гаранция 5 години").
 *
 * На компютър — целият текст, както досега. На телефон (`< 768px`) текстът
 * се пренасяше на два реда (`task-mobilna-optimizaciya.md`, т. 2): там
 * частите, разделени с „·", се редуват на един ред, по 4 s. Без движение —
 * просто смяна; при „намалено движение" няма и избледняване (globals.css).
 *
 * Екранният четец чете целия текст веднъж (`sr-only`); сменящата се част
 * е `aria-hidden`, иначе би се обявявала на всеки 4 s. Смяната спира,
 * докато разделът е скрит.
 */
export const AnnouncementBar = ({ text, url }: { text: string; url?: string | null }) => {
  const части = text
    .split(/\s+[·•|]\s+/)
    .map((x) => x.trim())
    .filter(Boolean)
  const [i, setI] = useState(0)

  useEffect(() => {
    if (части.length < 2) return
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') setI((x) => (x + 1) % части.length)
    }, СЕКУНДИ * 1000)
    return () => window.clearInterval(t)
  }, [части.length])

  const съдържание = (
    <>
      <span className="max-md:hidden">{text}</span>
      <span className="sr-only md:hidden">{text}</span>
      <span key={i} aria-hidden="true" className="fade-in block truncate md:hidden">
        {части[i] ?? text}
      </span>
    </>
  )

  return (
    <div className="bg-night text-white">
      <div className="container-site flex h-8 items-center justify-center text-center text-xs md:h-auto md:min-h-9 md:py-1.5">
        {url ? (
          <Link
            href={url}
            className="min-w-0 max-w-full cursor-pointer underline-offset-2 hover:underline max-md:flex max-md:min-h-8 max-md:items-center"
          >
            {съдържание}
          </Link>
        ) : (
          <span className="min-w-0 max-w-full">{съдържание}</span>
        )}
      </div>
    </div>
  )
}
