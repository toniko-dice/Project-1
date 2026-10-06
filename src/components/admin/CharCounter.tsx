'use client'

import { useFormFields } from '@payloadcms/ui'

import { finalTitle } from '@/lib/title'

/**
 * Брояч на знаците под „Мета заглавие" и „Мета описание"
 * (`task-seo-tehnichesko.md`, т. 9) — „47 / 60", „132 / 155".
 *
 * Слага се като `ui` поле веднага след полето, което брои (`metaCounter`
 * в `src/fields/seo.ts`). `path` е на самото `ui` поле
 * („meta.titleCounter"); броеното е съседът с име `target`.
 *
 * За заглавието брои заглавието ТОЧНО както ще излезе (`finalTitle`): с
 * наставката „ — EcoFlow България", ако се събира, иначе без нея.
 *
 * Зелено в лимита, оранжево в последните 10 %, червено над него.
 */
export const CharCounter = ({
  path,
  target,
  limit,
  title = false,
  note,
}: {
  path: string
  target: string
  limit: number
  title?: boolean
  note?: string
}) => {
  const съсед = [...path.split('.').slice(0, -1), target].join('.')
  const value = useFormFields(([fields]) => fields[съсед]?.value)
  const текст = typeof value === 'string' ? value.trim() : ''
  const брой = текст ? (title ? finalTitle(текст).length : текст.length) : 0

  const цвят =
    брой > limit ? 'var(--theme-error-500, #d32f2f)' : брой > limit * 0.9 ? '#e07b00' : 'var(--theme-success-500, #2e7d32)'

  return (
    <div style={{ marginTop: '-12px', marginBottom: '24px', fontSize: '13px', lineHeight: 1.4 }}>
      <span style={{ color: цвят, fontWeight: 600 }}>
        {брой} / {limit}
      </span>
      {title && текст && брой === текст.length && брой <= limit ? (
        <span style={{ color: 'var(--theme-elevation-500)' }}> · без наставката</span>
      ) : null}
      {!текст ? (
        <span style={{ color: 'var(--theme-elevation-500)' }}> · празно — ползва се автоматичното</span>
      ) : null}
      {note ? <div style={{ color: 'var(--theme-elevation-500)', marginTop: '2px' }}>{note}</div> : null}
    </div>
  )
}
