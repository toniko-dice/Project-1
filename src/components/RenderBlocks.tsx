import { Fragment, type ReactNode } from 'react'

import type { Page } from '@/payload-types'
import { uniqueAnchor } from '@/lib/anchors'
import { type Anchor, ProductAnchorNav } from './ProductAnchorNav'
import {
  BannerCarouselBlock,
  HeroBannerBlock,
  PromoCardsBlock,
  WideBannerBlock,
} from './blocks/banners'
import { BenefitsGridBlock, LogoWallBlock, TestimonialsBlockRenderer } from './blocks/content'
import { PageIntroBlock, QuoteFormBlock } from './blocks/quote'
import { RichTextSection, SimpleTableSection } from './blocks/text'
import {
  AccordionImageBlock,
  ContentSliderBlock,
  GuideFaqBlock,
  GuideLegalTextBlock,
  ImageWithTextBlock,
  PageHeroBlock,
  RuntimeCompareBlock,
  SplitBannerBlock,
} from './blocks/guide'
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

  /*
    Котвите за „Лента с котви" — от „Надпис в лентата с котви" на видимите
    секции, по реда им. Идентификаторът е от надписа (`uniqueAnchor`, както
    на продуктовата страница), за да е четим адресът: `#vkashti`.
  */
  /* Страница-ръководство (със „Заглавна снимка (H1)") — каруселът взима нейния стил. */
  const guide = layout.some((b) => b.blockType === 'pageHero' && !b.hidden)

  const used = new Set<string>()
  const anchorIds = layout.map((b) => {
    const label = 'anchorLabel' in b ? b.anchorLabel?.trim() : ''
    return !b.hidden && label ? uniqueAnchor(label, used) : null
  })
  const anchors: Anchor[] = layout.flatMap((b, i) =>
    anchorIds[i] && 'anchorLabel' in b ? [{ id: anchorIds[i]!, label: b.anchorLabel!.trim() }] : [],
  )

  return (
    <>
      {layout.map((block, i) => {
        const key = `${block.blockType}-${i}`
        const рендерирана =
          block.blockType === 'anchorNav'
            ? block.hidden
              ? null
              : <ProductAnchorNav key={key} anchors={anchors} />
            : рендер(block, key, showBgn, i, guide)
        /* Котвата е обвивка — блоковете не знаят за нея; `scroll-mt` е под залепената лента. */
        const секция = anchorIds[i] ? (
          <div key={key} id={anchorIds[i]!} className="scroll-mt-14">
            {рендерирана}
          </div>
        ) : (
          рендерирана
        )
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
const рендер = (
  block: NonNullable<Page['layout']>[number],
  key: string,
  showBgn: boolean,
  index: number,
  guide: boolean,
) => {
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
      return <ProductCarouselBlock key={key} block={block} showBgn={showBgn} guide={guide} />
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
    case 'pageHero':
      return <PageHeroBlock key={key} block={block} />
    case 'contentSlider':
      return <ContentSliderBlock key={key} block={block} />
    case 'accordionImage':
      return <AccordionImageBlock key={key} block={block} index={index} />
    case 'splitBanner':
      return <SplitBannerBlock key={key} block={block} />
    case 'runtimeCompare':
      return <RuntimeCompareBlock key={key} block={block} showBgn={showBgn} />
    case 'imageWithText':
      return <ImageWithTextBlock key={key} block={block} />
    case 'faqBlock':
      return <GuideFaqBlock key={key} block={block} index={index} />
    case 'legalText':
      return <GuideLegalTextBlock key={key} block={block} />
    case 'pageIntro':
      return <PageIntroBlock key={key} block={block} />
    case 'quoteForm':
      return <QuoteFormBlock key={key} block={block} />
    case 'richText':
      return <RichTextSection key={key} block={block} />
    case 'simpleTable':
      return <SimpleTableSection key={key} block={block} />
    default:
      return null
  }
}
