import type { GlobalAfterChangeHook, GlobalBeforeChangeHook, GlobalConfig } from 'payload'
import { expireTags, revalidateGlobal } from '../lib/revalidate'
import { HOME_H1_DEFAULT } from '../lib/title'
import { adminField, hiddenFor, isEditor, publicRead } from '../lib/access'

/** „Последна промяна" на заключването — кой и кога, само при смяна на отметката. */
const отбележиЗаключването: GlobalBeforeChangeHook = ({ data, originalDoc, req }) => {
  const преди = (originalDoc as { gate?: { locked?: boolean | null } } | undefined)?.gate?.locked
  const сега = (data as { gate?: { locked?: boolean | null } }).gate?.locked
  if (сега !== undefined && сега !== преди) {
    const кой = (req.user as { email?: string } | null)?.email ?? 'системата'
    const кога = new Date().toLocaleString('bg-BG', { timeZone: 'Europe/Sofia' })
    data.gate = { ...data.gate, lastChange: `${сега ? 'Заключен' : 'Отключен'} от ${кой} на ${кога}` }
  }
  return data
}

/** Middleware пази състоянието до 10 s (таг `site-gate`) — изчиства се веднага. */
const изчистиЗаключването: GlobalAfterChangeHook = ({ doc }) => {
  expireTags(['site-gate'])
  return doc
}

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Общи настройки',
  admin: { hidden: hiddenFor('admin', 'editor'), group: 'Настройки' },
  access: { read: publicRead, update: isEditor },
  hooks: { beforeChange: [отбележиЗаключването], afterChange: [изчистиЗаключването, revalidateGlobal] },
  fields: [
    {
      /*
        Заключен достъп (`task-zaklyuchen-dostap.md`): вход с акаунта на админа.
        Само администраторът го вижда и сменя — и в админа, и през API-то
        (публичното четене на настройките не го показва). Middleware го чете
        през `/api/zaklyuchvane`.
      */
      name: 'gate',
      type: 'group',
      label: 'Заключен достъп',
      access: { read: adminField, update: adminField, create: adminField },
      fields: [
        {
          name: 'locked',
          type: 'checkbox',
          label: 'Сайтът е заключен — виждат го само влезлите потребители',
          defaultValue: true,
          admin: {
            description:
              'Включено — посетителите виждат само страницата за вход; влизате с имейла и паролата си за админа. Изключено — сайтът е отворен за всички.',
          },
        },
        { name: 'lastChange', type: 'text', label: 'Последна промяна', admin: { readOnly: true } },
      ],
    },
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
      label: 'Бюлетин',
      fields: [
        {
          name: 'newsletterConsentText',
          type: 'textarea',
          label: 'Текст на съгласието',
          defaultValue:
            'Съгласен съм да получавам новини и оферти от EcoFlow България. Мога да се отпиша по всяко време.',
          admin: {
            description:
              'Стои до задължителната отметка във формата за бюлетин. Изисква се от ЗЗЛД — затова е поле, а не зашит текст.',
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Начална страница',
      fields: [
        /*
          Тук, а не в самата начална страница: тя не се записва, докато
          три задължителни снимки са празни (CLAUDE.md, „Какво още не е
          направено") — полето там би било непроменимо.
        */
        {
          name: 'homeH1',
          type: 'text',
          label: 'H1 на началната страница',
          defaultValue: HOME_H1_DEFAULT,
          admin: {
            description:
              'Главното заглавие на началната страница — за търсачките описва сайта. Показва се над лентата с категориите.',
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
        {
          /*
            За данните за търсачките (`Organization` на началната и на „За ДИ
            СИ 2008", `task-stranica-za-di-si-2008.md`). Празно поле не влиза.
          */
          type: 'collapsible',
          label: 'Фирмата за търсачките',
          admin: {
            initCollapsed: true,
            description: 'Описанието на фирмата в Google (Organization). Не се показва на страниците.',
          },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'legalName', type: 'text', label: 'Пълно име', admin: { width: '50%', placeholder: 'ДИ СИ 2008 ООД' } },
                { name: 'alternateName', type: 'text', label: 'Познато още като', admin: { width: '50%', placeholder: 'Dice.bg' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'vatId', type: 'text', label: 'ДДС №', admin: { width: '50%', placeholder: 'BG200110465' } },
                { name: 'foundingYear', type: 'number', label: 'Основана (година)', admin: { width: '50%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'addressStreet', type: 'text', label: 'Улица и номер', admin: { width: '60%' } },
                { name: 'addressCity', type: 'text', label: 'Град', admin: { width: '40%' } },
              ],
            },
          ],
        },
        {
          name: 'phone',
          type: 'text',
          label: 'Телефон',
          // `task-futar.md`: номерът не се показва никъде — само имейлът и формата на /kontakti.
          admin: { description: 'Не се показва на сайта.' },
        },
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
