'use client'

import { useFormFields } from '@payloadcms/ui'

import { eur, lineTotal, offerTotals } from '@/lib/offers/calc'

/**
 * Сумите на офертата НА ЖИВО — докато се пишат цена, количество и
 * отстъпка, без запис. Сметката е същата като на сървъра и в PDF-а
 * (`src/lib/offers/calc.ts`); при запис сумите се записват и в базата.
 */
export const OfferTotals = () => {
  const f = useFormFields(([fields]) => fields)
  const n = Number(f.items?.value ?? 0)
  const lines = Array.from({ length: Number.isFinite(n) ? n : 0 }, (_, i) => ({
    title: String(f[`items.${i}.title`]?.value ?? '') || `Ред ${i + 1}`,
    quantity: Number(f[`items.${i}.quantity`]?.value ?? 0),
    unitPrice: Number(f[`items.${i}.unitPrice`]?.value ?? 0),
    discount: Number(f[`items.${i}.discount`]?.value ?? 0),
  }))
  const vatRate = Number(f['terms.vatRate']?.value ?? 20)
  const t = offerTotals(lines, vatRate)
  const cell = { padding: '6px 10px', borderBottom: '1px solid var(--theme-elevation-100)' } as const
  const num = { ...cell, textAlign: 'right' as const, whiteSpace: 'nowrap' as const }

  return (
    <div style={{ margin: '8px 0 32px' }}>
      <h4 style={{ margin: '0 0 8px' }}>Сметка (на живо)</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ color: 'var(--theme-elevation-500)', textAlign: 'left' }}>
            <th style={cell}>Ред</th>
            <th style={num}>Кол.</th>
            <th style={num}>Ед. цена с ДДС</th>
            <th style={num}>Отст.</th>
            <th style={num}>Сума с ДДС</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i}>
              <td style={cell}>{l.title}</td>
              <td style={num}>{l.quantity}</td>
              <td style={num}>{eur(l.unitPrice)}</td>
              <td style={num}>{l.discount ? `${l.discount}%` : '—'}</td>
              <td style={num}>{eur(lineTotal(l))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table style={{ marginLeft: 'auto', marginTop: 10, fontSize: 14, borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ padding: '3px 16px 3px 0' }}>Данъчна основа</td>
            <td style={{ textAlign: 'right' }}>{eur(t.base)}</td>
          </tr>
          <tr>
            <td style={{ padding: '3px 16px 3px 0' }}>в т.ч. ДДС {vatRate}%</td>
            <td style={{ textAlign: 'right' }}>{eur(t.vat)}</td>
          </tr>
          <tr style={{ fontWeight: 700, fontSize: 15 }}>
            <td style={{ padding: '6px 16px 3px 0', borderTop: '1px solid var(--theme-elevation-800)' }}>Общо с ДДС</td>
            <td style={{ textAlign: 'right', paddingTop: 6, borderTop: '1px solid var(--theme-elevation-800)' }}>{eur(t.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
