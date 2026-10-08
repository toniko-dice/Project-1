import { CaretRight, EnvelopeSimple } from '@phosphor-icons/react/dist/ssr'
import type { Metadata } from 'next'
import Link from 'next/link'

import { breadcrumbSchema } from '@/components/Breadcrumbs'
import { ContactForm } from '@/components/ContactForm'
import { InlineLinks } from '@/components/InlineLinks'
import { StoreCards, валидниМагазини } from '@/components/StoreCards'
import { CONTACT_PATH, FAQ_PATH, PRIVACY_PATH } from '@/lib/legal'
import { mediaUrl } from '@/lib/media'
import { ORGANIZATION_ID, organizationSchema } from '@/lib/organization'
import { getGlobal, getPage } from '@/lib/payload'
import { absoluteUrl } from '@/lib/site-url'
import { finalTitle, pageTitle, SITE_NAME } from '@/lib/title'

/**
 * „Контакти" (`task-futar.md`) — форма, имейл, магазините, полезни линкове.
 * Без телефон: формата и имейлът са начинът за връзка.
 *
 * Магазините се четат от блока „Магазини" на „За ДИ СИ 2008" — едно
 * въвеждане за двете страници. Текстовете — „Въпроси и Контакти".
 */
const ПЪТ_НА_МАГАЗИНИТЕ = 'za-di-si-2008'

export const generateMetadata = async (): Promise<Metadata> => {
  const [info, header] = await Promise.all([getGlobal('info-pages'), getGlobal('header')])
  const title = info.contactMetaTitle?.trim() || info.contactTitle || 'Контакти'
  const description = info.contactMetaDescription ?? undefined
  const url = absoluteUrl(CONTACT_PATH)
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

const ЛИНКОВЕ = [
  { label: 'Често задавани въпроси', href: FAQ_PATH },
  { label: 'Гаранционни условия', href: '/garanciya' },
  { label: 'Оферта за фирми', href: '/oferta-za-firmi', note: 'за по-големи количества' },
]

export default async function ContactPage() {
  const [info, settings, header, storesPage] = await Promise.all([
    getGlobal('info-pages'),
    getGlobal('site-settings'),
    getGlobal('header'),
    getPage(ПЪТ_НА_МАГАЗИНИТЕ),
  ])
  const h1 = info.contactTitle?.trim() || 'Контакти'
  const stores = валидниМагазини(
    (storesPage?.layout ?? []).flatMap((b) => (b.blockType === 'stores' && !b.hidden ? (b.stores ?? []) : [])),
  )
  const logo = mediaUrl(settings.logo) ?? mediaUrl((header as { logo?: unknown }).logo as never)

  /* `ContactPage` за организацията (същото `@id` като навсякъде) — без телефон. */
  const schema = [
    breadcrumbSchema([
      { label: 'Начало', url: '/' },
      { label: h1, url: CONTACT_PATH },
    ]),
    organizationSchema(settings, { logo }),
    {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: h1,
      url: absoluteUrl(CONTACT_PATH),
      ...(info.contactMetaDescription ? { description: info.contactMetaDescription } : {}),
      about: { '@id': ORGANIZATION_ID },
      mainEntity: { '@id': ORGANIZATION_ID },
    },
  ]

  return (
    <div className="bg-canvas">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="container-site py-10 lg:py-14">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-[40px] sm:leading-tight">{h1}</h1>
        {info.contactIntro ? (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-muted">
            <InlineLinks text={info.contactIntro} />
          </p>
        ) : null}

        {/* На телефон — формата първо, после информацията. */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
          <ContactForm
            privacyUrl={PRIVACY_PATH}
            successText={info.contactSuccess || 'Благодарим! Съобщението ви е изпратено. Ще ви отговорим на {имейл} възможно най-скоро.'}
          />

          <aside className="space-y-8">
            {settings.email ? (
              <section>
                <h2 className="mb-3 text-lg font-semibold">Имейл</h2>
                <a
                  href={`mailto:${settings.email}`}
                  className="inline-flex min-h-11 items-center gap-2 text-[15px] font-medium underline underline-offset-4 hover:text-ink-muted"
                >
                  <EnvelopeSimple size={20} aria-hidden="true" />
                  {settings.email}
                </a>
              </section>
            ) : null}

            {stores.length ? (
              <section>
                <h2 className="mb-3 text-lg font-semibold">Магазини</h2>
                <StoreCards stores={stores} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 [&>li]:bg-surface" />
              </section>
            ) : null}

            <section>
              <h2 className="mb-2 text-lg font-semibold">Полезно</h2>
              <ul className="divide-y divide-line border-y border-line">
                {ЛИНКОВЕ.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="flex min-h-12 items-center justify-between gap-3 py-2 text-[15px] hover:text-ink-muted">
                      <span>
                        {l.label}
                        {l.note ? <span className="text-ink-muted"> — {l.note}</span> : null}
                      </span>
                      <CaretRight size={16} aria-hidden="true" className="shrink-0 text-ink-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
