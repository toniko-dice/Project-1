import { revalidatePath, revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

/**
 * Опресняване на кеша след промяна в админа.
 *
 * Две нива на кеш, които трябва да се изчистят заедно:
 *
 * 1. Статичният HTML на страниците — `revalidatePath`. Страниците се
 *    пререндерират при билд и се сервират от кеша (3–9 ms). Без това
 *    промяната се появява чак при следващия билд.
 *
 * 2. Кешът на четенията (`unstable_cache` в `src/lib/payload.ts`) —
 *    `revalidateTag`. Без него пресъздадената страница чете СТАРИТЕ данни
 *    от кеша и излиза същата като преди. Тагът се изчиства ПРЕДИ пътя,
 *    за да завари регенерацията свежи данни.
 *
 * Изтичането е незабавно (`{ expire: 0 }`), не stale-while-revalidate:
 * при SWR първото зареждане след „Публикувай" показва старото и подава
 * новото чак на второто. Собственикът трябва да види промяната веднага.
 *
 * Таговете са нарочно ЕДРИ. Продукт се показва в менюто, в началната, в
 * категорията си, в сравнителните таблици на други продукти — точна карта
 * кое къде се вижда е крехка и първата пропусната връзка дава стара
 * страница. Един запис в админа изчиства всичко; следващото зареждане на
 * всяка страница чете наново веднъж. Редакциите са редки, четенията —
 * постоянни.
 */

/** Всички тагове на четенията. */
export const TAGS = ['product', 'page', 'category', 'menu', 'global'] as const

const pathFor = (slug?: string | null) => (!slug || slug === 'home' ? '/' : `/${slug}`)

/**
 * `revalidatePath`/`revalidateTag` работят само в контекста на заявка към
 * Next. Seed скриптовете и другите CLI задачи нямат такъв контекст, затова
 * подминаваме тихо, вместо да съборим скрипта.
 */
const safeRevalidate = (path: string, type?: 'layout' | 'page') => {
  try {
    if (type) revalidatePath(path, type)
    else revalidatePath(path)
  } catch {
    // Извън заявка към Next — няма кеш за опресняване.
  }
}

const expireTags = (tags: readonly string[]) => {
  for (const tag of tags) {
    try {
      revalidateTag(tag, { expire: 0 })
    } catch {
      // Извън заявка към Next.
    }
  }
}

/** Изчиства целия кеш на четенията и целия сайт. */
export const expireEverything = () => {
  expireTags(TAGS)
  safeRevalidate('/', 'layout')
}

export const revalidatePage: CollectionAfterChangeHook = ({ doc, previousDoc }) => {
  expireTags(['page', `page:${doc?.slug}`])
  safeRevalidate(pathFor(doc?.slug))

  // Ако адресът е бил променен, старият също се опреснява.
  if (previousDoc?.slug && previousDoc.slug !== doc?.slug) {
    expireTags([`page:${previousDoc.slug}`])
    safeRevalidate(pathFor(previousDoc.slug))
  }
  return doc
}

export const revalidatePageDelete: CollectionAfterDeleteHook = ({ doc }) => {
  expireTags(['page', `page:${doc?.slug}`])
  safeRevalidate(pathFor(doc?.slug))
  return doc
}

/**
 * Продуктът се вижда на много места — собствената му страница, началната,
 * категорията му, менюто, сравнителните таблици. Затова се чисти всичко.
 */
export const revalidateProduct: CollectionAfterChangeHook = ({ doc, previousDoc }) => {
  expireEverything()
  if (doc?.slug) safeRevalidate(`/products/${doc.slug}`)
  if (previousDoc?.slug && previousDoc.slug !== doc?.slug) {
    safeRevalidate(`/products/${previousDoc.slug}`)
  }
  return doc
}

export const revalidateProductDelete: CollectionAfterDeleteHook = ({ doc }) => {
  expireEverything()
  if (doc?.slug) safeRevalidate(`/products/${doc.slug}`)
  return doc
}

/** Категориите, панелите, отзивите, отличията и медията се показват навсякъде. */
export const revalidateAll: CollectionAfterChangeHook = ({ doc }) => {
  expireEverything()
  return doc
}

export const revalidateAllOnDelete: CollectionAfterDeleteHook = ({ doc }) => {
  expireEverything()
  return doc
}

/** Хедърът и футърът присъстват във всяка страница. */
export const revalidateGlobal: GlobalAfterChangeHook = ({ doc, global }) => {
  expireTags(['global', `global:${global?.slug}`])
  safeRevalidate('/', 'layout')
  return doc
}
