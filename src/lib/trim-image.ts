/**
 * Изрязаният вариант на продуктова снимка — само видимата част, без
 * прозрачното поле около продукта.
 *
 * Защо: кутиите на картите са еднакви, но снимките идват с различно празно
 * поле — DELTA Pro 3 (3000 px, продуктът е 58 % от ширината) излизаше
 * по-малък от RIVER 3 Max (67 %), макар да е много по-голям. Картата
 * показва изрязания вариант с еднакво отстояние (`CardImage`) и продуктът
 * заема еднаква площ, каквото и поле да е имал оригиналът.
 *
 * Само за ИЗРЕЗИ — снимка с прозрачен фон. Сцена, снимка с бял фон или
 * PNG, чийто алфа канал е изцяло плътен, не получава вариант и се показва
 * както досега.
 *
 * Рамката е по алфа канала, не `sharp().trim()`: трим сравнява с цвета на
 * горния ляв пиксел (и RGB-то на прозрачните пиксели, което е случайно), а
 * тук въпросът е само „видимо ли е".
 *
 * Сървърен модул (sharp) — компонентите четат само полето `trimmed`.
 */
import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

export type TrimmedImage = {
  filename: string
  width: number
  height: number
  /** Малкото копие — плочките на формата за оферта (96 px, ×2 за ретина). */
  small: string
}

/** Пиксел с по-ниска непрозрачност е „празно поле" (сенки под 6 % не местят рамката). */
const ALPHA_VISIBLE = 16

/** Изрез е снимка, в която поне толкова от пикселите са прозрачни. Иначе е сцена със заоблени ъгли и т.н. */
const MIN_TRANSPARENT_SHARE = 0.05

/** По-дългата страна на варианта — картите и голямата карта в менюто са до ~400 CSS px. */
const MAX_SIDE = 900

/** По-дългата страна на малкото копие: плочка 96 px × 2 (ретина) с малко запас. */
export const SMALL_SIDE = 240

/** Името на варианта до оригинала: `delta-pro-3-1-trimmed-900x863.webp`. */
const trimmedName = (stem: string, w: number, h: number) => `${stem}-trimmed-${w}x${h}.webp`

/**
 * Прави варианта от байтовете на оригинала и го записва в `dir`.
 * Връща `null`, ако снимката не е изрез — тогава вариант няма.
 */
export const makeTrimmed = async (
  данни: Buffer | string,
  stem: string,
  dir: string,
): Promise<TrimmedImage | null> => {
  const base = sharp(данни).rotate()
  const meta = await base.metadata()
  // Без алфа канал или анимация — не е изрез.
  if (!meta.hasAlpha || (meta.pages ?? 1) > 1) return null

  const { data: alpha, info } = await base
    .clone()
    .extractChannel(3)
    .raw()
    .toBuffer({ resolveWithObject: true })
  const W = info.width
  const H = info.height

  let x0 = W
  let y0 = H
  let x1 = -1
  let y1 = -1
  let прозрачни = 0
  for (let y = 0; y < H; y++) {
    const row = y * W
    for (let x = 0; x < W; x++) {
      if (alpha[row + x]! < ALPHA_VISIBLE) {
        прозрачни++
        continue
      }
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }

  // Изцяло прозрачна или почти изцяло плътна — не е изрез.
  if (x1 < 0 || прозрачни / (W * H) < MIN_TRANSPARENT_SHARE) return null

  const { data, info: out } = await base
    .clone()
    .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
    .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 90 })
    .toBuffer({ resolveWithObject: true })

  const filename = trimmedName(stem, out.width, out.height)
  await fs.writeFile(path.join(dir, filename), data)

  // Малкото копие — от готовия вариант, не от оригинала: рамката е същата.
  const { data: sm, info: so } = await sharp(data)
    .resize({ width: SMALL_SIDE, height: SMALL_SIDE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80, alphaQuality: 90 })
    .toBuffer({ resolveWithObject: true })
  const small = trimmedName(stem, so.width, so.height)
  if (small !== filename) await fs.writeFile(path.join(dir, small), sm)

  return { filename, width: out.width, height: out.height, small }
}

/**
 * Трие файла на вариант. Папката идва като параметър нарочно: с
 * `path.join(<константа>, name)` в `Media.ts` Turbopack приема, че кодът
 * чете цялата `media/` (16 806 файла), и го пише като предупреждение при билд.
 */
export const removeTrimmedFile = async (dir: string, name: string | null | undefined) => {
  if (name) await fs.rm(path.join(dir, name), { force: true })
}

/** Празното поле — за запис, когато вариант няма (иначе `update` би оставил стария). */
export const NO_TRIMMED = { filename: null, width: null, height: null, small: null } as const
