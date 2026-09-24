import { CaretRight } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'

export type Crumb = { label: string; url: string | null }

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/**
 * Хлебни трохи — пътят от началото до текущата страница.
 *
 * Показват йерархията, която адресът вече не носи: продуктът е на
 * `/kategorii/delta-seriya/delta-3`, а главната категория над серията се
 * вижда само тук.
 *
 * Последната троха е текущата страница и НЕ е линк — иначе е линк към
 * самия себе си, който екранните четци изчитат като навигация.
 */
export const Breadcrumbs = ({ items }: { items: Crumb[] }) => {
  if (items.length < 2) return null

  return (
    <nav aria-label="Път до страницата" className="text-xs text-ink-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 ? (
              <CaretRight size={11} aria-hidden="true" className="shrink-0 opacity-60" />
            ) : null}

            {item.url && i < items.length - 1 ? (
              <Link href={item.url} className="cursor-pointer hover:text-ink hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current={i === items.length - 1 ? 'page' : undefined}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/**
 * Същите трохи за търсачките.
 *
 * Google ги показва в резултатите вместо голия адрес. Без `item` на
 * последния елемент — така е в примерите на schema.org за текущата
 * страница.
 */
export const breadcrumbSchema = (items: Crumb[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.label,
    ...(item.url && i < items.length - 1
      ? { item: new URL(item.url, SITE_URL).toString() }
      : {}),
  })),
})
