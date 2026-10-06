import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { breadcrumbSchema } from '@/components/Breadcrumbs'
import { RenderBlocks } from '@/components/RenderBlocks'
import { getGlobal, getPage, getPayloadClient } from '@/lib/payload'
import { mediaUrl } from '@/lib/media'
import { pageListProducts } from '@/lib/page-products'
import { absoluteUrl } from '@/lib/site-url'
import { finalTitle, pageTitle, SITE_NAME } from '@/lib/title'
import { productPath } from '@/lib/urls'

type Args = { params: Promise<{ slug: string }> }

export const generateStaticParams = async () => {
  const payload = await getPayloadClient()
  const pages = await payload.find({ collection: 'pages', limit: 200, depth: 0 })
  return pages.docs.filter((p) => p.slug !== 'home').map((p) => ({ slug: p.slug }))
}

export const generateMetadata = async ({ params }: Args): Promise<Metadata> => {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) return {}

  const title = page.metaTitle?.trim() || page.title
  const description = page.metaDescription ?? undefined
  const url = absoluteUrl(`/${slug}`)
  // Мета снимката — webp размерът `large` (до 2000 px), не JPEG оригиналът.
  const ogImage = mediaUrl(page.metaImage, 'large') ?? mediaUrl(page.metaImage)

  return {
    // Наставката — само ако се събира в 60 знака (`pageTitle`).
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
      ...(ogImage ? { images: [{ url: absoluteUrl(ogImage) }] } : {}),
    },
  }
}

export default async function DynamicPage({ params }: Args) {
  const { slug } = await params
  const [page, settings] = await Promise.all([getPage(slug), getGlobal('site-settings')])

  if (!page) notFound()

  const layout = page.layout ?? []
  const продукти = await pageListProducts(layout)
  const въпроси = layout.flatMap((b) =>
    b.blockType === 'faqBlock' && !b.hidden ? (b.items ?? []).filter((q) => q.question && q.answer) : [],
  )

  /*
    JSON-LD: трохите (Начало › страницата), въпросите от „Въпроси и
    отговори" (`FAQPage`) и продуктите от таблиците и каруселите
    (`ItemList`) — само видимите блокове и публикуваните продукти.
  */
  const schema = [
    breadcrumbSchema([
      { label: 'Начало', url: '/' },
      { label: page.title, url: `/${slug}` },
    ]),
    ...(въпроси.length
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: въпроси.map((q) => ({
              '@type': 'Question',
              name: q.question,
              acceptedAnswer: { '@type': 'Answer', text: q.answer },
            })),
          },
        ]
      : []),
    ...(продукти.length
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: page.title,
            numberOfItems: продукти.length,
            itemListElement: продукти.map((p, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: absoluteUrl(productPath(p)),
              name: p.title,
            })),
          },
        ]
      : []),
  ]

  /*
    Съставените страници са на светлосив фон, за да изпъкват белите карти
    и банерите — както в оригинала. Ръководството (страница, която започва
    със „Заглавна снимка (H1)") е на бяло: там сиви са контейнерите
    (акордеонът, таблицата), както на eu.ecoflow.com, и върху сиво биха
    изчезнали. Продуктовата страница също остава бяла, затова фонът се
    слага тук, а не на `body`.
  */
  const ръководство = layout.some((b) => b.blockType === 'pageHero' && !b.hidden)

  return (
    <div className={ръководство ? 'bg-surface' : 'bg-canvas'}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <RenderBlocks layout={layout} showBgn={Boolean(settings.showBgnPrices)} />
    </div>
  )
}
