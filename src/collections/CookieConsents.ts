import type { CollectionConfig } from 'payload'

import { hiddenFor, isAdmin } from '../lib/access'
import { validConsentPayload } from '../lib/consent'

/**
 * Доказателство за съгласието за бисквитки (GDPR чл. 7(1),
 * `task-banner-biskvitki.md`, т. 5): при всеки избор в банера — анонимен
 * запис: номерът на съгласието (случаен, от бисквитката `ecoflow_consent`),
 * кога, версията на политиката и изборът. БЕЗ IP и без лични данни —
 * номерът не води до човек, само съвпада с бисквитката в неговия браузър.
 *
 * Пише само `POST /api/cookie-consents/record` (с правата на сървъра);
 * в админа — само четене, само за Администратор. Пази се 12 месеца: всеки
 * нов запис трие по-старите.
 */
const ПАЗИ_МЕСЕЦА = 12

/*
  Ограничение на честотата — в паметта, по IP, който НЕ се записва никъде.
  30 избора на час от един адрес стигат с много за човек.
*/
const LIMIT = 30
const WINDOW_MS = 60 * 60 * 1000
const hits = new Map<string, number[]>()
const твърдеЧесто = (ip: string) => {
  const now = Date.now()
  const скорошни = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  скорошни.push(now)
  hits.set(ip, скорошни)
  if (hits.size > 5000) for (const [k, t] of hits) if (t.every((x) => now - x >= WINDOW_MS)) hits.delete(k)
  return скорошни.length > LIMIT
}

const ДЕЙСТВИЯ = [
  { label: 'Приемам всички', value: 'accept-all' },
  { label: 'Отказвам всички', value: 'reject-all' },
  { label: 'Собствен избор', value: 'custom' },
]

export const CookieConsents: CollectionConfig = {
  slug: 'cookie-consents',
  labels: { singular: 'Съгласие за бисквитки', plural: 'Съгласия за бисквитки' },
  admin: {
    group: 'Правни',
    hidden: hiddenFor('admin'),
    useAsTitle: 'consentId',
    defaultColumns: ['createdAt', 'action', 'analytics', 'marketing', 'version', 'consentId'],
    description:
      'Доказателство за избора в банера за бисквитки — без IP и без лични данни. Само за четене; по-старите от 12 месеца се трият сами.',
  },
  defaultSort: '-createdAt',
  access: { read: isAdmin, create: () => false, update: () => false, delete: () => false },
  endpoints: [
    {
      path: '/record',
      method: 'post',
      handler: async (req) => {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '?'
        if (твърдеЧесто(ip)) return Response.json({ ok: false }, { status: 429 })
        const body = await req.json?.().catch(() => null)
        if (!validConsentPayload(body)) return Response.json({ ok: false }, { status: 400 })
        await req.payload.create({
          collection: 'cookie-consents',
          overrideAccess: true,
          depth: 0,
          data: {
            consentId: body.id,
            version: body.v,
            action: body.action,
            analytics: body.choices.analytics,
            marketing: body.choices.marketing,
          },
        })
        const праг = new Date()
        праг.setMonth(праг.getMonth() - ПАЗИ_МЕСЕЦА)
        await req.payload.delete({
          collection: 'cookie-consents',
          overrideAccess: true,
          where: { createdAt: { less_than: праг.toISOString() } },
        })
        return Response.json({ ok: true })
      },
    },
  ],
  fields: [
    { name: 'consentId', type: 'text', label: 'Номер на съгласието', required: true, index: true, admin: { readOnly: true } },
    { name: 'version', type: 'number', label: 'Версия на политиката', required: true, admin: { readOnly: true } },
    { name: 'action', type: 'select', label: 'Действие', options: ДЕЙСТВИЯ, required: true, admin: { readOnly: true } },
    { name: 'analytics', type: 'checkbox', label: 'Аналитични', defaultValue: false, admin: { readOnly: true } },
    { name: 'marketing', type: 'checkbox', label: 'Маркетинг', defaultValue: false, admin: { readOnly: true } },
  ],
}
