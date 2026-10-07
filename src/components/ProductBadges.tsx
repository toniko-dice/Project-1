import { discountPercent } from '@/lib/format'

/**
 * Етикетите „−N%" и „Последна бройка" (`task-dice-xml-sinhronizaciya.md`,
 * т. 7 и 7а) — една форма с етикета „НОВО" на продуктовата страница:
 * черно, бяло, малки главни. „Последна бройка" е с точка отпред.
 *
 * Редът е „−N%", после „Последна бройка". Текстът е истински текст.
 */
export type BadgeInput = {
  price?: number | null
  compareAtPrice?: number | null
  lastPiece?: boolean | null
  availability?: string | null
}

export type ProductBadge = { key: 'discount' | 'last'; label: string }

export const productBadges = (p: BadgeInput): ProductBadge[] => {
  const out: ProductBadge[] = []
  const off = typeof p.price === 'number' ? discountPercent(p.price, p.compareAtPrice) : null
  if (off) out.push({ key: 'discount', label: `−${off}%` })
  // Само при наличен продукт; „Изчерпан" казва бутонът.
  if (p.lastPiece && (p.availability ?? 'in-stock') === 'in-stock') out.push({ key: 'last', label: 'Последна бройка' })
  return out
}

export const BADGE_CLASS =
  'inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded bg-ink px-2 py-1 text-[11px] font-semibold leading-none tracking-wide text-white'

export const Badge = ({ badge }: { badge: ProductBadge }) => (
  <span className={BADGE_CLASS}>
    {badge.key === 'last' ? <span aria-hidden="true" className="size-1.5 rounded-full bg-white" /> : null}
    {badge.label}
  </span>
)

export const ProductBadges = ({ badges, className = '' }: { badges: ProductBadge[]; className?: string }) =>
  badges.length ? (
    <span className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {badges.map((b) => (
        <Badge key={b.key} badge={b} />
      ))}
    </span>
  ) : null
