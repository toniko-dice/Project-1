import type { Metadata } from 'next'

import { breadcrumbSchema } from '@/components/Breadcrumbs'
import { FaqExplorer } from '@/components/FaqExplorer'
import { InlineLinks } from '@/components/InlineLinks'
import { въпросиНа, нормален, текстЗаСхема } from '@/lib/faq'
import { FAQ_PATH } from '@/lib/legal'
import { mediaUrl } from '@/lib/media'
import { getFaqGroups, getGlobal } from '@/lib/payload'
import { absoluteUrl } from '@/lib/site-url'
import { finalTitle, pageTitle, SITE_NAME } from '@/lib/title'

/**
 * „Често задавани въпроси" (`task-futar.md`) — код, не запис в „Страници":
 * въпросите се събират от продуктите, категориите и страниците
 * (`getFaqGroups`). Заглавието, уводът и мета данните — „Въпроси и Контакти".
 */
export const generateMetadata = async (): Promise<Metadata> => {
  const [info, header] = await Promise.all([getGlobal('info-pages'), getGlobal('header')])
  const title = info.faqMetaTitle?.trim() || info.faqTitle || 'Често задавани въпроси'
  const description = info.faqMetaDescription ?? undefined
  const url = absoluteUrl(FAQ_PATH)
  const logo = mediaUrl((header as { logo?: unknown }).logo as never)
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
      ...(logo ? { images: [{ url: absoluteUrl(logo) }] } : {}),
    },
  }
}

export default async function FaqPage() {
  const [info, groups] = await Promise.all([getGlobal('info-pages'), getFaqGroups()])
  const h1 = info.faqTitle?.trim() || 'Често задавани въпроси'
  /*
    В `FAQPage` всеки въпрос е веднъж — и на страницата е веднъж
    (`сглобиВъпроси`); проверката тук е предпазна.
  */
  const видяни = new Set<string>()
  const items = groups
    .flatMap(въпросиНа)
    .filter((i) => !видяни.has(нормален(i.question)) && Boolean(видяни.add(нормален(i.question))))

  const schema = [
    breadcrumbSchema([
      { label: 'Начало', url: '/' },
      { label: h1, url: FAQ_PATH },
    ]),
    ...(items.length
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            url: absoluteUrl(FAQ_PATH),
            mainEntity: items.map((i) => ({
              '@type': 'Question',
              name: i.question,
              acceptedAnswer: { '@type': 'Answer', text: текстЗаСхема(i) },
            })),
          },
        ]
      : []),
  ]

  return (
    <div className="bg-surface">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="container-site pb-8 pt-10 lg:pt-14">
        <div className="mx-auto max-w-[56rem]">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-[40px] sm:leading-tight">{h1}</h1>
          {info.faqIntro ? (
            <p className="mt-3 text-base leading-relaxed text-ink-muted">
              <InlineLinks text={info.faqIntro} />
            </p>
          ) : null}
        </div>
      </div>
      <FaqExplorer groups={groups} />
    </div>
  )
}
