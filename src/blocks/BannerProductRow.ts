import type { Block } from 'payload'
import { eyebrowColorField, linkField, requiredUnlessHidden, themeField } from './shared'

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
      validate: requiredUnlessHidden,
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
        {
          type: 'row',
          fields: [
            { name: 'eyebrow', type: 'text', label: 'Надзаглавие', admin: { width: '60%' } },
            { ...eyebrowColorField, admin: { width: '40%' } },
          ],
        },
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
          admin: {
            description:
              'Препоръчително 2400×800px. Остава задължително и при видео — показва се, докато то се зареди.',
          },
        },
        {
          name: 'video',
          type: 'upload',
          relationTo: 'media',
          label: 'Видео вместо снимка',
          admin: {
            description:
              'По избор. MP4 (H.264), 1920px широчина, без звук, до 20 MB. Върти се само, без бутони. При включена системна настройка за намалено движение се показва снимката.',
          },
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
        /*
          Петата колона в оригинала са ДВЕ карти една над друга. Горната е
          голяма, със снимка; долната е само текст със стрелка. Полетата с
          наставка „secondary" са за долната. Ако и двете са празни,
          колоната изобщо не се показва.
        */
        { name: 'label', type: 'text', defaultValue: 'Виж всички', label: 'Горна карта — текст' },
        { name: 'url', type: 'text', label: 'Горна карта — адрес' },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Горна карта — снимка',
          admin: { description: 'В оригинала това е групова снимка на продуктите от серията.' },
        },
        { name: 'description', type: 'text', label: 'Горна карта — описание' },
        { name: 'secondaryLabel', type: 'text', label: 'Долна карта — текст' },
        { name: 'secondaryUrl', type: 'text', label: 'Долна карта — адрес' },
      ],
    },
  ],
}
