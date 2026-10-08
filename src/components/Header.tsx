import { GlobeSimple } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'

import { getGlobal } from '@/lib/payload'
import { mediaAlt, mediaDims, mediaUrl } from '@/lib/media'
import { buildNavItems } from '@/lib/menu'
import { AnnouncementBar } from './AnnouncementBar'
import { HeaderNav, type NavItem } from './HeaderNav'

export const Header = async () => {
  const [header, settings] = await Promise.all([getGlobal('header'), getGlobal('site-settings')])

  /*
    Картите на мега менюто НЕ влизат в страницата (`task-mobilna-
    optimizaciya.md`, т. 1). Те бяха ~77 KB данни в HTML-а на ВСЯКА
    страница — около 40 % от него, — а трябват само на компютър и само
    когато се отвори менюто. Мобилното меню ползва единствено имената.
    `HeaderNav` ги дотегля от `/api/menyu`, когато страницата е готова
    (или при първото посочване на точка от менюто).
  */
  const items: NavItem[] = (await buildNavItems(header)).map((item) => ({
    ...item,
    groups: item.groups.map((g) => ({
      ...g,
      entries: g.entries.map((e) => ({ ...e, sections: [] })),
    })),
  }))

  /*
    Горната лента се показва само ако собственикът я включи.

    Изключена е по подразбиране. Полетата ѝ остават попълнени — включването
    е една отметка в „Меню (хедър)".

    В условието НЕ участва промо съобщението: то е отделна тъмна лента
    по-долу. Преди беше тук и празна сива лента изникваше само защото има
    съобщение.
  */
  const showTopBar =
    Boolean(header.utilityBarEnabled) &&
    Boolean(header.topLeftLabel || header.topPromoText || header.regionLabel)

  /*
    Логото се очаква ШИРОКО — около 600×120. Квадратна икона (192×192) на
    24 px височина е точица, която не се разчита. Затова при съотношение
    под 2:1 хедърът показва текстовия надпис, докато не бъде качено широко
    лого.
  */
  const logoMedia = header.logo && typeof header.logo !== 'number' ? header.logo : settings.logo
  const logoDims = mediaDims(logoMedia)
  const logoIsWide = logoDims.width / Math.max(1, logoDims.height) >= 2
  const logoUrl = logoIsWide ? (mediaUrl(header.logo) ?? mediaUrl(settings.logo)) : null

  /*
    `<header>` е самата лента с логото (в `HeaderNav`): на телефон тя лепне
    горе, а лепнещ елемент не излиза от родителя си — затова лентите над
    нея са извън него.
  */
  return (
    <>
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
        <AnnouncementBar text={settings.announcementText} url={settings.announcementUrl} />
      ) : null}

      <HeaderNav
        items={items}
        logoUrl={logoUrl}
        logoAlt={mediaAlt(header.logo) || 'EcoFlow България'}
        logoWidth={logoDims.width}
        logoHeight={logoDims.height}
        logoSuffix={header.logoSuffix}
        logoTagline={header.logoTagline}
        ctaLabel={header.ctaLabel}
        ctaUrl={header.ctaUrl}
        searchEnabled={header.searchEnabled}
        mobileLinks={(header.mobileLinks ?? []).map((l) => ({ label: l.label, url: l.url }))}
        email={settings.email}
      />
    </>
  )
}
