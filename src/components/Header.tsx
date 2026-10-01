import { GlobeSimple } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'

import type { Category, MenuPanel, Product } from '@/payload-types'
import {
  type CompatibilityLinks,
  getCategoryTree,
  getCompatibilityLinks,
  getGlobal,
  getProductsByIds,
} from '@/lib/payload'
import { mediaAlt, mediaDims, mediaUrl, productCardData } from '@/lib/media'
import { categoryPath } from '@/lib/urls'
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

/** Най-много толкова автоматични аксесоара; после — плочката „Виж всички". */
const MAX_AUTO_ACCESSORIES = 6

/**
 * Аксесоарите за устройствата в панела — за празния раздел „Аксесоари".
 *
 * Устройствата са продуктите от ОСТАНАЛИТЕ секции на панела. Аксесоар
 * влиза, ако „Съвместим с" сочи някое от тях, някоя от категориите му или
 * категория над тях: кабел, отбелязан за „DELTA серия", важи за всеки
 * модел в нея — същото правило като при „Свързани продукти" на модела.
 */
const autoAccessoryIds = (
  panel: MenuPanel,
  byId: Record<number, Product>,
  links: CompatibilityLinks[],
  parentOf: Map<number, number | null>,
): number[] => {
  const устройства = new Set<number>()
  const категории = new Set<number>()
  for (const section of panel.sections ?? []) {
    if (section.accessories) continue
    for (const card of section.cards ?? []) {
      const id = cardProductId(card)
      const p = id !== null ? byId[id] : undefined
      if (!p) continue
      устройства.add(p.id)
      // Всички категории на устройството и всичко над тях.
      for (const cat of p.categories?.length ? p.categories : [p.category]) {
        let c: number | null | undefined = typeof cat === 'number' ? cat : cat?.id
        while (c != null && !категории.has(c)) {
          категории.add(c)
          c = parentOf.get(c)
        }
      }
    }
  }
  if (!устройства.size) return []

  return links
    .filter(
      (l) =>
        !устройства.has(l.id) &&
        (l.products.some((id) => устройства.has(id)) ||
          l.categories.some((id) => категории.has(id))),
    )
    .map((l) => l.id)
}

/** Наличните първо, после `_order` (редът от админа), после заглавие. */
const byAvailabilityThenOrder = (a: Product, b: Product) => {
  const наличен = (p: Product) => (p.availability === 'in-stock' ? 0 : 1)
  if (наличен(a) !== наличен(b)) return наличен(a) - наличен(b)
  // `_order` е дробен ключ — сравнява се като низ, не по азбуката на езика.
  const ka = a._order ?? ''
  const kb = b._order ?? ''
  if (ka !== kb) return ka < kb ? -1 : 1
  return a.title.localeCompare(b.title, 'bg')
}

/**
 * Секциите на панела — точно редовете от админа, в този ред.
 *
 * Първият ред е голямата карта, останалите — малките. Чернова и изтрит
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
): MenuSection[] =>
  (panel.sections ?? []).flatMap((section): MenuSection[] => {
    const общи = {
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
        .slice(0, MAX_AUTO_ACCESSORIES)
        .map((p) => productCard(null, p))
      return cards.length ? [{ ...общи, featured: null, cards }] : []
    }

    const cards = (section.cards ?? []).flatMap((card) => {
      const id = cardProductId(card)
      const product = id !== null ? byId[id] : undefined
      return product ? [productCard(card, product)] : []
    })
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
  const [cardsById, links, tree] = await Promise.all([
    getProductsByIds([...ids].sort((a, b) => a - b)),
    getCompatibilityLinks(),
    getCategoryTree(),
  ])

  /*
    Празните раздели „Аксесоари" — кои аксесоари за кой панел. Картите им
    се дотеглят с втора заявка, пак само публикуваните.
  */
  const parentOf = new Map(
    tree.map((c) => [c.id, typeof c.parent === 'number' ? c.parent : (c.parent?.id ?? null)]),
  )
  const accessories: Record<number, number[]> = {}
  for (const panel of panels) {
    if ((panel.sections ?? []).some(isAutoAccessories)) {
      accessories[panel.id] = autoAccessoryIds(panel, cardsById, links, parentOf)
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

          // Табът води към категорията на първата секция.
          const first = panel.sections?.[0]
          const category = first ? sectionCategory(first) : null

          return {
            key: `panel-${panel.id}`,
            label: panel.title?.trim() || panel.slug,
            url: category ? categoryPath(category.slug) : categoryPath(panel.slug),
            sections: panelSections(panel, byId, accessories),
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
