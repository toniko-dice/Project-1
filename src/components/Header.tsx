import { GlobeSimple } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'

import type { MenuPanel } from '@/payload-types'
import { getGlobal } from '@/lib/payload'
import { mediaAlt, mediaUrl } from '@/lib/media'
import { HeaderNav, type MenuCard, type NavItem } from './HeaderNav'

type RawCard = NonNullable<NonNullable<MenuPanel['sections']>[number]>['featured']

const toCard = (raw: RawCard): MenuCard | null => {
  if (!raw?.title) return null
  return {
    imageUrl: mediaUrl(raw.image, 'card'),
    imageAlt: mediaAlt(raw.image) || raw.title,
    title: raw.title,
    specLine: raw.specLine,
    url: raw.url,
    label: raw.label,
    ribbon: raw.ribbon,
  }
}

export const Header = async () => {
  const [header, settings] = await Promise.all([getGlobal('header'), getGlobal('site-settings')])

  const items: NavItem[] = (header.items ?? []).map((item) => ({
    label: item.label,
    url: item.url,
    badge: item.badge === 'none' ? null : (item.badge as 'hot' | 'new' | null),
    groups: (item.groups ?? []).map((group) => ({
      heading: group.heading,
      defaultOpen: Boolean(group.defaultOpen),
      entries: (group.entries ?? [])
        .map((entry) => {
          // При depth 2 връзката идва като пълен обект; ако е число, панелът не е зареден.
          const panel = entry.panel
          if (!panel || typeof panel === 'number') return null

          return {
            key: `panel-${panel.id}`,
            label: panel.title,
            url: `/categories/${panel.slug}`,
            sections: (panel.sections ?? []).map((section) => ({
              heading: section.heading,
              viewAllLabel: section.viewAllLabel,
              viewAllUrl: section.viewAllUrl,
              featured: toCard(section.featured),
              cards: (section.cards ?? [])
                .map((c) => toCard(c as RawCard))
                .filter((c): c is MenuCard => c !== null),
              showViewAllTile: Boolean(section.showViewAllTile),
              viewAllTileUrl: section.viewAllTileUrl,
            })),
          }
        })
        .filter((e): e is NonNullable<typeof e> => e !== null),
    })),
  }))

  const showTopBar =
    header.topLeftLabel || header.topPromoText || header.regionLabel || settings.announcementText

  return (
    <header>
      {showTopBar ? (
        <div className="border-b border-line bg-topbar">
          <div className="container-site flex min-h-9 flex-wrap items-center gap-x-4 gap-y-1 py-1.5 text-xs">
            {header.topLeftLabel ? (
              <Link
                href={header.topLeftUrl ?? '#'}
                className="cursor-pointer underline underline-offset-2 transition-colors duration-150 hover:text-brand"
              >
                {header.topLeftLabel}
              </Link>
            ) : null}

            {header.topPromoText ? (
              <>
                <span aria-hidden="true" className="text-line">
                  |
                </span>
                <Link
                  href={header.topPromoUrl ?? '#'}
                  className="cursor-pointer transition-colors duration-150 hover:text-brand"
                >
                  {header.topPromoText}
                </Link>
              </>
            ) : null}

            {header.regionLabel ? (
              <span className="ml-auto inline-flex items-center gap-1.5 text-ink-muted">
                <GlobeSimple size={14} aria-hidden="true" />
                {header.regionLabel}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {settings.announcementEnabled && settings.announcementText ? (
        <div className="bg-night text-white">
          <div className="container-site flex min-h-9 items-center justify-center py-1.5 text-center text-xs">
            {settings.announcementUrl ? (
              <Link
                href={settings.announcementUrl}
                className="cursor-pointer underline-offset-2 hover:underline"
              >
                {settings.announcementText}
              </Link>
            ) : (
              <span>{settings.announcementText}</span>
            )}
          </div>
        </div>
      ) : null}

      <HeaderNav
        items={items}
        logoUrl={mediaUrl(header.logo) ?? mediaUrl(settings.logo)}
        logoAlt={mediaAlt(header.logo) || 'EcoFlow България'}
        logoSuffix={header.logoSuffix}
        logoTagline={header.logoTagline}
        ctaLabel={header.ctaLabel}
        ctaUrl={header.ctaUrl}
        searchEnabled={header.searchEnabled}
      />
    </header>
  )
}
