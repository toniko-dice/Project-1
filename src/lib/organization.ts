import type { SiteSetting } from '@/payload-types'
import { absoluteUrl } from './site-url'
import { SITE_NAME } from './title'

/**
 * ЕДНА организация за целия сайт — ДИ СИ 2008 ООД, която стои зад него.
 * Началната и „За ДИ СИ 2008" я описват със същото `@id`, затова за
 * Google това е един запис, не два; магазините сочат към него
 * (`parentOrganization`). Данните са от „Общи настройки" → „Контакти".
 */
export const ORGANIZATION_ID = absoluteUrl('/#organization')

export const organizationSchema = (
  settings: SiteSetting,
  extra: { logo?: string | null; sameAs?: string[] } = {},
) => {
  const другиИмена = [settings.alternateName?.trim(), SITE_NAME].filter(Boolean)
  const адрес =
    settings.addressStreet?.trim() || settings.addressCity?.trim()
      ? {
          '@type': 'PostalAddress',
          ...(settings.addressStreet?.trim() ? { streetAddress: settings.addressStreet.trim() } : {}),
          ...(settings.addressCity?.trim() ? { addressLocality: settings.addressCity.trim() } : {}),
          addressCountry: 'BG',
        }
      : null
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: settings.legalName?.trim() || settings.companyName?.trim() || SITE_NAME,
    alternateName: другиИмена,
    url: absoluteUrl('/'),
    ...(extra.logo ? { logo: absoluteUrl(extra.logo) } : {}),
    ...(settings.email ? { email: settings.email } : {}),
    ...(settings.phone ? { telephone: settings.phone } : {}),
    ...(адрес ? { address: адрес } : {}),
    ...(settings.vatId?.trim() ? { vatID: settings.vatId.trim() } : {}),
    ...(settings.foundingYear ? { foundingDate: String(settings.foundingYear) } : {}),
    ...(settings.phone || settings.email
      ? {
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            areaServed: 'BG',
            availableLanguage: ['bg'],
            ...(settings.phone ? { telephone: settings.phone } : {}),
            ...(settings.email ? { email: settings.email } : {}),
          },
        }
      : {}),
    ...(extra.sameAs?.length ? { sameAs: extra.sameAs } : {}),
  }
}
