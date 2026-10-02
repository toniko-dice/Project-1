import { ACCESSORIES_SEGMENT, accessoriesPath, categoryPath } from '@/lib/urls'
import { getCanonicalPaths, getCategoryTree, getRedirectMap } from '@/lib/payload'
import { levelOf, ancestry } from '@/lib/tree'

/**
 * Каноничният адрес на път — за middleware-а.
 *
 * `GET /api/kanon?path=/kategorii/delta-seriya/river-3` →
 * `{ to: "/kategorii/river-seriya/river-3" }` или `{ to: null }`.
 *
 * Middleware-ът върви в Edge и няма база; пита тук, кешира отговора 5
 * минути (тагове `redirects`, `product`, `category`) и връща **301**.
 *
 * Редът:
 * 1. записано пренасочване („Пренасочвания") — то знае и изтрити адреси;
 * 2. продукт, отворен под чужда категория → адресът под серията му;
 * 3. подсерия (`/kategorii/delta-3-seriya`, също `/aksesoari`) → серията.
 */
export const GET = async (request: Request): Promise<Response> => {
  const path = new URL(request.url).searchParams.get('path') ?? ''
  return Response.json({ to: await canonical(path) }, { headers: { 'Cache-Control': 'no-store' } })
}

const canonical = async (path: string): Promise<string | null> => {
  const записано = (await getRedirectMap())[path]
  if (записано && записано !== path) return записано

  const [, base, a, b, ...rest] = path.split('/')
  if (base !== 'kategorii' || !a || rest.length) return null

  // Продукт: /kategorii/<серия>/<slug>
  if (b && b !== ACCESSORIES_SEGMENT) {
    const верен = (await getCanonicalPaths())[b]
    return верен && верен !== path ? верен : null
  }

  // Подсерия: няма свои страници — водят към серията.
  const tree = await getCategoryTree()
  const category = tree.find((c) => c.slug === a)
  if (!category || levelOf(tree, category) < 2) return null
  const серия = ancestry(tree, category).at(1)
  if (!серия) return null
  return b ? accessoriesPath(серия.slug) : `${categoryPath(серия.slug)}?sub=${category.slug}`
}
