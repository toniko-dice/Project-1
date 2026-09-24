import { GlobeSimple } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'

import type { Category, MenuPanel, Product } from '@/payload-types'
import {
  categoryBranchIds,
  getCategoryTree,
  getCompatibleAccessories,
  getGlobal,
  getMenuProducts,
  getProductsByIds,
} from '@/lib/payload'
import { mediaAlt, mediaDims, mediaUrl, productCardData } from '@/lib/media'
import { categoryPath } from '@/lib/urls'
import { HeaderNav, type MenuCard, type MenuSection, type NavItem } from './HeaderNav'

type RawCard = NonNullable<NonNullable<MenuPanel['sections']>[number]>['featured']
type ProductsById = Record<number, Product>

/** Номерът на продукта зад ръчна карта, ако има такъв. */
const cardProductId = (raw: RawCard): number | null => {
  const p = raw?.product
  if (!p) return null
  return typeof p === 'number' ? p : p.id
}

/**
 * Ръчна карта в менюто.
 *
 * Ако сочи продукт, снимката, името, редът със спецификации, адресът и
 * цената идват от него през `productCardData`; попълненото в картата е
 * замяна за конкретното място. Етикетът е само ръчен. Продуктът се взима от
 * `products` (дотеглени отделно, със снимка), не от връзката в панела —
 * там снимката е само номер.
 */
const toCard = (raw: RawCard, products: ProductsById): MenuCard | null => {
  const id = cardProductId(raw)
  const product = id !== null ? (products[id] ?? null) : null
  const data = productCardData(product, {
    title: raw?.title,
    tagline: raw?.specLine,
    image: raw?.image,
    url: raw?.url,
    label: raw?.label,
  })
  if (!data.title) return null

  return {
    imageUrl: data.imageUrl,
    imageAlt: data.imageAlt,
    title: data.title,
    specLine: data.tagline,
    url: data.url,
    // Само ръчният етикет — етикетът на продукта не се пренася в менюто.
    label: data.label,
    ribbon: raw?.ribbon,
    price: data.price,
    comparePrice: data.comparePrice,
  }
}

/** Продукт като карта в менюто — същият вид като ръчно въведените. */
const productCard = (p: Product): MenuCard => {
  const data = productCardData(p)
  return {
    imageUrl: data.imageUrl,
    imageAlt: data.imageAlt,
    title: data.title,
    specLine: data.tagline,
    url: data.url,
    label: null,
    ribbon: null,
    price: data.price,
    comparePrice: data.comparePrice,
  }
}

/** Карта-заместител за категория без продукти. */
const soonCard = (): MenuCard => ({
  imageUrl: null,
  imageAlt: '',
  title: 'Скоро',
  specLine: null,
  url: null,
  label: null,
  ribbon: null,
})

/**
 * Съдържанието на автоматичен панел.
 *
 * Първият продукт е голямата карта, следващите шест — малките. По-малко
 * продукти дават по-малко карти, без празни места. Категория без продукти
 * показва заместители с надпис „Скоро" — панелът не остава празен.
 */
const autoSections = (
  category: Category,
  products: Product[],
  accessories: Product[],
): MenuSection[] => {
  const [first, ...rest] = products
  const url = categoryPath(category.slug)

  const sections: MenuSection[] = [
    {
      heading: category.title,
      viewAllLabel: 'Виж всички',
      viewAllUrl: url,
      featured: first ? productCard(first) : soonCard(),
      cards: first ? rest.map(productCard) : [soonCard(), soonCard(), soonCard()],
      showViewAllTile: true,
      viewAllTileUrl: url,
    },
  ]

  /*
    Аксесоарите в панела идват от полето „Съвместим с" на самите аксесоари,
    не от подкатегория „Аксесоари за DELTA". Секцията се появява само ако
    има какво да покаже.
  */
  if (accessories.length) {
    sections.push({
      heading: 'Аксесоари',
      viewAllLabel: 'Виж всички',
      viewAllUrl: url,
      featured: null,
      cards: accessories.slice(0, 6).map(productCard),
      showViewAllTile: false,
      viewAllTileUrl: null,
    })
  }

  return sections
}

/**
 * Адресът на „Виж всички": категорията, или ръчно вписаният адрес.
 *
 * Категорията е основната, защото адресът ѝ следва преименуванията;
 * ръчното поле остава за връзка извън категориите.
 */
const viewAllUrl = (section: { viewAllCategory?: unknown; viewAllUrl?: string | null }) => {
  const c = section.viewAllCategory
  if (c && typeof c === 'object' && 'slug' in c) return categoryPath((c as Category).slug)
  return section.viewAllUrl ?? null
}

const manualSections = (panel: MenuPanel, products: ProductsById): MenuSection[] =>
  (panel.sections ?? []).map((section) => ({
    heading: section.heading,
    viewAllLabel: section.viewAllLabel,
    viewAllUrl: viewAllUrl(section),
    featured: toCard(section.featured, products),
    cards: (section.cards ?? [])
      .map((c) => toCard(c as RawCard, products))
      .filter((c): c is MenuCard => c !== null),
    showViewAllTile: Boolean(section.showViewAllTile),
    viewAllTileUrl: section.viewAllTileUrl ?? viewAllUrl(section),
  }))

/** Панел в автоматичен режим е само този с избрана категория; иначе се държи като ръчен. */
const boundCategory = (panel: MenuPanel): Category | null => {
  if (panel.mode === 'manual') return null
  const c = panel.category
  return c && typeof c !== 'number' ? c : null
}

export const Header = async () => {
  const [header, settings] = await Promise.all([getGlobal('header'), getGlobal('site-settings')])

  /* Всички панели от менюто, веднъж, за да се съберат категориите им. */
  const panels: MenuPanel[] = []
  for (const item of header.items ?? []) {
    for (const group of item.groups ?? []) {
      for (const entry of group.entries ?? []) {
        if (entry.panel && typeof entry.panel !== 'number') panels.push(entry.panel)
      }
    }
  }

  const categoryIds = [
    ...new Set(panels.map(boundCategory).filter((c): c is Category => c !== null).map((c) => c.id)),
  ]

  /* Продуктите зад ръчните карти — една заявка за всички панели. */
  const cardProductIds = new Set<number>()
  for (const panel of panels) {
    if (boundCategory(panel)) continue
    for (const section of panel.sections ?? []) {
      const featured = cardProductId(section.featured)
      if (featured !== null) cardProductIds.add(featured)
      for (const card of section.cards ?? []) {
        const id = cardProductId(card as RawCard)
        if (id !== null) cardProductIds.add(id)
      }
    }
  }

  const tree = await getCategoryTree()

  /*
    Автоматичният панел показва продуктите на цялото си разклонение:
    панелът „DELTA серия" държи и DELTA 3, и DELTA Pro. Затова за всяка
    категория се пращат номерата на нея и на всичко под нея.
  */
  const branchByCategory = new Map(categoryIds.map((id) => [id, categoryBranchIds(tree, id)]))
  const allBranchIds = [...new Set([...branchByCategory.values()].flat())]

  const [productsByCategory, cardProducts, accessories] = await Promise.all([
    getMenuProducts(allBranchIds),
    getProductsByIds([...cardProductIds].sort((a, b) => a - b)),
    getCompatibleAccessories(allBranchIds),
  ])

  /* Продуктите и аксесоарите, събрани по КОРЕНА на всяко разклонение. */
  const byCategory: Record<number, Product[]> = {}
  const accessoriesByCategory: Record<number, Product[]> = {}

  for (const [id, branch] of branchByCategory) {
    byCategory[id] = branch.flatMap((child) => productsByCategory[child] ?? []).slice(0, 7)

    const own = new Set(branch)
    accessoriesByCategory[id] = accessories.filter((acc) =>
      (acc.compatibleWith ?? []).some((rel) => {
        if (!rel || typeof rel !== 'object' || rel.relationTo !== 'categories') return false
        const catId = typeof rel.value === 'number' ? rel.value : rel.value?.id
        return typeof catId === 'number' && own.has(catId)
      }),
    )
  }

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

          const category = boundCategory(panel)

          return {
            key: `panel-${panel.id}`,
            // Празно заглавие в автоматичен режим значи „името на категорията".
            label: panel.title?.trim() || category?.title || panel.slug,
            url: category ? categoryPath(category.slug) : categoryPath(panel.slug),
            sections: category
              ? autoSections(
                  category,
                  byCategory[category.id] ?? [],
                  accessoriesByCategory[category.id] ?? [],
                )
              : manualSections(panel, cardProducts),
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
