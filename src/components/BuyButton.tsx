import type { Product } from '@/payload-types'

/**
 * Бутонът към магазина — на продуктовата страница и на всяка карта.
 *
 * Един компонент, два размера. Два отделни бутона биха се разминали при
 * първата промяна: цветът, ъглите или правилото за наличност се сменят на
 * едното място, а на другото остават старите.
 *
 * Надписът следва наличността (`src/lib/availability.ts`):
 * - в наличност — `ctaLabel` на продукта („Купи сега");
 * - по заявка — „Заяви в dice.bg", същият адрес и същият вид: „Купи сега"
 *   би обещал нещо, което магазинът в момента няма;
 * - изчерпан — неактивен „Изчерпан", без линк.
 *
 * Покупката е в dice.bg, затова адресът е `externalUrl`, в нов раздел.
 */
type Size = 'lg' | 'md'

const SIZE: Record<Size, string> = {
  // Продуктовата страница: 48 px, на цял ред на телефон, по съдържанието на голям екран.
  lg: 'min-h-12 w-full px-8 text-sm sm:w-auto',
  /*
    Картата: 44 px, на цялата ширина на картата. На телефон картата е
    ~164 px и „Заяви в dice.bg" с 14 px и 16 px отстъп падаше на два реда —
    затова там шрифтът и отстъпът са малко по-малки.
  */
  md: 'h-11 w-full px-2 text-[13px] sm:px-4 sm:text-sm',
}

const BASE =
  'inline-flex items-center justify-center whitespace-nowrap rounded-md font-semibold'

export const BuyButton = ({
  product,
  size = 'lg',
  className = '',
}: {
  product: Pick<Product, 'availability' | 'externalUrl' | 'ctaLabel'>
  size?: Size
  className?: string
}) => {
  if (product.availability === 'out-of-stock') {
    return (
      <span
        aria-disabled="true"
        className={`${BASE} ${SIZE[size]} cursor-not-allowed bg-tile text-ink-muted ${className}`}
      >
        Изчерпан
      </span>
    )
  }

  // Свързан продукт без адрес (не би трябвало — полето е задължително) не дава мъртъв бутон.
  if (!product.externalUrl) return null

  return (
    <a
      href={product.externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`${BASE} ${SIZE[size]} cursor-pointer bg-brand text-white transition-colors duration-200 hover:bg-brand-dark ${className}`}
    >
      {product.availability === 'on-request'
        ? 'Заяви в dice.bg'
        : product.ctaLabel?.trim() || 'Купи сега'}
    </a>
  )
}
