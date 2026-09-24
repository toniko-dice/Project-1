import { revalidatePath, revalidateTag } from 'next/cache'
import { CATEGORY_BASE, categoryPath, productPath, seriesSlug } from './urls'
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
/**
 * Записва пренасочване от стар адрес към нов.
 *
 * Адресът на продукта съдържа серията му, затова смяна на категория или
 * на slug сменя адреса. Старият остава да работи — линковете отвън
 * (Google, dice.bg, споделено в социална мрежа) не бива да умират, а
 * собственикът не трябва да поддържа списък на ръка.
 *
 * Дубликат не се създава: полето `from` е уникално и грешката се преглъща.
 */
const записПренасочване = async (
  req: { payload: { create: (args: unknown) => Promise<unknown> } },
  from: string,
  to: string,
  reason: string,
) => {
  if (!from || from === to) return
  try {
    await req.payload.create({
      collection: 'redirects',
      data: { from, to, reason },
    })
  } catch {
    /*
      Най-честата причина е „вече съществува" — старият адрес е бил сменян
      и преди. Тогава първият запис е по-верният: той сочи най-стария
      адрес към текущия, а този щеше да сочи същото.
    */
  }
}

export const revalidateProduct: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  /* Адресът зависи от slug-а И от серията — и двете могат да се сменят. */
  const старСлъг = previousDoc?.slug
  const стараСерия = seriesSlug(previousDoc?.category)
  const новаСерия = seriesSlug(doc?.category)

  if (старСлъг && (старСлъг !== doc?.slug || стараСерия !== новаСерия)) {
    const от = стараСерия
      ? `${CATEGORY_BASE}/${стараСерия}/${старСлъг}`
      : `${CATEGORY_BASE}/produkt/${старСлъг}`
    await записПренасочване(
      req as never,
      от,
      productPath(doc as never),
      старСлъг !== doc?.slug ? 'Сменен адрес на продукта' : 'Продуктът смени категорията си',
    )
  }

  expireEverything()
  /*
    Адресът на продукта съдържа серията му, а тя се чете от категорията —
    тук документът е с малка дълбочина. Затова се опреснява цялото
    разклонение на адресите, а не един път: тагът е едър и без това.
  */
  safeRevalidate(CATEGORY_BASE, 'layout')
  return doc
}

export const revalidateProductDelete: CollectionAfterDeleteHook = ({ doc }) => {
  expireEverything()
  safeRevalidate(CATEGORY_BASE, 'layout')
  return doc
}

/** Категориите, панелите, отзивите, отличията и медията се показват навсякъде. */
export const revalidateAll: CollectionAfterChangeHook = ({ doc }) => {
  expireEverything()
  return doc
}

/**
 * Категория: същото, плюс пренасочване при смяна на адреса.
 *
 * Смяната на slug на категория мени и адресите на продуктите под нея —
 * те се преизчисляват сами, защото се сглобяват от текущата категория.
 * Тук се пази само адресът на самата категория.
 */
export const revalidateCategory: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  expireEverything()

  if (previousDoc?.slug && previousDoc.slug !== doc?.slug) {
    await записПренасочване(
      req as never,
      categoryPath(previousDoc.slug),
      categoryPath(doc.slug),
      'Сменен адрес на категорията',
    )
  }

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
