import type { Field } from 'payload'

/** Бутон с текст и адрес. Ползва се във всички банерни блокове. */
export const linkField = (overrides?: { name?: string; label?: string }): Field => ({
  name: overrides?.name ?? 'cta',
  type: 'group',
  label: overrides?.label ?? 'Бутон',
  fields: [
    { name: 'label', type: 'text', label: 'Текст', defaultValue: 'Разгледай' },
    {
      name: 'url',
      type: 'text',
      label: 'Адрес',
      admin: { description: 'Вътрешен път (/products) или пълен адрес към външния магазин.' },
    },
    {
      name: 'newTab',
      type: 'checkbox',
      label: 'Отваряне в нов таб',
      defaultValue: false,
    },
  ],
})

/** Тъмна или светла подложка. Референтният дизайн редува тъмни банери върху светъл фон. */
export const themeField: Field = {
  name: 'theme',
  type: 'select',
  label: 'Цветова схема',
  defaultValue: 'dark',
  options: [
    { label: 'Тъмна (черен фон, бял текст)', value: 'dark' },
    { label: 'Светла (бял фон, тъмен текст)', value: 'light' },
  ],
}

/** Хоризонтално подравняване на текста върху банер. */
export const alignField: Field = {
  name: 'align',
  type: 'select',
  label: 'Позиция на текста',
  defaultValue: 'left',
  options: [
    { label: 'Ляво', value: 'left' },
    { label: 'Център', value: 'center' },
    { label: 'Дясно', value: 'right' },
  ],
}
