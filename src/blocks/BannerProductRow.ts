import type { Block } from 'payload'
import { eyebrowColorField, linkField, requiredUnlessHidden, themeField } from './shared'

/**
 * Основният повтарящ се модел от референтния дизайн:
 * заглавие на секцията, голям банер с един акцентен продукт,
 * и под него ред с продуктови карти + плочка "Виж още".
 *
 * В референтния сайт този модел се среща пет пъти
 * (Домашно захранване, Захранване на открито, Домашна батерия,
 * Външни батерии, Аксесоари).
 */
export const BannerProductRow: Block = {
  slug: 'bannerProductRow',
  labels: { singular: 'Банер + продукти', plural: 'Банери + продукти' },
  imageAltText: 'Секция с голям банер и ред продукти под него',
  fields: [
    {
      name: 'sectionTitle',
      type: 'text',
      validate: requiredUnlessHidden,
      label: 'Заглавие на секцията',
      admin: { description: 'Напр. "Домашно резервно захранване".' },
    },
    {
      name: 'showBanner',
      type: 'checkbox',
      label: 'Показване на банера',
      defaultValue: true,
    },
    {
      name: 'banner',
      type: 'group',
      label: 'Банер',
      admin: { condition: (_, siblingData) => Boolean(siblingData?.showBanner) },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'eyebrow', type: 'text', label: 'Надзаглавие', admin: { width: '60%' } },
            { ...eyebrowColorField, admin: { width: '40%' } },
          ],
        },
        { name: 'heading', type: 'text', label: 'Заглавие' },
        { name: 'subheading', type: 'text', label: 'Подзаглавие' },
        /*
          Цената на банера от продукта, не на ръка: „от 1 549 €" стоеше на
          банера на DELTA 3 Max, а продуктът беше 1 149 € (7 октомври 2026).
          Ръчният текст остава за неща, които не са цена на един продукт
          („спестявате до 1 200 €") — и се скрива, щом е избран продукт.
        */
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          label: 'Цена от продукт',
          admin: {
            description:
              'Избран — под подзаглавието излиза текущата цена на продукта (и старата, ако има). Чернова не дава цена.',
          },
        },
        {
          name: 'priceNote',
          type: 'text',
          label: 'Ценови текст',
          admin: {
            description: 'Напр. "спестявате до 1 200 €". За цена на продукт ползвайте „Цена от продукт".',
            condition: (_, siblingData) => !siblingData?.product,
          },
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Изображение',
          admin: {
            description:
              'Препоръчително 2400×800px. Остава задължително и при видео — показва се, докато то се зареди.',
          },
        },
        {
          name: 'video',
          type: 'upload',
          relationTo: 'media',
          label: 'Видео вместо снимка',
          admin: {
            description:
              'По избор. MP4 (H.264), 1920px широчина, без звук, до 20 MB. Върти се само, без бутони. При включена системна настройка за намалено движение се показва снимката.',
          },
        },
        linkField(),
        themeField,
      ],
    },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      label: 'Продукти в реда',
      admin: {
        description:
          'Подредбата тук определя реда на екрана. Препоръчително 4–5 броя — на широк екран се показват пет колони.',
      },
    },
    {
      name: 'showMoreTile',
      type: 'checkbox',
      label: 'Показвай плочката в края на реда',
      defaultValue: true,
    },
    {
      name: 'moreTile',
      type: 'group',
      label: 'Плочка в края на реда',
      admin: { condition: (_, siblingData) => Boolean(siblingData?.showMoreTile) },
      fields: [
        /*
          Бяла карта с размера на продуктовите до нея: заглавие горе вляво,
          кръгла стрелка горе вдясно, снимка отдолу; цялата карта е линк.

          По желание под нея — втора, ниска карта само с текст и стрелка
          (в оригинала: „Аксесоари"). Полетата с наставка „secondary" са за
          нея. Ако и двете са празни, колоната изобщо не се показва.

          `task-stranica-portativni-elektrocentrali.md` искаше нова група
          „Плочка в края на реда" — но тази е същата плочка; втора група
          със същото значение би се разминала с първата. Стойностите по
          подразбиране остават общи („Виж всички"), защото блокът стои и
          под други серии.
        */
        {
          name: 'label',
          type: 'text',
          defaultValue: 'Виж всички',
          label: 'Заглавие',
          admin: { description: 'Напр. „Вижте всички електроцентрали »".' },
        },
        {
          name: 'url',
          type: 'text',
          label: 'Линк',
          admin: { description: 'Напр. /rakovodstvo-portativni-elektrocentrali. Без линк плочката не се показва.' },
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Снимка',
          admin: { description: 'Групова снимка на продуктите — стои в долната част на картата.' },
        },
        { name: 'description', type: 'text', label: 'Текст под заглавието (по желание)' },
        { name: 'secondaryLabel', type: 'text', label: 'Втора карта отдолу — текст' },
        { name: 'secondaryUrl', type: 'text', label: 'Втора карта отдолу — адрес' },
      ],
    },
  ],
}
