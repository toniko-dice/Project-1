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
    {
      name: 'heading',
      type: 'text',
      label: 'Заглавие',
      admin: {
        description:
          'По избор. Празно заглавие дава секция само със снимката — така е главният банер в оригинала, чието заглавие стои на следващата секция.',
      },
    },
    {
      type: 'row',
      fields: [
        { name: 'subheading', type: 'text', label: 'Подзаглавие', admin: { width: '60%' } },
        {
          /*
            „Над" е по подразбиране, за да не се разместят съществуващите
            секции — при Classic подзаглавието стои над заглавието като
            малък ред. В оригинала на Max има и обратното: заглавие, под
            него по-едро подзаглавие, после текстът.
          */
          name: 'subheadingPosition',
          type: 'select',
          label: 'Място на подзаглавието',
          defaultValue: 'above',
          options: [
            { label: 'Над заглавието (малък ред)', value: 'above' },
            { label: 'Под заглавието (по-едро)', value: 'below' },
          ],
          admin: { width: '40%' },
        },
      ],
    },
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
          options: [
            { label: 'Снимка вдясно', value: 'image-right' },
            { label: 'Снимка вляво', value: 'image-left' },
            { label: 'Текст отгоре, снимка отдолу', value: 'stacked' },
            { label: 'Снимка на цяла ширина, текст върху нея', value: 'image-full' },
          ],
          admin: {
            width: '50%',
            description:
              'За снимка, която сама съдържа текст или графики — колаж, екрани от приложение — изберете „Текст отгоре, снимка отдолу". Тогава снимката се показва цяла, без изрязване и без слой върху нея.',
          },
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
