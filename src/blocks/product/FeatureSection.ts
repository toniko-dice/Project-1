import type { Block } from 'payload'
import { anchorField, blockLabel, rowLabel } from './shared'

/**
 * Секция с голяма снимка и текст до нея.
 *
 * Основният повтарящ се модел в оригинала — секциите за мощността,
 * за бързото зареждане, за LFP клетките и останалите.
 */
export const FeatureSection: Block = {
  slug: 'featureSection',
  labels: { singular: 'Секция с изображение', plural: 'Секции с изображение' },
  admin: blockLabel('heading'),
  fields: [
    anchorField,
    { name: 'heading', type: 'text', required: true, label: 'Заглавие' },
    { name: 'subheading', type: 'text', label: 'Подзаглавие' },
    { name: 'body', type: 'textarea', label: 'Текст' },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Изображение',
      admin: { description: 'Препоръчително 1680px широчина, както в оригинала.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'layout',
          type: 'select',
          label: 'Разположение',
          defaultValue: 'image-right',
          admin: { width: '50%' },
          options: [
            { label: 'Снимка вдясно', value: 'image-right' },
            { label: 'Снимка вляво', value: 'image-left' },
            { label: 'Снимка на цяла ширина, текст върху нея', value: 'image-full' },
          ],
        },
        {
          name: 'theme',
          type: 'select',
          label: 'Цветова схема',
          defaultValue: 'light',
          admin: { width: '50%' },
          options: [
            { label: 'Светла', value: 'light' },
            { label: 'Тъмна', value: 'dark' },
          ],
        },
      ],
    },
    {
      name: 'stats',
      type: 'array',
      label: 'Числа под текста',
      labels: { singular: 'Число', plural: 'Числа' },
      admin: {
        description: 'По избор. Напр. 3600W и под него — пикова мощност.',
        ...rowLabel('value', 'Число'),
      },
      fields: [
        { name: 'value', type: 'text', required: true, label: 'Число' },
        { name: 'label', type: 'text', required: true, label: 'Пояснение' },
      ],
    },
  ],
}
