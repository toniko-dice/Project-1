import type { CollectionConfig } from 'payload'
import { cleanSlug } from '../lib/slug'
import { revalidatePage, revalidatePageDelete } from '../lib/revalidate'
import type { Block } from 'payload'
import { hiddenField } from '../blocks/shared'
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
} from '../blocks'

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

export const Pages: CollectionConfig = {
  slug: 'pages',
  // Записите се подреждат с влачене в списъчния изглед.
  orderable: true,
  // Списъкът се отваря в подредбата, зададена с влаченето.
  defaultSort: '_order',
  labels: { singular: 'Страница', plural: 'Страници' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    group: 'Съдържание',
    description:
      'Всяка страница се сглобява от секции. Добавяйте, местете (с дръжката вляво) и триете секции свободно.',
  },
  access: { read: () => true },
  versions: { drafts: true },
  hooks: {
    afterChange: [revalidatePage],
    afterDelete: [revalidatePageDelete],
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Заглавие' },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'URL адрес',
      admin: {
        description:
          'Само малки латински букви, цифри и тирета. Кирилицата се транслитерира, интервалите стават тирета, представки като „products/" се махат. Не е нужно да пишете пътя — само името.',
      },
      hooks: {
        beforeValidate: [
          ({ value }) => (typeof value === 'string' ? cleanSlug(value) : value),
        ],
      },
    },
    {
      name: 'layout',
      type: 'blocks',
      label: 'Секции на страницата',
      labels: { singular: 'Секция', plural: 'Секции' },
      blocks: [
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
      ].map(withHidden),
    },
    {
      type: 'collapsible',
      label: 'SEO',
      admin: { initCollapsed: true },
      fields: [
        { name: 'metaTitle', type: 'text', label: 'Заглавие за търсачки' },
        { name: 'metaDescription', type: 'textarea', label: 'Описание за търсачки' },
        {
          name: 'metaImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Изображение при споделяне',
        },
      ],
    },
  ],
}
