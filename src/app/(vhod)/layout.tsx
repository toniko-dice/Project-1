import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import '../(frontend)/globals.css'

/*
  Страницата за вход при заключен сайт (`task-zaklyuchen-dostap.md`) — без
  хедър и футър, затова е в своя група със собствен корен. Шрифтът е като
  на сайта (`(frontend)/layout.tsx`), с кирилицата.
*/
const inter = Inter({ subsets: ['cyrillic', 'latin'], weight: ['400', '500', '600'], variable: '--font-sans', display: 'swap' })

export const metadata: Metadata = {
  title: 'EcoFlow България — вход',
  robots: { index: false, follow: false },
}

export default function VhodLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg" className={inter.variable}>
      <body className="bg-black">{children}</body>
    </html>
  )
}
