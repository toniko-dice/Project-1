import { Fragment, type ReactNode } from 'react'

import type { Page } from '@/payload-types'
import {
  BannerCarouselBlock,
  HeroBannerBlock,
  PromoCardsBlock,
  WideBannerBlock,
} from './blocks/banners'
import { BenefitsGridBlock, LogoWallBlock, TestimonialsBlockRenderer } from './blocks/content'
import {
  BannerProductRowBlock,
  CategoryStripBlock,
  ProductCarouselBlock,
} from './blocks/products'

/**
 * Разпределя секциите на страницата към съответните компоненти.
 * Редът идва изцяло от админ панела — тук няма фиксирана подредба.
 */
export const RenderBlocks = ({
  layout,
  showBgn,
  heading,
}: {
  layout: Page['layout']
  showBgn: boolean
  /**
   * Заглавие на страницата (H1 на началната) — излиза точно над лентата с
   * категориите; без видима лента — след първата видима секция.
   */
  heading?: ReactNode
}) => {
  if (!layout?.length) return null

  const видими = layout.map((b, i) => (b.hidden ? -1 : i)).filter((i) => i >= 0)
  const лента = видими.find((i) => layout[i]!.blockType === 'categoryStrip')
  const преди = heading ? (лента ?? видими[1] ?? -1) : -1

  return (
    <>
      {layout.map((block, i) => {
        const key = `${block.blockType}-${i}`
        const секция = рендер(block, key, showBgn)
        return i === преди ? (
          <Fragment key={key}>
            {heading}
            {секция}
          </Fragment>
        ) : (
          секция
        )
      })}
      {heading && преди === -1 ? heading : null}
    </>
  )
}

/** Една секция към своя компонент; скритата — нищо. */
const рендер = (block: NonNullable<Page['layout']>[number], key: string, showBgn: boolean) => {
  /*
    Скритата секция остава в базата и в админа, но не се рендерира.
    Проверката е тук, а не във всеки блок — иначе при всеки нов блок
    трябва да се помни да я добави.
  */
  if (block.hidden) return null

  switch (block.blockType) {
    case 'heroBanner':
      return <HeroBannerBlock key={key} block={block} />
    case 'categoryStrip':
      /* Няма `block`: лентата чете категориите с отметката сама. */
      return <CategoryStripBlock key={key} />
    case 'bannerCarousel':
      return <BannerCarouselBlock key={key} block={block} />
    case 'productCarousel':
      return <ProductCarouselBlock key={key} block={block} showBgn={showBgn} />
    case 'bannerProductRow':
      return <BannerProductRowBlock key={key} block={block} showBgn={showBgn} />
    case 'promoCards':
      return <PromoCardsBlock key={key} block={block} />
    case 'wideBanner':
      return <WideBannerBlock key={key} block={block} />
    case 'benefitsGrid':
      return <BenefitsGridBlock key={key} block={block} />
    case 'testimonialsBlock':
      return <TestimonialsBlockRenderer key={key} block={block} />
    case 'logoWall':
      return <LogoWallBlock key={key} block={block} />
    default:
      return null
  }
}
