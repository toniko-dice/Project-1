import type { Metadata } from 'next'

/**
 * Заглавието в таба и в резултатите на търсачките.
 *
 * Името на сайта се добавя от `title.template` в layout-а („%s — EcoFlow
 * България") — но САМО когато се събира в 60 знака (`task-seo-tehnichesko.md`,
 * т. 4). Google реже по-дългите: на 5 октомври 2026 81 от 155 продукта бяха
 * над 60 знака заедно с наставката и в резултатите името на модела излизаше
 * отрязано, а „— EcoFlow България" изобщо не се виждаше.
 *
 * - заглавие + „ — EcoFlow България" ≤ 60 знака → с наставката;
 * - иначе → само заглавието (`absolute`);
 * - заглавие, което ВЕЧЕ съдържа името на сайта (ръчно мета заглавие,
 *   началната) → само то; до 2 октомври 2026 112 продукта излизаха с
 *   името два пъти.
 */
export const SITE_NAME = 'EcoFlow България'

export const TITLE_SUFFIX = ` — ${SITE_NAME}`

export const TITLE_TEMPLATE = `%s${TITLE_SUFFIX}`

/** H1 на началната, докато в „Общи настройки" не е попълнено друго. */
export const HOME_H1_DEFAULT = 'EcoFlow България — портативни електроцентрали и соларни системи'

/** Таванът на Google за заглавие — заедно с наставката. */
export const TITLE_LIMIT = 60

/** Описанието — над това Google реже. */
export const DESCRIPTION_LIMIT = 155

/** Заглавието ТОЧНО както ще излезе — за отчета и за броячите в админа. */
export const finalTitle = (title?: string | null): string => {
  const t = title?.trim() ?? ''
  if (!t) return SITE_NAME
  if (t.toLocaleLowerCase('bg').includes(SITE_NAME.toLocaleLowerCase('bg'))) return t
  return (t + TITLE_SUFFIX).length <= TITLE_LIMIT ? t + TITLE_SUFFIX : t
}

export const pageTitle = (title?: string | null): Metadata['title'] | undefined => {
  const t = title?.trim()
  if (!t) return undefined
  return finalTitle(t) === t ? { absolute: t } : t
}
