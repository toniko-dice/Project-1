import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { RenderBlocks } from '@/components/RenderBlocks'
import { getGlobal, getPage, getPayloadClient } from '@/lib/payload'
import { mediaUrl } from '@/lib/media'

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

  const ogImage = mediaUrl(page.metaImage, 'banner')

  return {
    title: page.metaTitle ?? page.title,
    description: page.metaDescription ?? undefined,
    openGraph: ogImage ? { images: [{ url: ogImage }] } : undefined,
  }
}

export default async function DynamicPage({ params }: Args) {
  const { slug } = await params
  const [page, settings] = await Promise.all([getPage(slug), getGlobal('site-settings')])

  if (!page) notFound()

  return <RenderBlocks layout={page.layout} showBgn={Boolean(settings.showBgnPrices)} />
}
