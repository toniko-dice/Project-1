import { revalidatePath, revalidateTag } from 'next/cache'
import { CATEGORY_BASE, categoryPath, productPath } from './urls'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  Payload,
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
/*
  `redirects` — кешът на middleware-а (по един отговор на адрес, 5 минути).
  Без него нов или изтрит ред се виждаше със закъснение, а опресняването
  след внос изобщо не го пипаше.
*/
export const TAGS = ['product', 'page', 'category', 'menu', 'global', 'redirects'] as const

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
 * Три правила, за да няма цикъл и верига:
 * - НОВИЯТ адрес е жив — пренасочване ОТ него се трие. Иначе смяна напред
 *   и обратно (DELTA → Комплекти → DELTA) оставя A → B и B → A и
 *   страницата се върти в кръг (открито на 1 октомври 2026);
 * - пренасочванията КЪМ стария адрес вече сочат новия — без верига
 *   X → стар → нов;
 * - `from` е уникално: има ли вече ред за стария адрес, той сочи новия.
 */
const записПренасочване = async (
  req: { payload: Payload },
  from: string,
  to: string,
  reason: string,
) => {
  if (!from || from === to) return
  const { payload } = req
  try {
    await payload.delete({ collection: 'redirects', where: { from: { equals: to } }, req: req as never })
    await payload.update({
      collection: 'redirects',
      where: { to: { equals: from } },
      data: { to },
      req: req as never,
    })
    const има = await payload.find({
      collection: 'redirects',
      where: { from: { equals: from } },
      limit: 1,
      depth: 0,
      req: req as never,
    })
    if (има.docs[0]) {
      await payload.update({
        collection: 'redirects',
        id: има.docs[0].id,
        data: { to, reason },
        req: req as never,
      })
    } else {
      await payload.create({ collection: 'redirects', data: { from, to, reason }, req: req as never })
    }
  } catch (e) {
    // Пренасочването не бива да проваля записа на продукта — само се изписва.
    payload.logger.error(`Пренасочване ${from} → ${to} не се записа: ${(e as Error).message}`)
  }
}

/**
 * Живият адрес не може да е източник на пренасочване.
 *
 * Пренасочванията се пазят завинаги, а адрес може да се освободи и после
 * да се зае наново. Точно така на 1 октомври 2026 новата категория
 * „Външни батерии" (`vanshni-baterii`) получи адрес, от който от 24
 * септември имаше пренасочване към „Външни батерии Rapid" — middleware-ът
 * го прилагаше преди страницата и тя никога не се показваше. Затова при
 * ВСЕКИ запис (и при създаване) пренасочване ОТ текущия адрес се трие.
 */
const освободиАдреса = async (req: { payload: Payload }, адрес: string) => {
  try {
    await req.payload.delete({
      collection: 'redirects',
      where: { from: { equals: адрес } },
      req: req as never,
    })
  } catch (e) {
    req.payload.logger.error(`Пренасочването от ${адрес} не се изтри: ${(e as Error).message}`)
  }
}

export const revalidateProduct: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  /*
    Адресът зависи от slug-а И от серията — и двете могат да се сменят.
    Сравняват се двата адреса, сглобени от виртуалните `categorySlug` &
    сие (`productPath`). Те се попълват при всяко четене; самото
    `category` при запис е само номер (админът и скриптовете пишат с
    `depth: 0`). Преди серията се търсеше в него и смяна на категорията
    НЕ записваше пренасочване — открито на 1 октомври 2026, когато
    основната категория стана „първата от Категории".
  */
  const старСлъг = previousDoc?.slug
  const стар = старСлъг ? productPath(previousDoc as never) : null
  const нов = productPath(doc as never)

  if (стар && стар !== нов) {
    await записПренасочване(
      req as never,
      стар,
      нов,
      старСлъг !== doc?.slug ? 'Сменен адрес на продукта' : 'Продуктът смени категорията си',
    )
  }
  await освободиАдреса(req as never, нов)

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
  if (doc?.slug) await освободиАдреса(req as never, categoryPath(doc.slug))

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
