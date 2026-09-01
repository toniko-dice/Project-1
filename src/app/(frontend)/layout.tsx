import type { Metadata } from 'next'
import { Nunito_Sans, Rubik } from 'next/font/google'

import { DesignTokens } from '@/components/DesignTokens'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import './globals.css'

/*
  Двойката Rubik / Nunito Sans идва от препоръката на ui-ux-pro-max за електронна търговия.
  И двата шрифта покриват кирилица. display: swap предотвратява невидим текст при зареждане.
*/
const rubik = Rubik({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-rubik',
  display: 'swap',
})

const nunito = Nunito_Sans({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '600', '700'],
  variable: '--font-nunito',
  display: 'swap',
})

export const metadata: Metadata = {
  /*
    Без това Next оставя относителни адреси в og:image и данните за
    търсачките. Google не разчита относителен адрес и снимката не влиза
    в резултатите. Оправя целия сайт наведнъж, не само една страница.
  */
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'EcoFlow България — Портативни електроцентрали и домашно захранване',
    template: '%s — EcoFlow България',
  },
  description:
    'Официален вносител на EcoFlow за България. Портативни електроцентрали, домашни батерии, соларни панели и аксесоари.',
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg" className={`${rubik.variable} ${nunito.variable}`}>
      <head>
        <DesignTokens />
      </head>
      <body>
        {/* Прескачане на навигацията — първият елемент за клавиатурни потребители. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Към основното съдържание
        </a>

        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
