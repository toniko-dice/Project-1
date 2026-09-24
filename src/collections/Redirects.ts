import type { CollectionConfig } from 'payload'

/**
 * Постоянни пренасочвания (308).
 *
 * Адресът на продукт съдържа серията му (`/kategorii/<серия>/<slug>`),
 * затова смяна на категория или на slug сменя адреса. Старият адрес се
 * записва тук автоматично от куките на продуктите и категориите —
 * собственикът не пише нищо на ръка. Линкове отвън (Google, dice.bg,
 * социални мрежи) продължават да работят.
 *
 * Скрита група „Настройки": списъкът е технически, не се редактира
 * всеки ден, но трябва да може да се погледне и да се изтрие остарял ред.
 */
export const Redirects: CollectionConfig = {
  slug: 'redirects',
  labels: { singular: 'Пренасочване', plural: 'Пренасочвания' },
  admin: {
    useAsTitle: 'from',
    defaultColumns: ['from', 'to', 'reason', 'createdAt'],
    group: 'Настройки',
    description:
      'Стари адреси, които водят към новите. Попълва се само — при смяна на категория или на адрес на продукт. Ред се трие само ако старият адрес вече не трябва да работи.',
  },
  access: { read: () => true },
  fields: [
    {
      name: 'from',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Стар адрес',
      admin: { description: 'Пътят без домейна, напр. /products/delta-3.' },
    },
    { name: 'to', type: 'text', required: true, label: 'Нов адрес' },
    {
      name: 'reason',
      type: 'text',
      label: 'Причина',
      admin: { description: 'Какво е предизвикало пренасочването — за четене от човек.' },
    },
  ],
}
