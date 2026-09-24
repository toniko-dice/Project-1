import type { CollectionConfig } from 'payload'
import { cleanSlug } from '../lib/slug'
import { productBlocks } from '../blocks/product'
import { expireEverything, revalidateProduct, revalidateProductDelete } from '../lib/revalidate'

export const Products: CollectionConfig = {
  slug: 'products',
  // Записите се подреждат с влачене в списъчния изглед.
  orderable: true,
  // Списъкът се отваря в подредбата, зададена с влаченето.
  defaultSort: '_order',
  labels: { singular: 'Продукт', plural: 'Продукти' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'categoryName', 'productType', 'price', 'badge'],
    group: 'Каталог',
    description:
      'Продуктовата страница се сглобява от секции, също като обикновените страници. Продукт без добавени секции показва галерия, цена, бутон и описание.',
  },
  access: { read: () => true },
  /*
    Какво носи продуктът, когато е ВРЪЗКА в друг документ — карта в
    карусел, колона в сравнителна таблица, свързан продукт.

    Само полетата за карта. Не е пестене — е защита от увисване. Сравнителната
    таблица на продукта сочи самия продукт (моделът се сравнява с братята
    си). Без това ограничение попълването на връзките при `depth: 2` зарежда
    продукта вътре в собствения му запис; зареждачът на Payload връща
    същото чакащо обещание и то чака само себе си — четенето (и записът)
    никога не завършва, без грешка. Проверено: `find` с depth 2 виси,
    с този списък минава за милисекунди.

    Всичко, което картите четат от свързан продукт, е тук. Нова карта,
    която иска друго поле, го добавя тук, не вдига дълбочината.
  */
  defaultPopulate: {
    title: true,
    slug: true,
    // Виртуалните полета за адреса — без тях свързаният продукт няма адрес.
    categorySlug: true,
    categoryParentSlug: true,
    categoryGrandparentSlug: true,
    image: true,
    tagline: true,
    price: true,
    compareAtPrice: true,
    badge: true,
    availability: true,
    rating: true,
    reviewCount: true,
    externalUrl: true,
    ctaLabel: true,
    _status: true,
  },
  /*
    Чернови. Внесеният продукт не бива да излиза наживо, преди собственикът
    да го е прегледал — при внасяне на 45 продукта наведнъж това е разликата
    между спокойна проверка и 45 недовършени страници пред клиентите.

    Последствие: продукт се вижда на сайта чак след „Публикувай".
  */
  versions: { drafts: true },
  hooks: {
    afterChange: [revalidateProduct],
    afterDelete: [revalidateProductDelete],
  },
  endpoints: [
    {
      /*
        Опресняване на кеша по заявка — за вноса.

        `import:product` пише през локалното API извън Next и не може да
        изчисти кеша на работещия сървър (виж CLAUDE.md, т. 14). Когато
        публикува направо, скриптът вика този път и сървърът изчиства
        всичко сам — сайтът показва новото веднага, без рестарт.

        Достъп: влязъл потребител или ключът на инсталацията в заглавие
        `x-revalidate-key` — скриптът върви на същата машина със същия
        `.env`. Без нито едното: 403.
      */
      path: '/revalidate',
      method: 'post',
      handler: (req) => {
        const key = req.headers.get('x-revalidate-key')
        const allowed = Boolean(req.user) || (Boolean(key) && key === process.env.PAYLOAD_SECRET)
        if (!allowed) return Response.json({ error: 'Няма достъп.' }, { status: 403 })
        expireEverything()
        return Response.json({ ok: true })
      },
    },
  ],
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Основни',
          fields: [
            { name: 'title', type: 'text', required: true, label: 'Име на продукта' },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              label: 'URL адрес',
              admin: {
                description:
                  'Само малки латински букви, цифри и тирета. Кирилицата се транслитерира, интервалите стават тирета, представки като „products/" се махат. Не е нужно да пишете пътя — само името.',
              },
              hooks: {
                beforeValidate: [
                  ({ value }) => (typeof value === 'string' ? cleanSlug(value) : value),
                ],
              },
            },
            {
              name: 'sku',
              type: 'text',
              label: 'Каталожен номер (SKU)',
              admin: {
                description:
                  'Номерът на артикула в dice.bg. Служи за сверяване при внос и за търсачките.',
              },
            },
            {
              name: 'brand',
              type: 'text',
              label: 'Марка',
              defaultValue: 'EcoFlow',
              admin: {
                description:
                  'Обикновено EcoFlow. Сменя се при аксесоари на друг производител — в каталога има артикули на Anker, VEMARK, 4smarts и други.',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'ean',
                  type: 'text',
                  label: 'Баркод EAN',
                  admin: {
                    width: '33%',
                    description:
                      'Основният баркод на производителя, 13 цифри. Влиза в данните за търсачките и позволява на Google да разпознае продукта еднозначно.',
                  },
                },
                {
                  /*
                    Комплект от две устройства идва от dice.bg с два баркода —
                    RIVER 3 Max Plus (Wireless) е станция плюс батерия RAPID.

                    В данните за търсачките влиза само първият: `gtin` описва
                    един артикул и два номера там объркват Google повече,
                    отколкото помагат. Вторият служи за сверяване с магазина.

                    Името е „EAN", за да не се бърка с „Втори баркод
                    (вътрешен)" до него — той е складов номер, не EAN.
                  */
                  name: 'ean2',
                  type: 'text',
                  label: 'Втори баркод EAN',
                  admin: {
                    width: '33%',
                    description: 'За комплекти с две устройства. По избор.',
                  },
                },
                {
                  name: 'barcodeInternal',
                  type: 'text',
                  label: 'Втори баркод (вътрешен)',
                  admin: {
                    width: '34%',
                    description:
                      'Складов или доставчиков номер. Служи за сверяване при внос и не се показва никъде на сайта.',
                  },
                },
              ],
            },
            {
              name: 'category',
              type: 'relationship',
              relationTo: 'categories',
              required: true,
              label: 'Категория',
              admin: { disableListColumn: true },
            },
            {
              /*
                Списъчният изглед на Payload подава само номера на връзката към
                клетката, затова колоната „Категория“ показваше „‹Няма Категория›“.
                Това поле не се записва в базата — сглобява се при всяко четене,
                така че никога не остарява при преименуване на категория.
              */
              name: 'categoryName',
              type: 'text',
              virtual: 'category.title',
              label: 'Категория',
              admin: {
                readOnly: true,
                description: 'Попълва се само — взима се от избраната по-горе категория.',
              },
            },
            /*
              Адресът на продукта е `/kategorii/<серия>/<slug>`, а серията е
              категорията от ВТОРО ниво над него. За да се знае на кое ниво
              е категорията, трябват родителят и родителят на родителя.

              Тези три полета са ВИРТУАЛНИ — не се пазят в базата, Payload
              ги сглобява при четене от самите категории. Така адресът е
              верен при всяка дълбочина на четенето (карта в меню с depth 1,
              списък с depth 2) и не остарява при преименуване. Истински
              колони щяха да се разминат при първото местене на категория.
            */
            {
              name: 'categorySlug',
              type: 'text',
              virtual: 'category.slug',
              admin: { hidden: true },
            },
            {
              name: 'categoryParentSlug',
              type: 'text',
              virtual: 'category.parent.slug',
              admin: { hidden: true },
            },
            {
              name: 'categoryGrandparentSlug',
              type: 'text',
              virtual: 'category.parent.parent.slug',
              admin: { hidden: true },
            },
            {
              name: 'tagline',
              type: 'text',
              label: 'Кратка спецификация',
              admin: {
                description:
                  'Редът под името в продуктовата карта. Напр. "6144Wh капацитет / 7200W изход".',
              },
            },
            {
              /*
                Оценка и брой отзиви.

                Показват се в продуктовата карта САМО ако и двете са
                попълнени. Празни полета не рисуват празни звезди — липсата
                на отзиви не бива да изглежда като лоша оценка.

                Данните са реални отзиви на клиенти на фирмата. Отзивите на
                eu.ecoflow.com са техни и не се преписват.
              */
              type: 'row',
              fields: [
                {
                  name: 'rating',
                  type: 'number',
                  label: 'Оценка',
                  min: 0,
                  max: 5,
                  admin: {
                    width: '50%',
                    step: 0.5,
                    description: 'От 0 до 5, през 0,5. Празно = не се показва.',
                  },
                },
                {
                  name: 'reviewCount',
                  type: 'number',
                  label: 'Брой отзиви',
                  min: 0,
                  admin: {
                    width: '50%',
                    description: 'Попълва се само при реални отзиви за този продукт.',
                  },
                },
              ],
            },
            {
              /*
                Акцентите стоят в кутията за покупка, не в секциите на
                страницата — виждат се без скролване. Затова са поле на
                продукта, а не блок.
              */
              name: 'highlights',
              type: 'array',
              label: 'Акценти под цената',
              labels: { singular: 'Акцент', plural: 'Акценти' },
              // EcoFlow слагат до шест точки (DELTA 3 Max Plus); осем оставя място.
              maxRows: 8,
              admin: {
                description:
                  'Кратките изречения в кутията за покупка, под цената. Три до шест са достатъчни — това е първото, което клиентът чете.',
                components: {
                  RowLabel: {
                    path: '@/components/admin/RowLabel#RowLabel',
                    clientProps: { field: 'title', fallback: 'Акцент' },
                  },
                },
              },
              fields: [
                { name: 'title', type: 'text', required: true, label: 'Заглавие' },
                {
                  name: 'text',
                  type: 'textarea',
                  label: 'Пояснение',
                  // По избор: на EcoFlow има точки само със заглавие („5-годишна гаранция").
                  admin: { description: 'По избор. Празно — акцентът е само заглавието, на един ред.' },
                },
              ],
            },
            {
              name: 'badge',
              type: 'select',
              label: 'Етикет',
              options: [
                { label: '— без етикет —', value: 'none' },
                { label: 'НОВО', value: 'new' },
                { label: 'ПРОМОЦИЯ', value: 'sale' },
                { label: 'БЕСТСЕЛЪР', value: 'bestseller' },
                { label: 'ОГРАНИЧЕНА НАЛИЧНОСТ', value: 'limited' },
              ],
              defaultValue: 'none',
            },
            {
              name: 'productType',
              type: 'select',
              label: 'Вид на продукта',
              defaultValue: 'accessory',
              options: [
                { label: 'Основен продукт', value: 'hero' },
                { label: 'Аксесоар', value: 'accessory' },
              ],
              admin: {
                description:
                  'Служи само за подреждане и филтриране на списъка тук. Не влияе на изгледа на страницата — той зависи единствено от добавените секции.',
              },
            },
          ],
        },
        {
          label: 'Цена и покупка',
          fields: [
            {
              name: 'price',
              type: 'number',
              required: true,
              label: 'Цена (EUR)',
              admin: {
                description:
                  'Цената в евро. Левовата равностойност се изчислява автоматично по фиксирания курс 1.95583.',
              },
            },
            {
              name: 'compareAtPrice',
              type: 'number',
              label: 'Стара цена (EUR)',
              admin: {
                description: 'Ако е попълнена, се показва зачертана до текущата цена.',
              },
            },
            {
              name: 'externalUrl',
              type: 'text',
              required: true,
              label: 'Линк към магазина',
              admin: {
                description:
                  'Пълен адрес към продуктовата страница във външния магазин, където се извършва покупката.',
              },
            },
            {
              name: 'ctaLabel',
              type: 'text',
              defaultValue: 'Купи сега',
              label: 'Текст на бутона',
            },
            {
              name: 'availability',
              type: 'select',
              label: 'Наличност',
              defaultValue: 'in-stock',
              options: [
                { label: 'В наличност', value: 'in-stock' },
                { label: 'По заявка', value: 'preorder' },
                { label: 'Изчерпан', value: 'out-of-stock' },
              ],
            },
          ],
        },
        {
          label: 'Изображения',
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              required: true,
              label: 'Основна снимка',
            },
            {
              name: 'gallery',
              type: 'array',
              label: 'Галерия',
              admin: {
                components: {
                  RowLabel: {
                    path: '@/components/admin/RowLabel#RowLabel',
                    clientProps: { fallback: 'Снимка' },
                  },
                },
              },
              fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
            },
          ],
        },
        {
          label: 'Съвместимост',
          description:
            'За аксесоари. Оттук се пълнят сами разделът „Аксесоари" на страницата на серията, „Свързани продукти" на модела и секцията „Аксесоари" в панела на менюто.',
          fields: [
            {
              /*
                Аксесоарът стои в СВОЯТА категория (Кабели, Адаптери) и има
                един адрес. За кои станции е — казва това поле, не отделна
                подкатегория „Аксесоари за DELTA". Иначе един кабел, който
                пасва на три серии, трябва да е на три места.
              */
              name: 'compatibleWith',
              type: 'relationship',
              relationTo: ['categories', 'products'],
              hasMany: true,
              label: 'Съвместим с',
              admin: {
                description:
                  'Избери серии или конкретни модели, с които работи. Показва се на страницата на серията и в „Свързани продукти" на модела.',
              },
            },
          ],
        },
        {
          label: 'Спецификации',
          fields: [
            {
              name: 'specGroups',
              type: 'array',
              label: 'Спецификации по групи',
              labels: { singular: 'Група', plural: 'Групи' },
              admin: {
                description:
                  'Оригиналът показва спецификациите като плосък списък. Групите са наша добавка — при 30+ реда плоският списък е нечетим. Заглавието на групата е по избор: оставите ли го празно, редовете се сливат с предишната група.',
                components: {
                  RowLabel: {
                    path: '@/components/admin/RowLabel#RowLabel',
                    clientProps: { field: 'groupLabel', fallback: 'Група' },
                  },
                },
              },
              fields: [
                {
                  name: 'groupLabel',
                  type: 'text',
                  label: 'Заглавие на групата',
                  admin: { description: 'Напр. Изход променлив ток. Може да остане празно.' },
                },
                {
                  name: 'rows',
                  type: 'array',
                  label: 'Редове',
                  labels: { singular: 'Ред', plural: 'Редове' },
                  admin: {
                    components: {
                      RowLabel: {
                        path: '@/components/admin/RowLabel#RowLabel',
                        clientProps: { field: 'label', fallback: 'Ред' },
                      },
                    },
                  },
                  fields: [
                    { name: 'label', type: 'text', required: true, label: 'Показател' },
                    { name: 'value', type: 'text', required: true, label: 'Стойност' },
                  ],
                },
              ],
            },
            {
              /*
                Старото плоско поле. Съдържанието му е пренесено в „Спецификации
                по групи" с миграция. Стои временно, за да може пренасянето да
                бъде проверено; пада с отделна миграция след потвърждение.
              */
              name: 'specs',
              type: 'array',
              label: 'Технически данни (остаряло)',
              labels: { singular: 'Ред', plural: 'Редове' },
              admin: {
                description:
                  'Не въвеждайте тук. Полето е пренесено в „Спецификации по групи" и предстои да бъде премахнато.',
                initCollapsed: true,
                components: {
                  RowLabel: {
                    path: '@/components/admin/RowLabel#RowLabel',
                    clientProps: { field: 'label', fallback: 'Ред' },
                  },
                },
              },
              fields: [
                { name: 'label', type: 'text', required: true, label: 'Показател' },
                { name: 'value', type: 'text', required: true, label: 'Стойност' },
              ],
            },
            { name: 'description', type: 'textarea', label: 'Пълно описание' },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'metaTitle',
              type: 'text',
              label: 'Заглавие за търсачки',
              admin: { description: 'Ако е празно, се ползва името на продукта.' },
            },
            {
              name: 'metaDescription',
              type: 'textarea',
              label: 'Описание за търсачки',
              admin: { description: 'Ако е празно, се ползва кратката спецификация.' },
            },
          ],
        },
        {
          label: 'Секции на страницата',
          description:
            'Всяка секция се добавя, мести с дръжката вляво и трие поотделно. Продукт без секции показва галерия, цена, бутон и описание.',
          fields: [
            {
              name: 'sections',
              type: 'blocks',
              label: 'Секции на страницата',
              labels: { singular: 'Секция', plural: 'Секции' },
              blocks: productBlocks,
            },
          ],
        },
      ],
    },
  ],
}
