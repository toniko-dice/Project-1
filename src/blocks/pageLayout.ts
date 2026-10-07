import type { Block, BlocksField, Field } from 'payload'

import {
  AccordionImage,
  AnchorNav,
  ContentSlider,
  GuideFaq,
  GuideLegalText,
  ImageWithText,
  PageHero,
  RuntimeCompare,
  SplitBanner,
} from './guide'
import { AwardsMarquee, CompanyStats, PressQuotes, ProductTabs, TextSection } from './about'
import { hiddenField } from './shared'
import { PageIntro } from './PageIntro'
import { QuoteForm } from './QuoteForm'
import { RichTextBlock } from './RichTextBlock'
import { SimpleTable } from './SimpleTable'
import {
  BannerCarousel,
  BannerProductRow,
  BenefitsGrid,
  CategoryStrip,
  HeroBanner,
  LogoWall,
  ProductCarousel,
  PromoCards,
  TestimonialsBlock,
  WideBanner,
} from './index'

/**
 * Слага отметката „Скрит" най-отгоре във всеки блок.
 *
 * Тук, а не поотделно във всеки файл — така новите блокове я получават
 * сами и няма как да се забрави. Блокът не се променя на място, а се
 * копира: конфигурациите се внасят и другаде.
 */
const withHidden = (block: Block): Block => ({
  ...block,
  fields: [hiddenField, ...(block.slug === 'anchorNav' ? [] : [anchorLabelField]), ...block.fields],
})

/**
 * Надписът на секцията в лентата с котви (блок „Лента с котви").
 *
 * Слага се централно, както „Скрит" — всеки блок може да е точка в
 * лентата, без да се помни поотделно. Празно — секцията не участва.
 */
const anchorLabelField: Field = {
  name: 'anchorLabel',
  type: 'text',
  label: 'Надпис в лентата с котви',
  admin: {
    description:
      'Попълнено — секцията е точка в „Лента с котви" на страницата. Празно — не участва.',
  },
}

/**
 * Блоковете на съставените страници.
 *
 * Ползват се и от `pages`, и от категориите — една и съща редакция,
 * един и същи рендер (`RenderBlocks`). Нов блок се добавя тук веднъж.
 */
export const pageBlocks: Block[] = [
  HeroBanner,
  CategoryStrip,
  ProductCarousel,
  BannerCarousel,
  BannerProductRow,
  PromoCards,
  WideBanner,
  BenefitsGrid,
  TestimonialsBlock,
  LogoWall,
  PageHero,
  AnchorNav,
  ContentSlider,
  AccordionImage,
  SplitBanner,
  RuntimeCompare,
  ImageWithText,
  GuideFaq,
  GuideLegalText,
  PageIntro,
  QuoteForm,
  RichTextBlock,
  SimpleTable,
  CompanyStats,
  ProductTabs,
  AwardsMarquee,
  TextSection,
  PressQuotes,
].map(withHidden)

/** Полето „Секции на страницата" — еднакво навсякъде, където се ползва. */
export const layoutField = (overrides: Partial<BlocksField> = {}): BlocksField => ({
  name: 'layout',
  type: 'blocks',
  label: 'Секции на страницата',
  labels: { singular: 'Секция', plural: 'Секции' },
  blocks: pageBlocks,
  ...overrides,
})
