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
type Size = 'lg' | 'md' | 'sm' | 'pill'

/*
  Цветът — по мястото. Зеленото е бутонът на магазина навсякъде; черният и
  синият са за ръководствата, както на eu.ecoflow.com (таблицата с
  времената — черен, „снимка + текст" — син, овален). Правилото за
  наличност и адресът са едни и същи — затова е опция тук, не нов бутон.
*/
type Tone = 'brand' | 'dark' | 'blue' | 'outline'

const TONE: Record<Tone, string> = {
  brand: 'rounded-md bg-brand text-white hover:bg-brand-dark',
  dark: 'rounded-md bg-night text-white hover:bg-ink',
  blue: 'rounded-full bg-[#2164ff] text-white hover:bg-[#1a50d6]',
  // „За EcoFlow": до черния „Научете повече", овален контур, както на ecoflow.com/eu/about-us.
  outline: 'rounded-full border border-black bg-white text-black hover:bg-black hover:text-white',
}

const SIZE: Record<Size, string> = {
  // Продуктовата страница: 48 px, на цял ред на телефон, по съдържанието на голям екран.
  lg: 'min-h-12 w-full px-8 text-sm sm:w-auto',
  /*
    Картата: 44 px, на цялата ширина на картата. На телефон картата е
    ~164 px и „Заяви в dice.bg" с 14 px и 16 px отстъп падаше на два реда —
    затова там шрифтът и отстъпът са малко по-малки.
  */
  md: 'h-11 w-full px-2 text-[13px] sm:px-4 sm:text-sm',
  // Ръководствата: 40 px, по съдържанието.
  sm: 'min-h-10 px-6 text-sm',
  // Два бутона един до друг в тясна карта — малък отстъп, за да се събере „Заяви в dice.bg".
  pill: 'h-10 px-2 text-[13px] sm:px-3 sm:text-sm',
}

const BASE = 'inline-flex items-center justify-center whitespace-nowrap font-semibold'

export const BuyButton = ({
  product,
  size = 'lg',
  tone = 'brand',
  label,
  className = '',
}: {
  product: Pick<Product, 'availability' | 'externalUrl' | 'ctaLabel'>
  size?: Size
  tone?: Tone
  /** Надпис на мястото вместо `ctaLabel` на продукта — само при „в наличност". */
  label?: string | null
  className?: string
}) => {
  if (product.availability === 'out-of-stock') {
    return (
      <span
        aria-disabled="true"
        className={`${BASE} ${SIZE[size]} cursor-not-allowed rounded-md bg-tile text-ink-muted ${className}`}
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
      className={`${BASE} ${SIZE[size]} ${TONE[tone]} cursor-pointer transition-colors duration-200 ${className}`}
    >
      {product.availability === 'on-request'
        ? 'Заяви в dice.bg'
        : label?.trim() || product.ctaLabel?.trim() || 'Купи сега'}
    </a>
  )
}
