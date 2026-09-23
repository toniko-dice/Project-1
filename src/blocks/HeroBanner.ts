import type { Block } from 'payload'
import { alignField, eyebrowColorField, linkField, requiredUnlessHidden, themeField } from './shared'

/**
 * Голям банер най-отгоре на страницата.
 *
 * Оригиналът е слайдер с няколко кадъра, които се сменят сами. Затова
 * съдържанието живее в масива `slides`, а не направо в блока. Банер с
 * един слайд се държи като обикновен банер — без чертички и без смяна.
 */
export const HeroBanner: Block = {
  slug: 'heroBanner',
  labels: { singular: 'Главен банер', plural: 'Главни банери' },
  imageAltText: 'Голям банер най-отгоре на страницата',
  fields: [
    {
      name: 'autoplaySeconds',
      type: 'number',
      label: 'Смяна на слайдовете (секунди)',
      defaultValue: 6,
      min: 0,
      max: 30,
      admin: {
        description: 'Нула спира автоматичната смяна. Важи само при повече от един слайд.',
      },
    },
    {
      name: 'slides',
      type: 'array',
      label: 'Слайдове',
      labels: { singular: 'Слайд', plural: 'Слайдове' },
      minRows: 1,
      maxRows: 8,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: {
            path: '@/components/admin/RowLabel#RowLabel',
            clientProps: { field: 'heading', fallback: 'Слайд' },
          },
        },
      },
      fields: [
        {
          name: 'badgeImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Значка над надзаглавието',
          admin: {
            description:
              'По избор. Малка картинка — в оригинала това е „30 дни гаранция за цената". Показва се с истинската си височина, до 40px.',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'eyebrow',
              type: 'text',
              label: 'Надзаглавие',
              admin: {
                width: '60%',
                description: 'Малкият текст над заглавието. Напр. „Серия EcoFlow STREAM".',
              },
            },
            { ...eyebrowColorField, admin: { width: '40%' } },
          ],
        },
        { name: 'heading', type: 'text', validate: requiredUnlessHidden, label: 'Заглавие' },
        { name: 'subheading', type: 'textarea', label: 'Подзаглавие' },
        {
          name: 'note',
          type: 'text',
          label: 'Бележка отдолу',
          admin: { description: 'Напр. срок на промоцията: „5 – 31 август".' },
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          validate: requiredUnlessHidden,
          label: 'Фоново изображение',
          admin: { description: 'Препоръчително 2400×1000px. Текстът ляга върху него.' },
        },
        {
          name: 'imageMobile',
          type: 'upload',
          relationTo: 'media',
          label: 'Фоново изображение за телефон',
          admin: { description: 'По желание. Ако е празно, се ползва основното.' },
        },
        linkField(),
        {
          type: 'row',
          fields: [
            { ...alignField, admin: { width: '33%' } },
            { ...themeField, admin: { width: '33%' } },
            {
              name: 'overlay',
              type: 'select',
              label: 'Затъмняване на снимката',
              defaultValue: 'none',
              admin: {
                width: '34%',
                description: 'Увеличете, ако текстът не се чете добре върху снимката.',
              },
              options: [
                { label: 'Без', value: 'none' },
                { label: 'Леко', value: 'light' },
                { label: 'Средно', value: 'medium' },
                { label: 'Силно', value: 'strong' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
