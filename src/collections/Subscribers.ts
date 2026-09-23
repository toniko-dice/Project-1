import type { CollectionConfig } from 'payload'

/**
 * Абонати за бюлетина.
 *
 * ДОСТЪПЪТ Е ЗАТВОРЕН И ЗА СЪЗДАВАНЕ.
 *
 * Формата на сайта НЕ пише директно тук. Публично `create` би позволило на
 * всеки да пълни списъка през `/api/subscribers` — без проверка на имейла,
 * без ограничение на честотата и без възможност да се скрие дали даден
 * адрес вече съществува. Записът минава през `POST /api/subscribers/subscribe`
 * по-долу, който прави проверките и пише с правата на сървъра.
 *
 * Затова тук всичко е само за влезли администратори.
 */
const SUCCESS = 'Благодарим! Ще получите потвърждение.'

/** Проста проверка на формата на адреса. Истинската проверка е потвърждаващият имейл. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i

/*
  Ограничение на честотата — до 5 заявки в минута от един адрес.

  Държи се в паметта на процеса. Това стига за един Node сървър, какъвто е
  този: при рестарт броячът се нулира и при няколко машини всяка брои
  отделно. Ако сайтът тръгне на повече от една машина, това място трябва да
  мине през обща памет.
*/
const LIMIT = 5
const WINDOW_MS = 60_000
const hits = new Map<string, number[]>()

const clientIp = (headers: Headers): string =>
  headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  headers.get('x-real-ip') ||
  'неизвестен'

const tooManyFrom = (ip: string): boolean => {
  const now = Date.now()
  const скорошни = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  скорошни.push(now)
  hits.set(ip, скорошни)

  // Картата не бива да расте безкрайно при дълго работещ сървър.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key)
    }
  }

  return скорошни.length > LIMIT
}

export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  labels: { singular: 'Абонат', plural: 'Абонати' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'subscribedAt', 'status', 'source'],
    group: 'Маркетинг',
    description:
      'Хората, абонирани за бюлетина през формата на сайта. Бутонът „Изтегли CSV" е над списъка.',
    components: {
      beforeListTable: ['@/components/admin/ExportSubscribersButton#ExportSubscribersButton'],
    },
  },
  // Най-новите отгоре.
  defaultSort: '-subscribedAt',
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
      label: 'Имейл',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'subscribedAt',
          type: 'date',
          label: 'Дата на абониране',
          admin: {
            width: '50%',
            readOnly: true,
            date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' },
          },
        },
        {
          name: 'status',
          type: 'select',
          label: 'Статус',
          defaultValue: 'active',
          admin: { width: '50%' },
          options: [
            { label: 'Активен', value: 'active' },
            { label: 'Отписан', value: 'unsubscribed' },
          ],
        },
      ],
    },
    {
      name: 'source',
      type: 'text',
      label: 'Източник',
      admin: {
        readOnly: true,
        description: 'Страницата, от която е дошъл абонатът.',
      },
    },
    {
      name: 'consent',
      type: 'checkbox',
      label: 'Дал е съгласие',
      defaultValue: false,
      admin: {
        description:
          'Изисква се от ЗЗЛД. Записва се какво е отметнал абонатът в момента на абонирането — не се пипа после.',
      },
    },
    { name: 'note', type: 'textarea', label: 'Бележка' },
  ],
  endpoints: [
    {
      /*
        Публичното абониране.

        Пътят е тук, а не в `app/api`, защото Payload вече държи целия
        `/api/*` през catch-all — както при „Архиви". Записът минава през
        локалното API, което по подразбиране заобикаля правата за достъп,
        затова `create` на колекцията може да остане затворен.
      */
      path: '/subscribe',
      method: 'post',
      handler: async (req) => {
        let body: { email?: string; consent?: boolean; source?: string; company?: string } = {}
        try {
          body = req.json ? ((await req.json()) as typeof body) : {}
        } catch {
          return Response.json({ error: 'Неправилна заявка.' }, { status: 400 })
        }

        /*
          Скритото поле „company" е капан за роботи. Хората не го виждат и
          не го попълват; ботовете попълват всичко. Отговорът е успех — ако
          кажем „отказано", авторът на бота ще го поправи.
        */
        if (body.company) {
          return Response.json({ ok: true, message: SUCCESS })
        }

        const email = (body.email ?? '').trim().toLowerCase()
        if (!EMAIL.test(email) || email.length > 254) {
          return Response.json({ error: 'Проверете имейл адреса.' }, { status: 400 })
        }

        if (!body.consent) {
          return Response.json(
            { error: 'Нужно е съгласие, за да ви запишем.' },
            { status: 400 },
          )
        }

        if (tooManyFrom(clientIp(req.headers))) {
          return Response.json(
            { error: 'Твърде много опити. Опитайте отново след минута.' },
            { status: 429 },
          )
        }

        try {
          const съществуващ = await req.payload.find({
            collection: 'subscribers',
            where: { email: { equals: email } },
            limit: 1,
            depth: 0,
          })

          /*
            Вече записан имейл НЕ дава грешка.

            „Този адрес вече е абониран" издава на всеки, който го напише,
            дали даден човек е в списъка. Отговорът е един и същ и в двата
            случая; просто не се създава втори запис.
          */
          if (!съществуващ.docs.length) {
            await req.payload.create({
              collection: 'subscribers',
              data: {
                email,
                consent: true,
                status: 'active',
                source: typeof body.source === 'string' ? body.source.slice(0, 200) : undefined,
              },
            })
          }

          return Response.json({ ok: true, message: SUCCESS })
        } catch (err) {
          req.payload.logger.error(`Абонирането се провали: ${(err as Error).message}`)
          return Response.json({ error: 'Нещо се обърка. Опитайте по-късно.' }, { status: 500 })
        }
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // Датата се попълва веднъж, при създаването.
        if (operation === 'create' && !data.subscribedAt) {
          data.subscribedAt = new Date().toISOString()
        }
        // Имейлите се пазят с малки букви — иначе „Ivan@" и „ivan@" са два записа.
        if (typeof data.email === 'string') {
          data.email = data.email.trim().toLowerCase()
        }
        return data
      },
    ],
  },
}
