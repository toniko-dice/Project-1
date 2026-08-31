import {
  ArrowCounterClockwise,
  Certificate,
  CreditCard,
  Globe,
  Headset,
  Lightning,
  ShieldCheck,
  Truck,
} from '@phosphor-icons/react/dist/ssr'

/**
 * Иконите идват от един набор (Phosphor) с еднаква дебелина на щриха,
 * за да не се смесват визуални езици. Емоджита не се ползват като икони.
 */
const MAP = {
  shield: ShieldCheck,
  globe: Globe,
  card: CreditCard,
  support: Headset,
  return: ArrowCounterClockwise,
  truck: Truck,
  bolt: Lightning,
  certificate: Certificate,
} as const

export type IconName = keyof typeof MAP

export const Icon = ({
  name,
  size = 32,
  className,
}: {
  name: string
  size?: number
  className?: string
}) => {
  const Cmp = MAP[name as IconName] ?? ShieldCheck
  // Иконата е декоративна — стои до видим текст, затова се крие от екранните четци.
  return <Cmp size={size} weight="regular" aria-hidden="true" className={className} />
}
