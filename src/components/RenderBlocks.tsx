import type { Page } from '@/payload-types'
import { HeroBannerBlock, PromoCardsBlock, WideBannerBlock } from './blocks/banners'
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
}: {
  layout: Page['layout']
  showBgn: boolean
}) => {
  if (!layout?.length) return null

  return (
    <>
      {layout.map((block, i) => {
        const key = `${block.blockType}-${i}`

        switch (block.blockType) {
          case 'heroBanner':
            return <HeroBannerBlock key={key} block={block} />
          case 'categoryStrip':
            return <CategoryStripBlock key={key} block={block} />
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
      })}
    </>
  )
}
