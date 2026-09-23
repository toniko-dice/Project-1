import Link from 'next/link'

/**
 * Общите части на секциите по съставените страници.
 *
 * Стоят на едно място, защото оригиналът ползва един и същи стил във
 * всички блокове. При промяна на разстоянието или на заглавието се пипа
 * тук, не в осем файла.
 */

/**
 * Обвивка на секция.
 *
 * Разстоянието между две секции в оригинала е около 100 px на десктоп.
 * Затова 48 px отгоре и 48 отдолу — сборът дава почти същото. Преди беше
 * 24+24 и секциите се слепваха.
 */
export const PageSection = ({
  className = '',
  children,
}: {
  className?: string
  children: React.ReactNode
}) => <section className={`container-site py-8 lg:py-12 ${className}`}>{children}</section>

/**
 * Заглавие на секция.
 *
 * Около 28 px и `font-medium`, вляво — както в оригинала. Не е удебелено:
 * там нито едно заглавие на секция не е bold.
 */
export const SectionHeading = ({ children }: { children?: React.ReactNode }) =>
  children ? (
    <h2 className="mb-6 text-xl font-medium tracking-tight sm:text-2xl lg:text-[28px]">
      {children}
    </h2>
  ) : null

/** Оранжевото на EcoFlow или бяло — изборът е на собственика, зависи от снимката. */
export const BannerEyebrow = ({
  text,
  color,
  dark = true,
}: {
  text?: string | null
  color?: string | null
  dark?: boolean
}) => {
  if (!text) return null

  /*
    Нормални букви, без разредка. Преди тук стоеше uppercase с
    tracking-widest — в оригинала няма нито едно такова надзаглавие.
  */
  const tone =
    color === 'orange' ? 'text-flame' : dark ? 'text-white' : 'text-ink'

  return <p className={`text-[15px] leading-snug ${tone}`}>{text}</p>
}

/**
 * Бутонът върху банер.
 *
 * В оригинала е овален и почти винаги бял с тъмен текст. Черният вариант
 * остава за светли снимки.
 */
export const BannerButton = ({
  label,
  url,
  newTab,
  style,
}: {
  label?: string | null
  url?: string | null
  newTab?: boolean | null
  style?: string | null
}) => {
  if (!url || !label) return null

  const styles =
    style === 'dark'
      ? 'bg-ink text-white hover:bg-night'
      : 'bg-white text-ink hover:bg-tile'

  return (
    <Link
      href={url}
      {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`inline-flex h-12 cursor-pointer items-center justify-center rounded-full px-8 text-[15px] font-medium transition-colors duration-200 ${styles}`}
    >
      {label}
    </Link>
  )
}
