import type { GlobalConfig } from 'payload'
import { revalidateGlobal } from '../lib/revalidate'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Общи настройки',
  admin: { group: 'Настройки' },
  access: { read: () => true },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      type: 'collapsible',
      label: 'Промо лента най-отгоре',
      fields: [
        { name: 'announcementEnabled', type: 'checkbox', label: 'Показване', defaultValue: true },
        { name: 'announcementText', type: 'text', label: 'Текст' },
        { name: 'announcementUrl', type: 'text', label: 'Линк' },
      ],
    },
    {
      type: 'collapsible',
      label: 'Марка',
      fields: [
        { name: 'logo', type: 'upload', relationTo: 'media', label: 'Лого (светла версия)' },
        { name: 'logoDark', type: 'upload', relationTo: 'media', label: 'Лого (тъмна версия)' },
        {
          name: 'brandColor',
          type: 'text',
          label: 'Основен цвят',
          defaultValue: '#00A862',
          admin: {
            description:
              'Заместете с точния фирмен цвят от брандбука. Използва се за бутони и акценти.',
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Магазин и цени',
      fields: [
        {
          name: 'shopUrl',
          type: 'text',
          label: 'Адрес на външния магазин',
          admin: { description: 'Където водят бутоните за покупка, ако продуктът няма собствен линк.' },
        },
        {
          name: 'showBgnPrices',
          type: 'checkbox',
          label: 'Показване на левова равностойност',
          // Двойното обозначаване отпадна като изискване на 8 август 2026 г.
          // Кодът за преизчисляване се запазва, но не се показва по подразбиране.
          defaultValue: false,
          admin: {
            description:
              'Двойно обозначаване EUR / BGN по фиксирания курс 1.95583. Изисква се през преходния период след въвеждането на еврото.',
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Контакти',
      fields: [
        { name: 'companyName', type: 'text', label: 'Фирма' },
        { name: 'vatNumber', type: 'text', label: 'ЕИК / ДДС номер' },
        { name: 'address', type: 'textarea', label: 'Адрес' },
        { name: 'phone', type: 'text', label: 'Телефон' },
        { name: 'email', type: 'email', label: 'Имейл' },
        {
          name: 'distributorNotice',
          type: 'text',
          label: 'Бележка за статута',
          defaultValue: 'Официален дистрибутор на EcoFlow за България',
        },
      ],
    },
  ],
}
