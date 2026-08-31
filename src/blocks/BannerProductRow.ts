import type { Block } from 'payload'
import { linkField, themeField } from './shared'

/**
 * Основният повтарящ се модел от референтния дизайн:
 * заглавие на секцията, голям банер с един акцентен продукт,
 * и под него ред с продуктови карти + плочка "Виж още".
 *
 * В референтния сайт този модел се среща пет пъти
 * (Домашно захранване, Захранване на открито, Домашна батерия,
 * Външни батерии, Аксесоари).
 */
export const BannerProductRow: Block = {
  slug: 'bannerProductRow',
  labels: { singular: 'Банер + продукти', plural: 'Банери + продукти' },
  imageAltText: 'Секция с голям банер и ред продукти под него',
  fields: [
    {
      name: 'sectionTitle',
      type: 'text',
      required: true,
      label: 'Заглавие на секцията',
      admin: { description: 'Напр. "Домашно резервно захранване".' },
    },
    {
      name: 'showBanner',
      type: 'checkbox',
      label: 'Показване на банера',
      defaultValue: true,
    },
    {
      name: 'banner',
      type: 'group',
      label: 'Банер',
      admin: { condition: (_, siblingData) => Boolean(siblingData?.showBanner) },
      fields: [
        { name: 'eyebrow', type: 'text', label: 'Надзаглавие' },
        { name: 'heading', type: 'text', label: 'Заглавие' },
        { name: 'subheading', type: 'text', label: 'Подзаглавие' },
        {
          name: 'priceNote',
          type: 'text',
          label: 'Ценови текст',
          admin: { description: 'Напр. "от 7 299 €" или "спестявате до 1 200 €".' },
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Изображение',
          admin: { description: 'Препоръчително 2400×800px.' },
        },
        linkField(),
        themeField,
      ],
    },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      label: 'Продукти в реда',
      admin: {
        description:
          'Подредбата тук определя реда на екрана. Препоръчително 4–5 броя — на широк екран се показват пет колони.',
      },
    },
    {
      name: 'showMoreTile',
      type: 'checkbox',
      label: 'Плочка "Виж още" в края на реда',
      defaultValue: true,
    },
    {
      name: 'moreTile',
      type: 'group',
      label: 'Плочка "Виж още"',
      admin: { condition: (_, siblingData) => Boolean(siblingData?.showMoreTile) },
      fields: [
        { name: 'label', type: 'text', defaultValue: 'Виж още', label: 'Текст' },
        { name: 'description', type: 'text', label: 'Описание под текста' },
        { name: 'image', type: 'upload', relationTo: 'media', label: 'Изображение' },
        { name: 'url', type: 'text', label: 'Адрес' },
      ],
    },
  ],
}
