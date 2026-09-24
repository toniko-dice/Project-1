import { notFound, permanentRedirect } from 'next/navigation'

import { getProduct } from '@/lib/payload'
import { productPath } from '@/lib/urls'

/**
 * Резервният адрес на продукт: `/kategorii/produkt/<slug>`.
 *
 * Тук идват старите `/products/<slug>` (през middleware) и продуктите без
 * определена серия. Страницата не показва нищо — намира продукта по адрес
 * и праща на истинския му адрес под серията.
 *
 * Така middleware не прави заявка към базата за всеки стар линк, а
 * посетителят стига до правилната страница с един скок повече.
 */
export default async function ProductFallback({
  params,
}: {
  params: Promise<{ product: string }>
}) {
  const { product: slug } = await params
  const product = await getProduct(slug)

  if (!product) notFound()

  const path = productPath(product)
  // Продукт без категория би се върнал тук — тогава е 404, не безкраен кръг.
  if (path === `/kategorii/produkt/${slug}`) notFound()

  permanentRedirect(path)
}
