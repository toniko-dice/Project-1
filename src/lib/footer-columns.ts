import { CONTACT_PATH, FAQ_PATH } from './legal'

/**
 * Колоните на футъра (`task-futar.md`) — за `seed.ts` и за еднократния
 * `npm run futar:kontakti`. На живия сайт се редактират от „Футър" в
 * админа; тук е само началното състояние.
 *
 * Правните линкове са колона, затова долната лента е без тях.
 */
export const FOOTER_COLUMNS = [
  {
    heading: 'Продукти',
    links: [
      { label: 'Портативни електроцентрали', url: '/kategorii/portativni-elektrocentrali' },
      { label: 'Соларни панели', url: '/kategorii/solarni-paneli' },
      { label: 'Умни устройства', url: '/kategorii/umni-ustroystva' },
      { label: 'Зарядни', url: '/kategorii/zaryadni-ustroystva' },
    ],
  },
  {
    heading: 'Поддръжка',
    links: [
      { label: 'Гаранция', url: '/garanciya' },
      { label: 'Ръководства', url: '/rakovodstvo-portativni-elektrocentrali' },
      { label: 'Често задавани въпроси', url: FAQ_PATH },
      { label: 'Контакти', url: CONTACT_PATH },
    ],
  },
  {
    heading: 'Фирма',
    links: [
      { label: 'За EcoFlow', url: '/za-ecoflow' },
      { label: 'За ДИ СИ 2008', url: '/za-di-si-2008' },
      { label: 'За бизнеса', url: '/oferta-za-firmi' },
    ],
  },
  {
    heading: 'Правна информация',
    links: [
      { label: 'Общи условия', url: '/obshti-usloviya' },
      { label: 'Поверителност', url: '/poveritelnost' },
      { label: 'Бисквитки', url: '/biskvitki' },
    ],
  },
]
