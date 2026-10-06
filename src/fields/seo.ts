import type { Field } from 'payload'

import { DESCRIPTION_LIMIT, TITLE_LIMIT, TITLE_SUFFIX } from '../lib/title'

/**
 * Броячът на знаци под мета полето (`CharCounter`) — `ui` поле, което
 * се слага ВЕДНАГА след броеното. Не пише нищо в базата.
 */
const брояч = (name: string, target: string, limit: number, title: boolean, note?: string): Field => ({
  name,
  type: 'ui',
  admin: {
    components: {
      Field: {
        path: '@/components/admin/CharCounter#CharCounter',
        clientProps: { target, limit, title, note },
      },
    },
  },
})

export const metaTitleCounter = (target = 'metaTitle'): Field =>
  брояч(
    `${target}Counter`,
    target,
    TITLE_LIMIT,
    true,
    `До ${TITLE_LIMIT} знака заедно с „${TITLE_SUFFIX.trim().replace(/^—\s*/, ' — ')}"; над това наставката отпада.`,
  )

export const metaDescriptionCounter = (target = 'metaDescription'): Field =>
  брояч(`${target}Counter`, target, DESCRIPTION_LIMIT, false)
