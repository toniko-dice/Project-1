import { DESIGN_TOKEN_MAP } from '@/globals/Design'
import { getGlobal } from '@/lib/payload'

/**
 * Изсипва настроените от админа цветове като CSS променливи върху :root.
 *
 * Стойностите по подразбиране живеят в globals.css (@theme). Тук се
 * презаписват само тези, които са попълнени — празно поле не пипа нищо.
 * Затова смяната на цвят е запис в админа, а не нов деплой.
 */
export const DesignTokens = async () => {
  const design = await getGlobal('design')

  const declarations = Object.entries(DESIGN_TOKEN_MAP)
    .map(([field, cssVar]) => {
      const value = (design as unknown as Record<string, unknown>)[field]
      if (typeof value !== 'string' || !value.trim()) return null
      // Стойността вече е валидирана като шестнайсетичен цвят при запис.
      return `${cssVar}:${value.trim()}`
    })
    .filter(Boolean)

  if (!declarations.length) return null

  return (
    <style
      // Само шестнайсетични цветове стигат дотук — няма как да се вмъкне произволен CSS.
      dangerouslySetInnerHTML={{ __html: `:root{${declarations.join(';')}}` }}
    />
  )
}
