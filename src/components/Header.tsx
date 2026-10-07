import { GlobeSimple } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'

import type { Category, MenuPanel, Product } from '@/payload-types'
import {
  ACCESSORIES_ROOT_SLUG,
  accessoriesForCategory,
  accessoriesForProduct,
  byAvailabilityThenOrder,
  canHaveAccessoriesPage,
  type Catalog,
} from '@/lib/catalog'
import { getCatalog, getGlobal, getProductsByIds } from '@/lib/payload'
import { mediaAlt, mediaDims, mediaUrl, productCardData } from '@/lib/media'
import { accessoriesPath, categoryPath } from '@/lib/urls'
import { HeaderNav, type MenuCard, type MenuSection, type NavItem } from './HeaderNav'

type PanelSection = NonNullable<MenuPanel['sections']>[number]
type PanelCard = NonNullable<PanelSection['cards']>[number]

/** Номерът на продукта в реда. */
const cardProductId = (card: PanelCard): number | null => {
  const p = card.product
  return typeof p === 'number' ? p : (p?.id ?? null)
}

/**
 * Ред от секцията като карта в менюто.
 *
 * Името, подзаглавието и снимката са от реда — попълнени от продукта при
 * избора му, и собственикът може да ги е променил. Празно поле пада на
 * продукта. Цената и адресът са ВИНАГИ от продукта. „Етикет" излиза като
 * малък надпис в ъгъла на снимката (`ribbon`); етикетът на самия продукт
 * не се пренася.
 */
const productCard = (card: PanelCard | null, p: Product): MenuCard => {
  const data = productCardData(
    p,
    card ? { title: card.title, tagline: card.specLine, image: card.image } : undefined,
  )
  return {
    imageUrl: data.imageUrl,
    imageAlt: data.imageAlt,
    imageTrimmed: data.imageTrimmed,
    title: data.title,
    specLine: data.tagline,
    url: data.url,
    label: null,
    ribbon: card?.label?.trim() || null,
    price: data.price,
    comparePrice: data.comparePrice,
  }
}

/** Категорията на секцията, ако е заредена. */
const sectionCategory = (section: PanelSection): Category | null => {
  const c = section.viewAllCategory
  return c && typeof c === 'object' ? c : null
}

/**
 * Адресът на „Виж всички": категорията, или ръчно вписаният адрес.
 *
 * Категорията е основната, защото адресът ѝ следва преименуванията;
 * ръчното поле остава за връзка извън категориите.
 */
const viewAllUrl = (section: PanelSection) => {
  const c = sectionCategory(section)
  return c ? categoryPath(c.slug) : (section.viewAllUrl ?? null)
}

/** Раздел „Аксесоари" без нито един ред — пълни се сам. */
const isAutoAccessories = (section: PanelSection) =>
  Boolean(section.accessories) && !(section.cards ?? []).length

/**
 * Най-много толкова карти в секция; после — плочката „Виж всички".
 *
 * Колкото събира мрежата на панела: голямата карта заема две реда, до нея
 * три колони по два реда — пет малки и плочката. Повече карти пренасяха
 * мрежата на нов ред: „Кабели" с 11 реда беше два пъти по-висок от
 * панелите на сериите. Важи и за ръчните редове (първите шест в реда от
 * админа), и за автоматичния раздел „Аксесоари".
 */
const MAX_SECTION_CARDS = 6

/** Категорията на панела — тази на първата му продуктова секция. */
const panelCategory = (panel: MenuPanel): Category | null => {
  const first = (panel.sections ?? []).find((s) => !s.accessories)
  return first ? sectionCategory(first) : null
}

/**
 * Аксесоарите за празния раздел „Аксесоари" — по СЪЩОТО правило като
 * страницата „Аксесоари за …" (`src/lib/catalog.ts`), за категорията на
 * панела. Иначе менюто показва едни аксесоари, а страницата зад „Всички
 * аксесоари" — други. Панел без категория (PowerOcean) взима аксесоарите
 * на устройствата си.
 */
const autoAccessoryIds = (
  panel: MenuPanel,
  catalog: Catalog,
  byId: Record<number, Product>,
): number[] => {
  const категория = panelCategory(panel)
  if (категория) return accessoriesForCategory(catalog, категория.id).map((e) => e.id)

  const ids = new Set<number>()
  for (const section of panel.sections ?? []) {
    if (section.accessories) continue
    for (const card of section.cards ?? []) {
      const id = cardProductId(card)
      if (id === null || !byId[id]) continue
      for (const e of accessoriesForProduct(catalog, id)) ids.add(e.id)
    }
  }
  return [...ids]
}

/** Надписът, който админът носи по подразбиране — значи „не е попълван". */
const ПОДРАЗБИРАНЕ = 'Виж всички'

/**
 * „Всички аксесоари за DELTA серия" → `/kategorii/delta-seriya/aksesoari`.
 *
 * Ръчно избрана категория, различна от „Аксесоари", има предимство — както
 * и ръчно написан надпис. Без страница (няма аксесоари) остава старото.
 */
const accessoriesLink = (panel: MenuPanel, section: PanelSection, catalog: Catalog) => {
  const ръчна = sectionCategory(section)
  if (ръчна && ръчна.slug !== ACCESSORIES_ROOT_SLUG) return null
  const категория = panelCategory(panel)
  if (!категория || !canHaveAccessoriesPage(catalog, категория.id)) return null
  if (!accessoriesForCategory(catalog, категория.id).length) return null
  const свой = section.viewAllLabel?.trim()
  return {
    url: accessoriesPath(категория.slug),
    label: свой && свой !== ПОДРАЗБИРАНЕ ? свой : `Всички аксесоари за ${категория.title}`,
  }
}

/**
 * Секциите на панела — точно редовете от админа, в този ред.
 *
 * Първият ред е голямата карта, останалите — малките, общо до шест
 * (`MAX_SECTION_CARDS`); останалите са зад „Виж всички". Чернова и изтрит
 * продукт просто липсват (`byId` съдържа само публикуваните). Секция без
 * нито една показваема карта не се рендерира: заглавие и „Виж всички"
 * над празна мрежа са празно място.
 *
 * Изключение е празният раздел „Аксесоари": в него излизат аксесоарите за
 * устройствата в панела (`accessories`) — до шест малки карти, без голяма.
 * Няма ли такива, разделът не се показва.
 */
const panelSections = (
  panel: MenuPanel,
  byId: Record<number, Product>,
  accessories: Record<number, number[]>,
  catalog: Catalog,
): MenuSection[] =>
  (panel.sections ?? []).flatMap((section): MenuSection[] => {
    const аксесоари = section.accessories ? accessoriesLink(panel, section, catalog) : null
    const общи = аксесоари
      ? {
          heading: section.heading,
          viewAllLabel: аксесоари.label,
          viewAllUrl: аксесоари.url,
          showViewAllTile: Boolean(section.showViewAllTile),
          viewAllTileUrl: section.viewAllTileUrl ?? аксесоари.url,
          viewAllTileLabel: аксесоари.label,
        }
      : {
          heading: section.heading,
          viewAllLabel: section.viewAllLabel,
          viewAllUrl: viewAllUrl(section),
          showViewAllTile: Boolean(section.showViewAllTile),
          viewAllTileUrl: section.viewAllTileUrl ?? viewAllUrl(section),
        }

    if (isAutoAccessories(section)) {
      const cards = (accessories[panel.id] ?? [])
        .map((id) => byId[id])
        .filter((p): p is Product => Boolean(p))
        .sort(byAvailabilityThenOrder)
        .slice(0, MAX_SECTION_CARDS)
        .map((p) => productCard(null, p))
      return cards.length ? [{ ...общи, featured: null, cards }] : []
    }

    // Първите шест ПОКАЗВАЕМИ — чернова или изтрит продукт не заема място.
    const cards = (section.cards ?? [])
      .flatMap((card) => {
        const id = cardProductId(card)
        const product = id !== null ? byId[id] : undefined
        return product ? [productCard(card, product)] : []
      })
      .slice(0, MAX_SECTION_CARDS)
    const [first, ...rest] = cards
    if (!first) return []

    return [{ ...общи, featured: first, cards: rest }]
  })

export const Header = async () => {
  const [header, settings] = await Promise.all([getGlobal('header'), getGlobal('site-settings')])

  /* Всички панели от менюто, веднъж, за да се съберат продуктите им. */
  const panels: MenuPanel[] = []
  for (const item of header.items ?? []) {
    for (const group of item.groups ?? []) {
      for (const entry of group.entries ?? []) {
        if (entry.panel && typeof entry.panel !== 'number') panels.push(entry.panel)
      }
    }
  }

  /*
    Продуктите на всички панели — с една заявка, на дълбочина 1.

    Хедърът се чете с `depth: 2` и там снимката на продукта е само номер.
    Вместо да се вдига дълбочината на целия глобал, продуктите се дотеглят
    отделно — и само публикуваните: чернова в менюто не бива да излиза.
  */
  const ids = new Set<number>()
  for (const panel of panels) {
    for (const section of panel.sections ?? []) {
      for (const card of section.cards ?? []) {
        const id = cardProductId(card)
        if (id !== null) ids.add(id)
      }
    }
  }
  const [cardsById, catalog] = await Promise.all([
    getProductsByIds([...ids].sort((a, b) => a - b)),
    getCatalog(),
  ])

  /*
    Празните раздели „Аксесоари" — кои аксесоари за кой панел. Картите им
    се дотеглят с втора заявка, пак само публикуваните.
  */
  const accessories: Record<number, number[]> = {}
  for (const panel of panels) {
    if ((panel.sections ?? []).some(isAutoAccessories)) {
      accessories[panel.id] = autoAccessoryIds(panel, catalog, cardsById)
    }
  }
  const accessoryIds = [...new Set(Object.values(accessories).flat())].filter(
    (id) => !cardsById[id],
  )
  const byId = accessoryIds.length
    ? { ...cardsById, ...(await getProductsByIds(accessoryIds.sort((a, b) => a - b))) }
    : cardsById

  const items: NavItem[] = (header.items ?? []).map((item) => ({
    label: item.label,
    // Точката сочи категория; ръчният адрес е само за страници извън тях.
    url:
      item.category && typeof item.category !== 'number'
        ? categoryPath(item.category.slug)
        : item.url,
    badge: item.badge === 'none' ? null : (item.badge as 'hot' | 'new' | null),
    groups: (item.groups ?? []).map((group) => ({
      heading: group.heading,
      defaultOpen: Boolean(group.defaultOpen),
      entries: (group.entries ?? [])
        .map((entry) => {
          // При depth 2 връзката идва като пълен обект; ако е число, панелът не е зареден.
          const panel = entry.panel
          if (!panel || typeof panel === 'number') return null

          /*
            Табът води към категорията на първата секция. Панел без
            категория (PowerOcean) остава текст: адресът по slug-а на панела
            сочеше несъществуваща категория — 404.
          */
          const first = panel.sections?.[0]
          const category = first ? sectionCategory(first) : null

          return {
            key: `panel-${panel.id}`,
            label: panel.title?.trim() || panel.slug,
            url: category ? categoryPath(category.slug) : null,
            sections: panelSections(panel, byId, accessories, catalog),
          }
        })
        .filter((e): e is NonNullable<typeof e> => e !== null),
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
        logoUrl={logoUrl}
        logoAlt={mediaAlt(header.logo) || 'EcoFlow България'}
        logoWidth={logoDims.width}
        logoHeight={logoDims.height}
        logoSuffix={header.logoSuffix}
        logoTagline={header.logoTagline}
        ctaLabel={header.ctaLabel}
        ctaUrl={header.ctaUrl}
        searchEnabled={header.searchEnabled}
      />
    </header>
  )
}
