import { MapPin } from '@phosphor-icons/react/dist/ssr'

import { type Магазин, картаНа, редовеЧасове } from '@/lib/stores'

/**
 * Картите на магазините — име, адрес (линк към Google Maps) и работно
 * време. Общи за блока „Магазини" („За ДИ СИ 2008") и за `/kontakti`,
 * който чете СЪЩИЯ блок — едно въвеждане, без разминаване.
 * Без телефон (`task-futar.md`).
 */
export const StoreCards = ({ stores, className = 'grid gap-4 md:grid-cols-2' }: { stores: Магазин[]; className?: string }) => (
  <ul className={className}>
    {stores.map((s, i) => (
      <li key={i} className="rounded-xl bg-tile p-5">
        <h3 className="text-base font-semibold">{s.name}</h3>
        <a
          href={картаНа(s)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex min-h-11 items-start gap-2 py-1 text-[15px] underline underline-offset-4 hover:text-ink-muted"
        >
          <MapPin size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>
            {s.street}, {s.city}
            <span className="sr-only"> (отваря Google Maps в нов раздел)</span>
          </span>
        </a>
        {редовеЧасове(s.hours).length ? (
          <ul className="mt-3 space-y-1 text-[15px] text-ink-muted">
            {редовеЧасове(s.hours).map((р) => (
              <li key={р}>{р}</li>
            ))}
          </ul>
        ) : null}
      </li>
    ))}
  </ul>
)

/** Магазините с попълнени име и адрес. */
export const валидниМагазини = <T extends { name?: string | null; street?: string | null; city?: string | null }>(stores: T[] | null | undefined) =>
  (stores ?? []).filter((s) => s.name && s.street && s.city) as (T & Магазин)[]
