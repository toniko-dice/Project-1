import type { Block } from 'payload'

import { blockLabel, rowLabel } from './product/shared'
import { requiredUnlessHidden } from './shared'

/** Дните — стойността е името в Schema.org (`dayOfWeek`). */
export const ДНИ = [
  { label: 'Понеделник', value: 'Monday' },
  { label: 'Вторник', value: 'Tuesday' },
  { label: 'Сряда', value: 'Wednesday' },
  { label: 'Четвъртък', value: 'Thursday' },
  { label: 'Петък', value: 'Friday' },
  { label: 'Събота', value: 'Saturday' },
  { label: 'Неделя', value: 'Sunday' },
] as const

const ЧАС = /^([01]\d|2[0-3]):[0-5]\d$/
const час = (value: unknown, { siblingData }: { siblingData?: unknown }) =>
  (siblingData as { closed?: boolean } | undefined)?.closed || !value || ЧАС.test(String(value))
    ? true
    : 'Във вида 10:00.'

/**
 * „Магазини" (`task-stranica-za-di-si-2008.md`) — карти с име, адрес и
 * работно време; на компютър една до друга, на телефон една под друга.
 * Адресът е линк към Google Maps (сглобен от адреса или ръчен).
 *
 * Работното време е по дни, не свободен текст: от него се сглобяват и
 * редовете („Понеделник – петък: 10:00 – 19:00"), и `openingHoursSpecification`
 * на `Store` в данните за търсачките — едно въвеждане, без разминаване.
 *
 * Дните са „От ден" – „До ден", НЕ избор „много". Payload 3.88 не записва
 * поле „много избора" в масив в масив във версиите: подава текстовите
 * номера на редовете към целочислената колона и версията остава без
 * дните (8 октомври 2026, първият внос на „За ДИ СИ 2008").
 */
export const Stores: Block = {
  slug: 'stores',
  labels: { singular: 'Магазини', plural: 'Магазини' },
  admin: blockLabel('heading'),
  fields: [
    { name: 'heading', type: 'text', label: 'Заглавие (H2)' },
    {
      name: 'stores',
      type: 'array',
      label: 'Магазини',
      labels: { singular: 'Магазин', plural: 'Магазини' },
      validate: requiredUnlessHidden,
      admin: rowLabel('name', 'Магазин'),
      fields: [
        { name: 'name', type: 'text', required: true, label: 'Име' },
        {
          type: 'row',
          fields: [
            { name: 'street', type: 'text', required: true, label: 'Адрес', admin: { width: '60%', description: 'Без града: „кв. Младост 4, бл. 426А".' } },
            { name: 'city', type: 'text', required: true, label: 'Град', admin: { width: '40%' } },
          ],
        },
        {
          name: 'mapUrl',
          type: 'text',
          label: 'Линк към картата',
          admin: { description: 'По желание. Празно — търсене в Google Maps по името и адреса.' },
        },
        { name: 'phone', type: 'text', label: 'Телефон', admin: { description: 'Не се показва на сайта.' } },
        {
          name: 'hours',
          type: 'array',
          label: 'Работно време',
          labels: { singular: 'Ред', plural: 'Редове' },
          admin: {
            description: 'Ред за всеки период с еднакво време („Понеделник" – „Петък"). Ден без ред не се показва.',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'fromDay',
                  type: 'select',
                  required: true,
                  label: 'От ден',
                  options: ДНИ.map((d) => ({ label: d.label, value: d.value })),
                  admin: { width: '50%' },
                },
                {
                  name: 'toDay',
                  type: 'select',
                  label: 'До ден',
                  options: ДНИ.map((d) => ({ label: d.label, value: d.value })),
                  admin: { width: '50%', description: 'Празно — само един ден.' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'opens', type: 'text', label: 'От', validate: час, admin: { width: '30%', placeholder: '10:00' } },
                { name: 'closes', type: 'text', label: 'До', validate: час, admin: { width: '30%', placeholder: '19:00' } },
                { name: 'closed', type: 'checkbox', label: 'Почивен ден', admin: { width: '40%' } },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'note',
      type: 'richText',
      label: 'Текст под картите',
      admin: { description: 'По желание — напр. „Онлайн — на dice.bg".' },
    },
  ],
}
