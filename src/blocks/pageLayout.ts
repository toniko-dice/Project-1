import type { Block, BlocksField } from 'payload'

import { hiddenField } from './shared'
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
  fields: [hiddenField, ...block.fields],
})

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
