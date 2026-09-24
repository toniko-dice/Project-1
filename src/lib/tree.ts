import type { Category } from '@/payload-types'

import type { Crumb } from '@/components/Breadcrumbs'
import { categoryUrl } from './urls'

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

/**
 * Хлебните трохи за категория.
 *
 * Подсерията няма собствена страница, затова трохата ѝ води към раздела
 * на серията (`?sub=`). Адресът се сглобява от `categoryUrl`, която знае
 * правилото — тук се подава веригата от родители, за да го определи.
 */
export const categoryCrumbs = (tree: Category[], category: Category): Crumb[] => {
  const path = ancestry(tree, category)

  return [
    { label: 'Начало', url: '/' },
    ...path.map((c, i) => ({
      label: c.title,
      /*
        `categoryUrl` чака категорията със заредени родители. Тук дървото е
        плоско (родителите са номера), затова веригата се навързва наум.
      */
      url: categoryUrl(
        /*
          Навързва се ОТЛЯВО: главната става родител на серията, серията —
          на подсерията. Обратната посока слага главната за родител на
          най-долната и `categoryUrl` я взима за серия.
        */
        path.slice(0, i + 1).reduce<Category | undefined>(
          (родител, възел) => ({ ...възел, parent: родител ?? null }),
          undefined,
        ) as Category,
      ),
    })),
  ]
}
