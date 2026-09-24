import type { Category } from '@/payload-types'

import type { Crumb } from '@/components/Breadcrumbs'
import { categoryPath } from './urls'

/**
 * Помощници за дървото на категориите.
 *
 * Дървото се чете веднъж (`getCategoryTree`) и се обхожда тук — плоско, с
 * родители по номер. Така страниците не правят по една заявка на ниво.
 */

export const parentId = (c: Category): number | null =>
  typeof c.parent === 'number' ? c.parent : (c.parent?.id ?? null)

export const byId = (tree: Category[]) => new Map(tree.map((c) => [c.id, c]))

/** Пътят от главната категория надолу до тази, включително нея. */
export const ancestry = (tree: Category[], category: Category): Category[] => {
  const map = byId(tree)
  const path: Category[] = [category]

  let parent = parentId(category)
  // Ограничението е предпазно: цикъл в родителите би завъртял безкрайно.
  for (let i = 0; parent && i < 10; i += 1) {
    const next = map.get(parent)
    if (!next) break
    path.unshift(next)
    parent = parentId(next)
  }

  return path
}

/** Прякото ниво под категорията, в подредбата от админа. */
export const childrenOf = (tree: Category[], id: number): Category[] =>
  tree.filter((c) => parentId(c) === id)

/** Нивото: 0 — главна, 1 — серия, 2 — подсерия. */
export const levelOf = (tree: Category[], category: Category): number =>
  ancestry(tree, category).length - 1

/** Хлебните трохи за категория. */
export const categoryCrumbs = (tree: Category[], category: Category): Crumb[] => [
  { label: 'Начало', url: '/' },
  ...ancestry(tree, category).map((c) => ({ label: c.title, url: categoryPath(c.slug) })),
]
