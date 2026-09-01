import type { Block } from 'payload'

import { BundleOptions } from './BundleOptions'
import { ComparisonTable } from './ComparisonTable'
import { FaqBlock } from './FaqBlock'
import { FeatureSection } from './FeatureSection'
import { Footnotes } from './Footnotes'
import { InTheBox } from './InTheBox'
import { KeySpecStrip } from './KeySpecStrip'
import { LegalText } from './LegalText'
import { RelatedProducts } from './RelatedProducts'
import { SpecTable } from './SpecTable'
import { TabbedShowcase } from './TabbedShowcase'

export {
  BundleOptions,
  ComparisonTable,
  FaqBlock,
  FeatureSection,
  Footnotes,
  InTheBox,
  KeySpecStrip,
  LegalText,
  RelatedProducts,
  SpecTable,
  TabbedShowcase,
}

/**
 * Секциите, които собственикът може да добавя към продуктова страница.
 *
 * Подредбата тук е подредбата в падащото меню „Добави секция" —
 * от най-често използваните надолу.
 */
export const productBlocks: Block[] = [
  KeySpecStrip,
  FeatureSection,
  TabbedShowcase,
  BundleOptions,
  ComparisonTable,
  InTheBox,
  SpecTable,
  FaqBlock,
  RelatedProducts,
  Footnotes,
  LegalText,
]
