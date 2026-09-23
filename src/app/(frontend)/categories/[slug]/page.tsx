import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ImagePlaceholder } from '@/components/ImagePlaceholder'
import { ProductCard } from '@/components/ProductCard'
import { mediaAlt, mediaUrl } from '@/lib/media'
import {
  getCategory,
  getCategorySlugs,
  getGlobal,
  getProductsInCategory,
  getSubcategories,
} from '@/lib/payload'

type Args = { params: Promise<{ slug: string }> }

export const generateStaticParams = async () => {
  const slugs = await getCategorySlugs()
  return slugs.map((slug) => ({ slug }))
}

export const generateMetadata = async ({ params }: Args): Promise<Metadata> => {
  const { slug } = await params
  const category = await getCategory(slug)
  if (!category) return {}

  const image = mediaUrl(category.heroImage, 'banner')

  return {
    title: category.metaTitle ?? category.title,
    description: category.metaDescription ?? category.heroTagline ?? undefined,
    openGraph: image ? { images: [{ url: image }] } : undefined,
  }
}

/**
 * Категорийна страница.
 *
 * Минимална е нарочно — задачата ѝ засега е линковете от менюто да водят
 * донякъде, вместо към 404. Пълният вид по оригинала е отделна задача.
 *
 * Главна категория показва подкатегориите си като карти; подкатегория
 * показва продуктите в себе си. Празна подкатегория казва „Скоро", вместо
 * да остави бяло поле — дървото се пълни преди продуктите.
 */
export default async function CategoryPage({ params }: Args) {
  const { slug } = await params
  const [category, settings] = await Promise.all([getCategory(slug), getGlobal('site-settings')])

  if (!category) notFound()

  const [subcategories, products] = await Promise.all([
    getSubcategories(category.id),
    getProductsInCategory(category.id),
  ])

  const hero = mediaUrl(category.heroImage, 'wide')
  const главна = subcategories.length > 0

  return (
    <div className="bg-canvas">
      <div className="container-site py-8 lg:py-12">
        {/* ── Заглавна част ── */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="relative aspect-[16/9] w-full sm:aspect-[3/1]">
            {hero ? (
              <Image
                src={hero}
                alt={mediaAlt(category.heroImage)}
                fill
                sizes="100vw"
                priority
                className="object-cover"
              />
            ) : (
              <ImagePlaceholder className="absolute inset-0" />
            )}

            {/*
              Цветът на текста следва това, което е отдолу.

              Бял текст върху заместителя (светло сиво) не се чете — а
              докато категориите нямат снимки, точно това виждаше
              собственикът на всяка категорийна страница.
            */}
            <div className="absolute inset-0 flex items-center">
              <div className="w-full px-6 sm:px-12">
                <h1
                  className={`text-2xl font-medium leading-tight tracking-tight sm:text-3xl lg:text-4xl ${
                    hero ? 'text-white drop-shadow' : 'text-ink'
                  }`}
                >
                  {category.title}
                </h1>
                {category.heroTagline ? (
                  <p
                    className={`mt-2 max-w-lg text-[15px] sm:text-base ${
                      hero ? 'text-white drop-shadow' : 'text-ink-muted'
                    }`}
                  >
                    {category.heroTagline}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* ── Подкатегории (при главна категория) ── */}
        {главна ? (
          <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {subcategories.map((sub) => {
              const icon = mediaUrl(sub.icon, 'card')
              return (
                <li key={sub.id}>
                  <Link
                    href={`/categories/${sub.slug}`}
                    className="group flex h-full cursor-pointer flex-col gap-3 rounded-xl bg-surface p-4 transition-shadow duration-200 hover:shadow-md"
                  >
                    <span className="relative block aspect-square w-full overflow-hidden rounded-lg">
                      {icon ? (
                        <Image
                          src={icon}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 45vw, 22vw"
                          loading="lazy"
                          className="object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <ImagePlaceholder className="absolute inset-0" />
                      )}
                    </span>
                    <span className="text-[15px] font-medium leading-snug">{sub.title}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : products.length ? (
          <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <li key={p.id}>
                <ProductCard
                  product={p}
                  showBgn={Boolean(settings.showBgnPrices)}
                  className="h-full"
                />
              </li>
            ))}
          </ul>
        ) : (
          /* Дървото се пълни преди продуктите — празно не значи счупено. */
          <p className="mt-10 text-center text-sm text-ink-muted">Скоро</p>
        )}

        {category.description ? (
          <p className="mt-10 max-w-3xl text-sm leading-relaxed text-ink-muted">
            {category.description}
          </p>
        ) : null}
      </div>
    </div>
  )
}
