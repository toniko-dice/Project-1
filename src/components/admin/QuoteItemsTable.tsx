'use client'

import { useConfig, useFormFields } from '@payloadcms/ui'

/**
 * Продуктите на заявката като таблица: име (линк към продукта на сайта и
 * към записа му в админа) и количество. Данните са от масива `items` —
 * името и адресът са записани в момента на заявката, затова таблицата не
 * зарежда нищо и показва продукта такъв, какъвто е бил поискан.
 */
export const QuoteItemsTable = () => {
  const { config } = useConfig()
  const fields = useFormFields(([f]) => f)
  const count = Number(fields.items?.value ?? 0)
  const rows = Array.from({ length: Number.isFinite(count) ? count : 0 }, (_, i) => ({
    title: String(fields[`items.${i}.title`]?.value ?? ''),
    url: String(fields[`items.${i}.url`]?.value ?? ''),
    product: fields[`items.${i}.product`]?.value as number | { id: number } | null | undefined,
    quantity: Number(fields[`items.${i}.quantity`]?.value ?? 0),
  }))
  const total = rows.reduce((s, r) => s + r.quantity, 0)
  const admin = config.routes.admin

  if (!rows.length) {
    return <p style={{ margin: '0 0 24px', color: 'var(--theme-elevation-500)' }}>Няма избрани продукти от списъка.</p>
  }

  const cell = { padding: '10px 12px', borderBottom: '1px solid var(--theme-elevation-100)' } as const

  return (
    <div style={{ marginBottom: 32 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: 'left', color: 'var(--theme-elevation-500)' }}>
            <th style={cell}>Продукт</th>
            <th style={{ ...cell, width: 120, textAlign: 'right' }}>Количество</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const id = typeof r.product === 'object' && r.product ? r.product.id : r.product
            return (
              <tr key={i}>
                <td style={cell}>
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noopener noreferrer">
                      {r.title}
                    </a>
                  ) : (
                    r.title
                  )}
                  {id ? (
                    <a
                      href={`${admin}/collections/products/${id}`}
                      style={{ marginLeft: 10, fontSize: 12, color: 'var(--theme-elevation-500)' }}
                    >
                      в админа
                    </a>
                  ) : null}
                </td>
                <td style={{ ...cell, textAlign: 'right', fontWeight: 600 }}>{r.quantity}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr>
            <td style={{ ...cell, borderBottom: 0, fontWeight: 600 }}>Общо: {rows.length} продукта</td>
            <td style={{ ...cell, borderBottom: 0, textAlign: 'right', fontWeight: 600 }}>{total} бр.</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
