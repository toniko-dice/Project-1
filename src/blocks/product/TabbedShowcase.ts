import type { Block } from 'payload'
import { anchorField, blockLabel, rowLabel } from './shared'

/**
 * Секция с раздели — клик върху раздел сменя снимката и редовете под нея.
 *
 * Покрива две места в оригинала: сценариите на употреба
 * (къмпинг, снимки на открито, работа на терен) и трите начина за зареждане.
 *
 * Стойностите се въвеждат ръчно и НЕ се смятат от капацитета. Числата на
 * EcoFlow не следват просто деление — при 1024Wh и лампа 10W делението дава
 * 102 часа, а официалната стойност е 58. Съотношението не е постоянно,
 * затова формула в кода би дала числа, различни от техните.
 */
export const TabbedShowcase: Block = {
  slug: 'tabbedShowcase',
  labels: { singular: 'Секция с раздели', plural: 'Секции с раздели' },
  admin: blockLabel('heading'),
  fields: [
    anchorField,
    { name: 'heading', type: 'text', label: 'Заглавие' },
    {
      name: 'tabs',
      type: 'array',
      label: 'Раздели',
      labels: { singular: 'Раздел', plural: 'Раздели' },
      minRows: 2,
      maxRows: 5,
      admin: { ...rowLabel('label', 'Раздел') },
      fields: [
        { name: 'label', type: 'text', required: true, label: 'Име на раздела' },
        { name: 'image', type: 'upload', relationTo: 'media', required: true, label: 'Снимка' },
        {
          name: 'rows',
          type: 'array',
          label: 'Редове',
          labels: { singular: 'Ред', plural: 'Редове' },
          /*
            Няма долна граница нарочно. На оригинала има раздели с една
            стойност и раздели изобщо без стойности — изискване за поне два
            реда блокира публикуването на верни данни.
          */
          maxRows: 6,
          admin: { ...rowLabel('label', 'Ред') },
          fields: [
            {
              name: 'icon',
              type: 'upload',
              relationTo: 'media',
              label: 'Иконка',
              admin: { description: 'По избор. Малка иконка вляво от реда.' },
            },
            {
              name: 'label',
              type: 'text',
              required: true,
              label: 'Уред или начин',
              admin: { description: 'Напр. лампа за къмпинг, или: от контакт.' },
            },
            {
              name: 'sublabel',
              type: 'text',
              label: 'Пояснение',
              admin: { description: 'Напр. 10 W или 1400W.' },
            },
            {
              name: 'value',
              type: 'text',
              required: true,
              label: 'Стойност',
              admin: {
                description:
                  'Напр. 58 ч или 45 мин. Взима се от официален източник — не се пресмята.',
              },
            },
          ],
        },
      ],
    },
  ],
}
