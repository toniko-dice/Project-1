'use client'

import { type ReactNode, useState } from 'react'

/**
 * Свит текст с бутон „Покажи още" — за дългия SEO текст под списъка на
 * категорията (`task-seo-tehnichesko.md`, т. 13).
 *
 * Свиването е САМО на екрана (височина + преливане). Целият текст е в
 * HTML-а още при рендера на сървъра — не се дозарежда, — затова
 * търсачката го чете целия.
 */
export const ShowMore = ({ children, collapsed }: { children: ReactNode; collapsed: boolean }) => {
  const [отворен, setОтворен] = useState(!collapsed)
  return (
    <div>
      <div
        className={
          отворен
            ? undefined
            : 'relative max-h-[5.2em] overflow-hidden after:absolute after:inset-x-0 after:bottom-0 after:h-8 after:bg-gradient-to-t after:from-canvas after:to-transparent'
        }
      >
        {children}
      </div>
      {collapsed ? (
        <button
          type="button"
          onClick={() => setОтворен((x) => !x)}
          aria-expanded={отворен}
          className="mt-3 cursor-pointer text-sm font-medium underline underline-offset-2 transition-colors duration-150 hover:text-brand"
        >
          {отворен ? 'Покажи по-малко' : 'Покажи още'}
        </button>
      ) : null}
    </div>
  )
}
