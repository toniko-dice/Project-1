import {
  FacebookLogo,
  InstagramLogo,
  LinkedinLogo,
  TiktokLogo,
  YoutubeLogo,
} from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'

import { getGlobal } from '@/lib/payload'

const SOCIAL_ICONS = {
  facebook: FacebookLogo,
  instagram: InstagramLogo,
  youtube: YoutubeLogo,
  linkedin: LinkedinLogo,
  tiktok: TiktokLogo,
} as const

const SOCIAL_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
}

export const Footer = async () => {
  const [footer, settings] = await Promise.all([getGlobal('footer'), getGlobal('site-settings')])

  return (
    <footer className="mt-16 border-t border-line bg-surface">
      {footer.newsletterEnabled ? (
        <div className="border-b border-line">
          <div className="container-site grid gap-6 py-10 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-xl font-semibold">
                {footer.newsletterHeading ?? 'Бъдете в течение'}
              </h2>
              {footer.newsletterText ? (
                <p className="mt-1 text-sm text-ink-muted">{footer.newsletterText}</p>
              ) : null}
            </div>

            {/*
              Формата е подготвена за свързване с външна услуга за бюлетин.
              Полето има видим етикет, а не само placeholder.
            */}
            <form className="flex flex-col gap-2 sm:flex-row" action="#" method="post">
              <div className="flex-1">
                <label htmlFor="newsletter-email" className="mb-1 block text-xs font-medium">
                  Имейл адрес
                </label>
                <input
                  id="newsletter-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="ime@primer.bg"
                  className="min-h-11 w-full rounded-md border border-line bg-surface px-3 text-sm"
                />
              </div>
              <button
                type="submit"
                className="mt-auto inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-brand px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-dark"
              >
                Абонирайте се
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <div className="container-site grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-5">
        {(footer.columns ?? []).map((col, i) => (
          <div key={i}>
            <h3 className="mb-3 text-sm font-semibold">{col.heading}</h3>
            <ul className="space-y-1">
              {(col.links ?? []).map((l, li) => (
                <li key={li}>
                  <Link
                    href={l.url}
                    className="inline-flex min-h-9 cursor-pointer items-center text-sm text-ink-muted transition-colors duration-150 hover:text-brand"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="mb-3 text-sm font-semibold">Контакти</h3>
          <address className="space-y-1 text-sm not-italic text-ink-muted">
            {settings.companyName ? <p className="font-medium">{settings.companyName}</p> : null}
            {settings.address ? <p className="whitespace-pre-line">{settings.address}</p> : null}
            {settings.phone ? (
              <p>
                <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="cursor-pointer hover:text-brand">
                  {settings.phone}
                </a>
              </p>
            ) : null}
            {settings.email ? (
              <p>
                <a href={`mailto:${settings.email}`} className="cursor-pointer hover:text-brand">
                  {settings.email}
                </a>
              </p>
            ) : null}
            {settings.vatNumber ? <p>ЕИК: {settings.vatNumber}</p> : null}
          </address>

          {footer.social?.length ? (
            <ul className="mt-4 flex gap-1">
              {footer.social.map((s, i) => {
                const Logo = SOCIAL_ICONS[s.platform as keyof typeof SOCIAL_ICONS]
                if (!Logo) return null
                return (
                  <li key={i}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={SOCIAL_LABELS[s.platform] ?? s.platform}
                      className="inline-flex size-11 cursor-pointer items-center justify-center rounded transition-colors duration-150 hover:bg-tile"
                    >
                      <Logo size={20} aria-hidden="true" />
                    </a>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-site flex flex-col gap-3 py-5 text-xs text-ink-muted md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p>{footer.copyright ?? `© ${new Date().getFullYear()} Всички права запазени.`}</p>
            {settings.distributorNotice ? <p>{settings.distributorNotice}</p> : null}
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {settings.showBgnPrices ? (
              <p className="tabular">
                Цените са в евро. Фиксиран курс: 1 EUR = 1,95583 BGN.
              </p>
            ) : null}

            {footer.legalLinks?.length ? (
              <ul className="flex flex-wrap gap-x-4 gap-y-1">
                {footer.legalLinks.map((l, i) => (
                  <li key={i}>
                    <Link
                      href={l.url}
                      className="cursor-pointer underline-offset-2 transition-colors duration-150 hover:text-brand hover:underline"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  )
}
