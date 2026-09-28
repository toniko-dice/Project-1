import type { Metadata } from 'next'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'

import { ProductCard } from '@/components/ProductCard'
import { getGlobal, getLatestProducts, searchProducts } from '@/lib/payload'
import { SEARCH_PATH } from '@/lib/urls'

type Args = { searchParams: Promise<{ q?: string | string[] }> }

/** Търсеното от адреса — винаги един низ, независимо какво е дошло. */
const отАдреса = (q: string | string[] | undefined): string =>
  (Array.isArray(q) ? q[0] : q)?.trim() ?? ''

/**
 * Страницата с резултати НЕ се индексира.
 *
 * Търсенето създава безброй адреси с едно и също съдържание, подредено
 * по различен начин — точно това, което търсачките наричат „тънки"
 * страници. Затова `noindex`, а линковете навътре се следват. По същата
 * причина адресът го няма и в картата на сайта.
 */
export const generateMetadata = async ({ searchParams }: Args): Promise<Metadata> => {
  const q = отАдреса((await searchParams).q)

  return {
    // Наставката „— EcoFlow България" идва от `title.template` в layout.
    title: q ? `Резултати за „${q}“` : 'Търсене',
    robots: { index: false, follow: true },
  }
}

export default async function SearchPage({ searchParams }: Args) {
  const q = отАдреса((await searchParams).q)

  const settings = await getGlobal('site-settings')
  const showBgn = Boolean(settings.showBgnPrices)

  const results = q ? await searchProducts(q) : []
  /* Празен резултат не бива да е задънена улица — показва се какво има. */
  const newest = q && !results.length ? await getLatestProducts(4) : []

  return (
    <div className="bg-canvas">
      <div className="container-site py-8 lg:py-12">
        {/*
          Полето е и тук, не само в хедъра: страницата се отваря и от
          споделен линк, и без JavaScript. Обикновен `<form method="get">`
          върши работата и в двата случая.
        */}
        <form action={SEARCH_PATH} method="get" role="search" className="mx-auto max-w-2xl">
          <label htmlFor="q" className="sr-only">
            Търсене в продуктите
          </label>
          <div className="flex items-center gap-3 rounded-full border border-line-strong bg-surface px-5">
            <MagnifyingGlass size={20} className="shrink-0 text-ink-muted" aria-hidden="true" />
            <input
              id="q"
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Име, каталожен номер или баркод"
              autoComplete="off"
              className="min-h-12 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink-muted"
            />
            <button
              type="submit"
              className="min-h-12 shrink-0 cursor-pointer text-sm font-medium transition-colors duration-200 hover:text-brand"
            >
              Търси
            </button>
          </div>
        </form>

        {!q ? (
          <p className="mt-10 text-center text-ink-muted">
            Въведете име на продукт, каталожен номер (SKU) или баркод.
          </p>
        ) : results.length ? (
          <>
            <div className="mt-10">
              <h1 className="text-2xl font-medium leading-tight tracking-tight sm:text-3xl">
                Резултати за „{q}“
              </h1>
              <p className="mt-2 text-sm text-ink-muted">
                {results.length}{' '}
                {results.length === 1 ? 'намерен продукт' : 'намерени продукта'}
              </p>
            </div>

            <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {results.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} showBgn={showBgn} className="h-full" />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <div className="mt-10 text-center">
              <h1 className="text-2xl font-medium leading-tight tracking-tight sm:text-3xl">
                Нищо не е намерено за „{q}“
              </h1>
              <p className="mt-2 text-sm text-ink-muted">
                {/*
                  Търси се по това, което пише в продукта — имената са на
                  латиница. „ривър" няма да намери RIVER; не превеждаме.
                */}
                Проверете изписването или опитайте с по-малко думи. Имената на моделите са на
                латиница: DELTA, RIVER, WAVE.
              </p>
            </div>

            {newest.length ? (
              <div className="mt-12">
                <h2 className="text-center text-lg font-medium">Най-нови продукти</h2>
                <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {newest.map((product) => (
                    <li key={product.id}>
                      <ProductCard product={product} showBgn={showBgn} className="h-full" />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
