'use client'

import { useRef } from 'react'

import { useScrollEdges } from './useScrollEdges'

/**
 * Скролващата обвивка на сравнителната таблица. На телефон над нея стои
 * „Плъзнете за още модели →" — само докато вдясно наистина има още
 * (`task-mobilna-optimizaciya.md`, т. 4); в края подсказката изчезва.
 */
export const CompareScroll = ({
  className,
  children,
}: {
  className: string
  children: React.ReactNode
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const edge = useScrollEdges(ref)
  const ощеВдясно = edge === 'end' || edge === 'both'

  return (
    <>
      <p
        aria-hidden="true"
        className={`mb-2 text-right text-xs text-ink-muted md:hidden ${ощеВдясно ? '' : 'invisible'}`}
      >
        Плъзнете за още модели →
      </p>
      <div ref={ref} className={className}>
        {children}
      </div>
    </>
  )
}
