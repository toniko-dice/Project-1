import type { GlobalConfig } from 'payload'

import { revalidateGlobal } from '../lib/revalidate'
import { hiddenFor, isEditor, publicRead } from '../lib/access'

const ЛИНК = 'Линк в текста: [текст](/adres), напр. [Пишете ни](/kontakti).'

/**
 * „Въпроси и Контакти" (`task-futar.md`) — текстовете на `/vaprosi` и
 * `/kontakti`. Самите страници са код (route), не записи в „Страници":
 * въпросите се събират от продуктите и страниците, а формата е компонент.
 * Тук са само заглавието, уводът и мета данните.
 */
export const InfoPages: GlobalConfig = {
  slug: 'info-pages',
  label: 'Въпроси и Контакти',
  admin: { hidden: hiddenFor('admin', 'editor'), group: 'Настройки' },
  access: { read: publicRead, update: isEditor },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Често задавани въпроси',
          description:
            'Страницата /vaprosi събира сама въпросите от блоковете „Въпроси и отговори" на продуктите и страниците — по серии, без повторенията.',
          fields: [
            { name: 'faqTitle', type: 'text', label: 'Заглавие (H1)', defaultValue: 'Често задавани въпроси' },
            {
              name: 'faqIntro',
              type: 'textarea',
              label: 'Увод',
              defaultValue:
                'Отговори на най-честите въпроси за продуктите EcoFlow. Не намирате отговор? [Пишете ни](/kontakti).',
              admin: { description: ЛИНК },
            },
            {
              name: 'faqMetaTitle',
              type: 'text',
              label: 'Мета заглавие',
              defaultValue: 'Често задавани въпроси за EcoFlow | EcoFlow България',
            },
            {
              name: 'faqMetaDescription',
              type: 'textarea',
              label: 'Мета описание',
              defaultValue:
                'Отговори на въпросите за портативните електроцентрали, соларните панели и домашните системи EcoFlow — зареждане, капацитет, гаранция и употреба.',
            },
          ],
        },
        {
          label: 'Контакти',
          fields: [
            { name: 'contactTitle', type: 'text', label: 'Заглавие (H1)', defaultValue: 'Контакти' },
            {
              name: 'contactIntro',
              type: 'textarea',
              label: 'Увод',
              defaultValue: 'Имате въпрос за продукт, гаранция или поръчка? Пишете ни и ще ви отговорим.',
              admin: { description: ЛИНК },
            },
            {
              name: 'contactSuccess',
              type: 'textarea',
              label: 'Текст след изпращане',
              defaultValue: 'Благодарим! Съобщението ви е изпратено. Ще ви отговорим на {имейл} възможно най-скоро.',
              admin: { description: '{имейл} се заменя с имейла от формата. Без конкретен срок.' },
            },
            { name: 'contactMetaTitle', type: 'text', label: 'Мета заглавие', defaultValue: 'Контакти | EcoFlow България' },
            {
              name: 'contactMetaDescription',
              type: 'textarea',
              label: 'Мета описание',
              defaultValue:
                'Свържете се с ДИ СИ 2008 — официалния представител на EcoFlow за България. Форма за контакт, имейл, адреси и работно време на магазините.',
            },
          ],
        },
      ],
    },
  ],
}
