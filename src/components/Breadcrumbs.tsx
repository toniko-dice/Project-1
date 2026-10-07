import { CaretRight } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'

import { absoluteUrl } from '@/lib/site-url'

export type Crumb = { label: string; url: string | null }

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
    /*
      На телефон трохите са на един ред и се скролват хоризонтално, вместо
      да се пренасят на два (`task-mobilna-optimizaciya.md`, т. 4); всяка е
      висока 44 px за пръста. Отрицателното поле връща реда на мястото му.
    */
    <nav aria-label="Път до страницата" className="text-xs text-ink-muted max-md:-my-3">
      <ol className="flex flex-wrap items-center gap-1 max-md:flex-nowrap max-md:overflow-x-auto max-md:whitespace-nowrap max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden">
        {items.map((item, i) => (
          <li key={i} className="flex shrink-0 items-center gap-1">
            {i > 0 ? (
              <CaretRight size={11} aria-hidden="true" className="shrink-0 opacity-60" />
            ) : null}

            {item.url && i < items.length - 1 ? (
              <Link
                href={item.url}
                className="cursor-pointer hover:text-ink hover:underline max-md:inline-flex max-md:min-h-11 max-md:items-center"
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={i === items.length - 1 ? 'page' : undefined}
                className="max-md:inline-flex max-md:min-h-11 max-md:items-center"
              >
                {item.label}
              </span>
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
      ? { item: absoluteUrl(item.url) }
      : {}),
  })),
})
