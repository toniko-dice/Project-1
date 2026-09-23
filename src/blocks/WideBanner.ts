import type { Block } from 'payload'
import { alignField, eyebrowColorField, linkField, requiredUnlessHidden, themeField } from './shared'

/** Единичен широк банер през цялата ширина — „Големи поръчки, по-големи отстъпки". */
export const WideBanner: Block = {
  slug: 'wideBanner',
  labels: { singular: 'Широк банер', plural: 'Широки банери' },
  imageAltText: 'Единичен банер през цялата ширина на страницата',
  fields: [
    {
      name: 'sectionTitle',
      type: 'text',
      label: 'Заглавие над банера',
      admin: { description: 'По избор. В оригинала някои банери са без заглавие над тях.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'eyebrow', type: 'text', label: 'Надзаглавие', admin: { width: '60%' } },
        { ...eyebrowColorField, admin: { width: '40%' } },
      ],
    },
    { name: 'heading', type: 'text', validate: requiredUnlessHidden, label: 'Заглавие' },
    { name: 'subheading', type: 'text', label: 'Подзаглавие' },
    {
      name: 'priceNote',
      type: 'text',
      label: 'Ценови текст',
      admin: { description: 'По избор. Напр. „от 1199 €". Празно поле не показва нищо.' },
    },
    { name: 'image', type: 'upload', relationTo: 'media', validate: requiredUnlessHidden, label: 'Изображение' },
    linkField(),
    {
      type: 'row',
      fields: [
        { ...alignField, admin: { width: '50%' } },
        { ...themeField, admin: { width: '50%' } },
      ],
    },
  ],
}
