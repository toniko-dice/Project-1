import type { CheckboxField, Field, SelectField, Validate } from 'payload'

/*
  Общите полета са с конкретните си типове, не с общото `Field`.

  `Field` е обединение по `type`. При разпръскване (`{ ...themeField,
  admin: { width } }`) TypeScript губи разграничителя и резултатът вече не
  става за нито един член на обединението. С конкретния тип разпръскването
  остава валидно — а ширината се задава на място, защото един и същ избор
  стои в различни редове в различните блокове.
*/

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
    {
      name: 'style',
      type: 'select',
      label: 'Вид на бутона',
      defaultValue: 'light',
      options: [
        { label: 'Бял', value: 'light' },
        { label: 'Черен', value: 'dark' },
      ],
      admin: {
        description: 'Зависи от снимката отдолу. В оригинала бутоните върху банери са бели.',
      },
    },
  ],
})

/** Тъмна или светла подложка. Референтният дизайн редува тъмни банери върху светъл фон. */
export const themeField: SelectField = {
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
export const alignField: SelectField = {
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

/**
 * Цвят на надписа над заглавието.
 *
 * В оригинала този надпис е ту бял, ту оранжев — зависи от снимката под
 * него, не от темата на банера. Затова е отделно поле, а не се извежда
 * от `theme`.
 */
export const eyebrowColorField: SelectField = {
  name: 'eyebrowColor',
  type: 'select',
  label: 'Цвят на надзаглавието',
  defaultValue: 'white',
  options: [
    { label: 'Бяло', value: 'white' },
    { label: 'Оранжево', value: 'orange' },
  ],
}

/**
 * Скриване на секция.
 *
 * Скритата секция остава в списъка в админа, редактира се и се влачи като
 * останалите, но не се рендерира на сайта. Това е нарочно вместо изтриване:
 * сезонните секции се връщат, а изтритата се въвежда наново.
 *
 * Полето стои първо във всеки блок, за да се вижда веднага при отваряне.
 */
export const hiddenField: CheckboxField = {
  name: 'hidden',
  type: 'checkbox',
  label: 'Скрит',
  defaultValue: false,
  admin: {
    description: 'Секцията остава тук, но не се показва на сайта.',
  },
}

/**
 * Задължително поле — но само докато блокът се вижда.
 *
 * ЗАЩО НЕ `required: true`
 *
 * Payload проверява целия документ при запис. Едно празно задължително поле
 * в който и да е блок отхвърля цялата страница — включително промени в
 * съвсем други блокове. Собственикът отметна „Скрит" на едно място, записът
 * падна заради празна снимка на друго и отметката изчезна, без да е ясно
 * защо.
 *
 * А точно недовършените блокове са тези, които човек иска да скрие.
 *
 * `blockData` е най-близкият родителски блок — работи и за поле в масив
 * вътре в блока (карта, слайд, предимство), където `siblingData` е редът на
 * масива, не блокът.
 *
 * Задължителността остава в сила за видимите блокове.
 */
export const requiredUnlessHidden: Validate = (value, { blockData }) => {
  if ((blockData as { hidden?: boolean } | undefined)?.hidden === true) return true

  const празно =
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)

  return празно ? 'Полето е задължително.' : true
}
