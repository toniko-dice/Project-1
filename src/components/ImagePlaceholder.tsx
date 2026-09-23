import { ImageSquare } from '@phosphor-icons/react/dist/ssr'

/**
 * Заместител за липсваща снимка.
 *
 * Ползва се навсякъде, където се очаква изображение от Медия и полето е
 * празно — продуктова карта, икона на категория, карта в менюто, банер,
 * колона в сравнителната таблица.
 *
 * НЕ е файл в Медия, а компонент. Ако беше файл, „nyama-snimka.png" щеше
 * да се разпространи из базата, да се брои като истинска снимка и да се
 * появи в галерии и в резултати от търсене. Така липсата остава липса.
 *
 * `className` носи размера и заоблянето на мястото, където стои — при
 * снимка с `fill` това е `absolute inset-0`, иначе размерите на кутията.
 */
export const ImagePlaceholder = ({
  className = '',
  compact = false,
}: {
  className?: string
  /** Само иконката, без надпис — за кутии под около 80px. */
  compact?: boolean
}) => (
  <span
    aria-hidden="true"
    className={`flex flex-col items-center justify-center gap-1.5 overflow-hidden bg-blank text-ink-muted ${className}`}
  >
    <ImageSquare size={compact ? 18 : 28} weight="light" />
    {compact ? null : <span className="px-2 text-center text-[11px] leading-tight">Няма снимка</span>}
  </span>
)
