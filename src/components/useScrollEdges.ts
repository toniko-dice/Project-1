'use client'

import { type RefObject, useEffect, useState } from 'react'

/** Кой край на хоризонталната лента крие още съдържание. */
export type ScrollEdge = 'none' | 'start' | 'end' | 'both'

/**
 * Следи дали лентата се скролва още наляво или надясно — за избледняването
 * в края (`.edge-fade` в globals.css) и за подсказки като „Плъзнете за още".
 *
 * Не се знае от сървъра: зависи от ширината на екрана и от броя елементи.
 * Мери при скрол и при смяна на размера на лентата или на децата ѝ.
 */
export const useScrollEdges = (ref: RefObject<HTMLElement | null>): ScrollEdge => {
  const [edge, setEdge] = useState<ScrollEdge>('none')

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const max = el.scrollWidth - el.clientWidth
      // Един пиксел допуск — при мащабиране числата не са цели.
      const start = el.scrollLeft > 1
      const end = el.scrollLeft < max - 1
      setEdge(start && end ? 'both' : start ? 'start' : end ? 'end' : 'none')
    }
    measure()
    el.addEventListener('scroll', measure, { passive: true })
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    for (const child of Array.from(el.children)) observer.observe(child)
    return () => {
      el.removeEventListener('scroll', measure)
      observer.disconnect()
    }
  }, [ref])

  return edge
}
