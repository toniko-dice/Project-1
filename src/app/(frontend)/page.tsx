import type { Metadata } from 'next'
import Link from 'next/link'

import type { Page } from '@/payload-types'
import { RenderBlocks } from '@/components/RenderBlocks'
import { getGlobal, getPage } from '@/lib/payload'
import { mediaUrl } from '@/lib/media'
import { ORGANIZATION_ID, organizationSchema } from '@/lib/organization'
import { absoluteUrl } from '@/lib/site-url'
import { finalTitle, HOME_H1_DEFAULT, pageTitle, SITE_NAME } from '@/lib/title'

/** Снимката за споделяне: от SEO полето, иначе първият слайд на банера, иначе логото. */
const снимкаЗаСподеляне = (
  page: Page,
  logo: Parameters<typeof mediaUrl>[0],
): string | null => {
  const own = mediaUrl(page.metaImage, 'banner')
  if (own) return own
  for (const block of page.layout ?? []) {
    if (block.blockType !== 'heroBanner' || block.hidden) continue
    const first = mediaUrl(block.slides?.[0]?.image, 'banner')
    if (first) return first
  }
  return mediaUrl(logo)
}

/**
 * Профил в социалните мрежи — само истински адрес. Във футъра стоят
 * `https://facebook.com` и подобни заместители (без път); `sameAs` с тях
 * би казал на Google, че фирмата Е самият Facebook.
 */
const истинскиПрофил = (url?: string | null): boolean => {
  try {
    const u = new URL(url ?? '')
    return /^https?:$/.test(u.protocol) && u.pathname.replace(/\/+$/, '').length > 1
  } catch {
    return false
  }
}

export const generateMetadata = async (): Promise<Metadata> => {
  const [page, settings] = await Promise.all([getPage('home'), getGlobal('site-settings')])
  if (!page) return {}

  const title = page.metaTitle?.trim() || SITE_NAME
  const description = page.metaDescription ?? undefined
  const image = снимкаЗаСподеляне(page, settings.logo)
  const url = absoluteUrl('/')

  return {
    title: pageTitle(title),
    description,
    alternates: { canonical: url },
    openGraph: {
      title: finalTitle(title),
      description,
      url,
      type: 'website',
      locale: 'bg_BG',
      siteName: SITE_NAME,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: finalTitle(title),
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

export default async function HomePage() {
  const [page, settings, footer, header] = await Promise.all([
    getPage('home'),
    getGlobal('site-settings'),
    getGlobal('footer'),
    getGlobal('header'),
  ])

  // Празна база — показваме къде да се въведе съдържанието, вместо бяла страница.
  if (!page) {
    return (
      <div className="container-site py-24">
        <h1 className="text-2xl font-semibold">Началната страница още не е създадена</h1>
        <p className="mt-3 max-w-prose text-sm text-ink-muted">
          Влезте в админ панела, отворете <strong>Съдържание → Страници</strong> и създайте страница
          с URL адрес <code className="rounded bg-tile px-1">home</code>. След
          това добавете секции към нея.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-flex min-h-11 cursor-pointer items-center rounded-md bg-brand px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-dark"
        >
          Към админ панела
        </Link>
      </div>
    )
  }

  return (
    /*
      Съставените страници са на светлосив фон, за да изпъкват белите карти
      и банерите — както в оригинала. Продуктовата страница остава бяла,
      затова сивото се слага тук, а не на `body`.
    */
    <div className="bg-canvas">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(схемаНаСайта(settings, footer, header.logo)) }}
      />
      <RenderBlocks
        layout={page.layout}
        showBgn={Boolean(settings.showBgnPrices)}
        heading={
          /*
            H1 описва сайта (т. 6), а не текущата промоция в банера. Над
            лентата с категориите — там е естественото „за какво е сайтът".
          */
          <div className="container-site pt-10 text-center lg:pt-12">
            <h1 className="text-2xl font-medium leading-tight tracking-tight sm:text-3xl">
              {settings.homeH1?.trim() || HOME_H1_DEFAULT}
            </h1>
          </div>
        }
      />
    </div>
  )
}

/** JSON-LD на началната: `WebSite` и `Organization` (т. 6). */
const схемаНаСайта = (
  settings: Awaited<ReturnType<typeof getGlobal<'site-settings'>>>,
  footer: Awaited<ReturnType<typeof getGlobal<'footer'>>>,
  /** Логото от „Меню (хедър)" — там е качено; „Общи настройки" е резерва. */
  headerLogo: Parameters<typeof mediaUrl>[0],
) => {
  const url = absoluteUrl('/')
  const logo = mediaUrl(settings.logo) ?? mediaUrl(headerLogo)
  const sameAs = (footer.social ?? []).map((s) => s.url).filter(истинскиПрофил)
  return [
    { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url, publisher: { '@id': ORGANIZATION_ID } },
    // Същата организация като на „За ДИ СИ 2008" — едно `@id` (`src/lib/organization.ts`).
    organizationSchema(settings, { logo, sameAs }),
  ]
}
