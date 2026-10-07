import type { Access, FieldAccess, PayloadRequest } from 'payload'

/**
 * Ролите на потребителите на админа (`task-roli-potrebiteli.md`).
 *
 * | раздел                                   | admin | editor            | sales             |
 * |------------------------------------------|-------|-------------------|-------------------|
 * | продукти, категории, атрибути, медия     | всичко| създава, редактира| само чете         |
 * | страници, панели, отличия, отзиви, пренасочвания; хедър, футър, дизайн, филтри, настройки | всичко | създава, редактира | — |
 * | заявки, файлове, оферти                  | всичко| —                 | създава, редактира|
 * | данни за офертите                        | всичко| —                 | само чете         |
 * | абонати, архиви                          | всичко| —                 | —                 |
 * | потребители                              | всичко| собствения профил | собствения профил |
 *
 * Трие само администраторът. „—" = разделът е скрит в менюто
 * (`hiddenFor`) и записът/четенето през API-то е забранено. Колекциите,
 * които сайтът чете публично (страници, панели…), остават публични за
 * четене — иначе сайтът не би се показал; скрити са само в админа.
 */
export type Role = 'admin' | 'editor' | 'sales'

export const ROLE_OPTIONS: { label: string; value: Role }[] = [
  { label: 'Администратор', value: 'admin' },
  { label: 'Редактор', value: 'editor' },
  { label: 'Продажби', value: 'sales' },
]

type MaybeUser = { collection?: string; role?: string | null } | null | undefined

/** Ролята на влезлия потребител; без вход (или чужда колекция) — `null`. */
export const roleOf = (user: MaybeUser): Role | null => {
  if (!user) return null
  if (user.collection && user.collection !== 'users') return null
  const r = user.role
  return r === 'admin' || r === 'editor' || r === 'sales' ? r : null
}

export const userHasRole = (user: MaybeUser, ...roles: Role[]): boolean => {
  const r = roleOf(user)
  return r !== null && roles.includes(r)
}

/** Правило за `access` — пуска изброените роли. */
export const hasRole =
  (...roles: Role[]): Access =>
  ({ req }) =>
    userHasRole(req.user as MaybeUser, ...roles)

export const isAdmin: Access = hasRole('admin')
export const isEditor: Access = hasRole('admin', 'editor')
export const isSales: Access = hasRole('admin', 'sales')
export const anyRole: Access = hasRole('admin', 'editor', 'sales')
export const publicRead: Access = () => true

/** Поле само за администратора (четене или запис). */
export const adminField: FieldAccess = ({ req }) => userHasRole(req.user as MaybeUser, 'admin')

/** `admin.hidden` — скрива раздела в менюто за всички роли извън изброените. */
export const hiddenFor =
  (...visibleTo: Role[]) =>
  ({ user }: { user: unknown }) =>
    !userHasRole(user as MaybeUser, ...visibleTo)

/** За endpoint-ите: влязъл потребител с една от ролите. */
export const reqHasRole = (req: PayloadRequest, ...roles: Role[]) => userHasRole(req.user as MaybeUser, ...roles)

/** Съдържание на сайта: всеки чете, админ и редактор пишат, само админът трие. */
export const contentAccess = {
  read: publicRead,
  create: isEditor,
  update: isEditor,
  delete: isAdmin,
}

/** Продажби: заявки, оферти — админ и продажби, трие само админът. */
export const salesAccess = {
  read: isSales,
  create: isSales,
  update: isSales,
  delete: isAdmin,
}

/** Само администратор. */
export const adminOnlyAccess = {
  read: isAdmin,
  create: isAdmin,
  update: isAdmin,
  delete: isAdmin,
}
