import { revalidatePath } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

/**
 * Страниците се генерират статично, за да са бързи. Затова след всяка
 * промяна в админа изрично казваме на Next да пресъздаде засегнатия адрес —
 * иначе промяната би се появила чак при следващия билд.
 */
const pathFor = (slug?: string | null) => (!slug || slug === 'home' ? '/' : `/${slug}`)

/**
 * revalidatePath работи само в контекста на заявка към Next.
 * Seed скриптовете и другите CLI задачи нямат такъв контекст, затова
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

export const revalidatePage: CollectionAfterChangeHook = ({ doc, previousDoc }) => {
  safeRevalidate(pathFor(doc?.slug))

  // Ако адресът е бил променен, старият също се опреснява.
  if (previousDoc?.slug && previousDoc.slug !== doc?.slug) {
    safeRevalidate(pathFor(previousDoc.slug))
  }
  return doc
}

export const revalidatePageDelete: CollectionAfterDeleteHook = ({ doc }) => {
  safeRevalidate(pathFor(doc?.slug))
  return doc
}

/** Продуктите, категориите и панелите се показват в много страници — опресняваме целия сайт. */
export const revalidateAll: CollectionAfterChangeHook = ({ doc }) => {
  safeRevalidate('/', 'layout')
  return doc
}

export const revalidateAllOnDelete: CollectionAfterDeleteHook = ({ doc }) => {
  safeRevalidate('/', 'layout')
  return doc
}

/** Хедърът и футърът присъстват във всяка страница. */
export const revalidateGlobal: GlobalAfterChangeHook = ({ doc }) => {
  safeRevalidate('/', 'layout')
  return doc
}
