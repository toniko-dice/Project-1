import type { Block } from 'payload'
import { requiredUnlessHidden } from './shared'

/**
 * Лента с банерни карти — „Нови продукти" в оригинала.
 *
 * Различава се от „Лента с продукти" по това, че картите НЕ идват от
 * каталога. Всяка е ръчно направен банер със собствена снимка, текст и до
 * два бутона. Затова е отделен блок, а не настройка на другия: продуктовата
 * карта се пълни от продукта, тази — от собственика.
 */
export const BannerCarousel: Block = {
  slug: 'bannerCarousel',
  labels: { singular: 'Лента с банери', plural: 'Ленти с банери' },
  imageAltText: 'Хоризонтална лента с банерни карти',
  fields: [
    { name: 'heading', type: 'text', label: 'Заглавие на секцията' },
    {
      name: 'cards',
      type: 'array',
      label: 'Карти',
      labels: { singular: 'Карта', plural: 'Карти' },
      minRows: 2,
      maxRows: 10,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: {
            path: '@/components/admin/RowLabel#RowLabel',
            clientProps: { field: 'heading', fallback: 'Карта' },
          },
        },
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          validate: requiredUnlessHidden,
          label: 'Снимка',
          admin: { description: 'Запълва цялата карта. Препоръчително 800×1000px (портрет).' },
        },
        {
          name: 'tag',
          type: 'text',
          label: 'Етикет',
          admin: { description: 'Малкият оранжев текст най-отгоре. Напр. „Ново" или „Горещо 🔥".' },
        },
        { name: 'heading', type: 'text', label: 'Заглавие' },
        { name: 'subheading', type: 'text', label: 'Подзаглавие' },
        {
          name: 'textTheme',
          type: 'select',
          label: 'Цвят на текста',
          defaultValue: 'light',
          options: [
            { label: 'Светъл (върху тъмна снимка)', value: 'light' },
            { label: 'Тъмен (върху светла снимка)', value: 'dark' },
          ],
        },
        {
          name: 'buttons',
          type: 'array',
          label: 'Бутони',
          labels: { singular: 'Бутон', plural: 'Бутони' },
          maxRows: 2,
          admin: {
            description: 'До два бутона на един ред под текста. Може и без нито един.',
            components: {
              RowLabel: {
                path: '@/components/admin/RowLabel#RowLabel',
                clientProps: { field: 'label', fallback: 'Бутон' },
              },
            },
          },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'label', type: 'text', validate: requiredUnlessHidden, label: 'Текст', admin: { width: '40%' } },
                { name: 'url', type: 'text', label: 'Адрес', admin: { width: '35%' } },
                {
                  name: 'style',
                  type: 'select',
                  label: 'Вид',
                  defaultValue: 'white',
                  admin: { width: '25%' },
                  options: [
                    { label: 'Бял', value: 'white' },
                    { label: 'Бял с контур', value: 'outline' },
                    { label: 'Черен', value: 'black' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
