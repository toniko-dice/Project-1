import type { Block } from 'payload'
import { alignField, linkField, themeField } from './shared'

export const HeroBanner: Block = {
  slug: 'heroBanner',
  labels: { singular: 'Главен банер', plural: 'Главни банери' },
  imageAltText: 'Голям банер най-отгоре на страницата',
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Надзаглавие',
      admin: { description: 'Малкият текст над заглавието. Напр. "Сезон на бурите".' },
    },
    { name: 'heading', type: 'text', required: true, label: 'Заглавие' },
    { name: 'subheading', type: 'textarea', label: 'Подзаглавие' },
    {
      name: 'note',
      type: 'text',
      label: 'Бележка отдолу',
      admin: { description: 'Напр. срок на промоцията: "5 – 31 август".' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
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
    alignField,
    themeField,
    {
      name: 'overlay',
      type: 'select',
      label: 'Затъмняване на снимката',
      defaultValue: 'medium',
      admin: {
        description:
          'Увеличете, ако текстът не се чете добре върху снимката. Изисква се контраст 4.5:1.',
      },
      options: [
        { label: 'Без', value: 'none' },
        { label: 'Леко', value: 'light' },
        { label: 'Средно', value: 'medium' },
        { label: 'Силно', value: 'strong' },
      ],
    },
  ],
}
