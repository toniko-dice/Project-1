import type { Metadata } from 'next'
import Link from 'next/link'

import { RenderBlocks } from '@/components/RenderBlocks'
import { getGlobal, getPage } from '@/lib/payload'
import { mediaUrl } from '@/lib/media'

export const generateMetadata = async (): Promise<Metadata> => {
  const page = await getPage('home')
  if (!page) return {}

  const ogImage = mediaUrl(page.metaImage, 'banner')

  return {
    title: page.metaTitle ?? undefined,
    description: page.metaDescription ?? undefined,
    openGraph: ogImage ? { images: [{ url: ogImage }] } : undefined,
  }
}

export default async function HomePage() {
  const [page, settings] = await Promise.all([getPage('home'), getGlobal('site-settings')])

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
      <RenderBlocks layout={page.layout} showBgn={Boolean(settings.showBgnPrices)} />
    </div>
  )
}
