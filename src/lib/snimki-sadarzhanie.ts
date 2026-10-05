/**
 * Имената на снимките в `sadarzhanie.json` — общо за вноса и за
 * `snimki:imena`. Отделно от двете, защото вносът ползва смяната на имена,
 * а смяната — помощниците на вноса.
 */

export const ИЗОБРАЖЕНИЕ = /\.(jpe?g|png|webp|avif|gif)$/i

/** Името на файла от адрес: последният сегмент, без въпросителната. */
export const fileNameFromUrl = (url: string): string => {
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop() ?? '')
  } catch {
    return ''
  }
}

/** Свалянето: стар вид `{galeriya: [url], sekcii: [url]}` или нов `[{url, file}]`. */
export type СвалиСнимки = { galeriya?: unknown[]; sekcii?: unknown[] } | { url: string; file?: string }[]

/**
 * Адресите за сваляне и името, под което се записва всеки.
 *
 * От `snimki:imena` нататък е `[{url, file}]`: адресът е същият (dice,
 * EcoFlow), а файлът — смисленото име. Старият вид още се чете — името
 * тогава е последният сегмент на адреса.
 */
export const адресиЗаСваляне = (svali: СвалиСнимки | undefined | null): { url: string; file: string }[] => {
  const out: { url: string; file: string }[] = []
  const видяни = new Set<string>()
  const добави = (url: unknown, file?: unknown) => {
    if (typeof url !== 'string' || !url || видяни.has(url)) return
    const име = typeof file === 'string' && file ? file : fileNameFromUrl(url)
    if (!име) return
    видяни.add(url)
    out.push({ url, file: име })
  }
  if (Array.isArray(svali)) {
    for (const x of svali) if (x && typeof x === 'object') добави(x.url, x.file)
  } else if (svali && typeof svali === 'object') {
    for (const списък of [svali.galeriya, svali.sekcii]) for (const url of списък ?? []) добави(url)
  }
  return out
}

/** Имената на снимки в секциите — ключовете `image` и `icon`, както във вноса. */
export const именаВСекции = (node: unknown, out: Set<string>): void => {
  if (Array.isArray(node)) return node.forEach((n) => именаВСекции(n, out))
  if (!node || typeof node !== 'object') return
  for (const [k, v] of Object.entries(node)) {
    if ((k === 'image' || k === 'icon') && typeof v === 'string' && v.trim()) out.add(v)
    else именаВСекции(v, out)
  }
}

/**
 * Сменя имената навсякъде в съдържанието на един продукт — галерия,
 * секции, ключовете на `_prevod_nadpisi`, `_svali_snimki` (→ `[{url, file}]`).
 * Пипа подадения обект.
 */
export const смениИменатаВСъдържанието = (
  данни: Record<string, unknown>,
  карта: Map<string, string>,
): void => {
  const секции = (node: unknown): void => {
    if (Array.isArray(node)) return node.forEach(секции)
    if (!node || typeof node !== 'object') return
    const n = node as Record<string, unknown>
    for (const [k, v] of Object.entries(n)) {
      if ((k === 'image' || k === 'icon') && typeof v === 'string' && карта.has(v)) n[k] = карта.get(v)
      else секции(v)
    }
  }

  for (const g of (данни.galeriya as { file?: string }[] | undefined) ?? []) {
    if (g?.file && карта.has(g.file)) g.file = карта.get(g.file)
  }
  секции(данни.sekcii)
  const prevod = данни._prevod_nadpisi
  if (prevod && typeof prevod === 'object' && !Array.isArray(prevod)) {
    данни._prevod_nadpisi = Object.fromEntries(
      Object.entries(prevod as Record<string, unknown>).map(([k, v]) => [карта.get(k) ?? k, v]),
    )
  }
  if (данни._svali_snimki) {
    данни._svali_snimki = адресиЗаСваляне(данни._svali_snimki as СвалиСнимки).map((a) => ({
      url: a.url,
      file: карта.get(a.file) ?? a.file,
    }))
  }
}

/** JSON със същия отстъп и край на реда като оригинала — диффът показва само смяната. */
export const катоОригинала = (оригинал: string, данни: unknown): string => {
  const crlf = оригинал.includes('\r\n')
  const отстъп = оригинал.match(/\n([ \t]+)"/)?.[1] ?? '  '
  let out = JSON.stringify(данни, null, отстъп)
  if (crlf) out = out.replace(/\n/g, '\r\n')
  return оригинал.endsWith('\n') ? out + (crlf ? '\r\n' : '\n') : out
}
