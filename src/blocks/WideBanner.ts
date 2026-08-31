import type { Block } from 'payload'
import { alignField, linkField, themeField } from './shared'

/** Единичен широк банер през цялата ширина — "Големи поръчки, по-големи отстъпки". */
export const WideBanner: Block = {
  slug: 'wideBanner',
  labels: { singular: 'Широк банер', plural: 'Широки банери' },
  imageAltText: 'Единичен банер през цялата ширина на страницата',
  fields: [
    { name: 'heading', type: 'text', required: true, label: 'Заглавие' },
    { name: 'subheading', type: 'text', label: 'Подзаглавие' },
    { name: 'image', type: 'upload', relationTo: 'media', required: true, label: 'Изображение' },
    linkField(),
    alignField,
    themeField,
  ],
}
