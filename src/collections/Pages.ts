import type { CollectionConfig } from 'payload'
import { revalidatePage, revalidatePageDelete } from '../lib/revalidate'
import {
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

export const Pages: CollectionConfig = {
  slug: 'pages',
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
        description: 'Началната страница трябва да е с адрес "home". Останалите — напр. "za-nas".',
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
        BannerProductRow,
        PromoCards,
        WideBanner,
        BenefitsGrid,
        TestimonialsBlock,
        LogoWall,
      ],
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
