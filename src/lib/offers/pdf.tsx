/**
 * PDF на оферта — `@react-pdf/renderer`, на сървъра, без браузър.
 *
 * A4 портретно, полета 15 mm, шрифт Inter (вграден, с кирилица —
 * `src/assets/fonts/`, OFL). Черно, сиво и бяло, както на сайта.
 *
 * Снимките в Медия са webp, а react-pdf чете само PNG и JPEG — затова всяка
 * се преобразува със Sharp в малък PNG при генерирането.
 *
 * Горният ред на таблицата се повтаря на всяка страница, по която минава
 * таблицата (`fixed` вътре в обвивката ѝ). Футърът — на всяка страница.
 *
 * Сървърен модул.
 */
import { Document, Font, Image, Page, renderToBuffer, StyleSheet, Text, View } from '@react-pdf/renderer'
import fs from 'fs/promises'
import path from 'path'
import type { Payload } from 'payload'
import sharp from 'sharp'

import { bgDate, eur, lineTotal, offerTotals, paymentText } from './calc'

const FONT_DIR = path.join(process.cwd(), 'src', 'assets', 'fonts')
let fontsReady = false
const registerFonts = () => {
  if (fontsReady) return
  Font.register({
    family: 'Inter',
    fonts: [
      { src: path.join(FONT_DIR, 'Inter-Regular.ttf'), fontWeight: 400 },
      { src: path.join(FONT_DIR, 'Inter-SemiBold.ttf'), fontWeight: 600 },
      { src: path.join(FONT_DIR, 'Inter-Bold.ttf'), fontWeight: 700 },
    ],
  })
  // Без пренасяне със тирета — българските думи не се режат по английски правила.
  Font.registerHyphenationCallback((w) => [w])
  fontsReady = true
}

/** Папката идва като параметър — иначе Turbopack приема, че се чете цялата `media/`. */
const readIn = (dir: string, name: string) => fs.readFile(path.join(dir, name))

type MediaDoc = {
  filename?: string | null
  mimeType?: string | null
  trimmed?: { filename?: string | null; small?: string | null } | null
  sizes?: Record<string, { filename?: string | null } | null> | null
}

/** Малък PNG от снимка в Медия; `null`, ако файлът го няма. */
const pngOf = async (mediaDir: string, m: MediaDoc | null | undefined, px: number): Promise<Buffer | null> => {
  if (!m) return null
  const name = m.trimmed?.small || m.sizes?.thumbnail?.filename || m.filename
  if (!name) return null
  try {
    const buf = await readIn(mediaDir, name)
    return await sharp(buf).resize({ width: px, height: px, fit: 'inside', withoutEnlargement: true }).png().toBuffer()
  } catch {
    return null
  }
}

const C = { ink: '#1a1a1a', muted: '#6b6b6b', line: '#d9d9d9', head: '#f2f2f2' }

const s = StyleSheet.create({
  page: { fontFamily: 'Inter', fontSize: 9, color: C.ink, paddingTop: 42, paddingBottom: 58, paddingHorizontal: 42 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 },
  tagline: { fontSize: 8, color: C.muted, marginTop: 5 },
  title: { fontSize: 20, fontWeight: 700, letterSpacing: 1, textAlign: 'right' },
  meta: { fontSize: 9, textAlign: 'right', marginTop: 3, color: C.muted },
  metaStrong: { color: C.ink, fontWeight: 600 },
  parties: { flexDirection: 'row', gap: 18, marginBottom: 16 },
  party: { flex: 1, borderTopWidth: 1, borderTopColor: C.ink, paddingTop: 6 },
  partyTitle: { fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  partyName: { fontSize: 10, fontWeight: 600, marginBottom: 2 },
  partyLine: { fontSize: 8.5, color: C.ink, lineHeight: 1.45 },
  intro: { fontSize: 9.5, marginBottom: 10 },
  th: { flexDirection: 'row', backgroundColor: C.head, borderTopWidth: 0.75, borderBottomWidth: 0.75, borderColor: C.line, paddingVertical: 5, fontSize: 7.5, fontWeight: 600, color: C.muted },
  tr: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 0.5, borderColor: C.line, minHeight: 34, paddingVertical: 3 },
  cNo: { width: 18, paddingLeft: 4 },
  cImg: { width: 38, alignItems: 'center' },
  cName: { flex: 1, paddingHorizontal: 6 },
  cQty: { width: 32, textAlign: 'right' },
  cPrice: { width: 78, textAlign: 'right', paddingLeft: 10 },
  cDisc: { width: 40, textAlign: 'right' },
  cSum: { width: 70, textAlign: 'right', paddingRight: 4 },
  sub: { fontSize: 7, color: C.muted, marginTop: 1.5 },
  totals: { alignSelf: 'flex-end', width: 220, marginTop: 10 },
  totRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totStrong: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderTopWidth: 1, borderColor: C.ink, marginTop: 2, fontSize: 11, fontWeight: 700 },
  h2: { fontSize: 10, fontWeight: 700, marginTop: 18, marginBottom: 6 },
  termRow: { flexDirection: 'row', marginBottom: 3.5 },
  termKey: { width: 130, color: C.muted },
  termVal: { flex: 1 },
  note: { marginTop: 14, fontSize: 8.5, color: C.muted },
  sign: { marginTop: 22, flexDirection: 'row', justifyContent: 'space-between', fontSize: 9 },
  footer: { position: 'absolute', left: 42, right: 42, bottom: 22, borderTopWidth: 0.75, borderColor: C.line, paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7.5, color: C.muted },
})

export type OfferForPdf = {
  number?: string | null
  date?: string | null
  validUntil?: string | null
  client?: {
    organization?: string | null
    eik?: string | null
    vatNumber?: string | null
    address?: string | null
    contactPerson?: string | null
    email?: string | null
    phone?: string | null
  } | null
  items?: {
    title?: string | null
    sku?: string | null
    ean?: string | null
    image?: MediaDoc | number | null
    quantity?: number | null
    unitPrice?: number | null
    discount?: number | null
  }[] | null
  terms?: {
    payment?: string | null
    paymentOther?: string | null
    deliveryTime?: string | null
    deliveryTerms?: string | null
    warranty?: string | null
    validityDays?: number | null
    vatRate?: number | null
    note?: string | null
  } | null
  preparedBy?: { name?: string | null; position?: string | null } | null
}

export type OfferSettingsForPdf = {
  company?: {
    name?: string | null
    eik?: string | null
    vatNumber?: string | null
    address?: string | null
    mol?: string | null
    phone?: string | null
    email?: string | null
    website?: string | null
  } | null
  bank?: { iban?: string | null; bic?: string | null; bankName?: string | null } | null
}

const Line = ({ k, v }: { k: string; v?: string | null }) =>
  v && v.trim() ? (
    <Text style={s.partyLine}>
      <Text style={{ color: C.muted }}>{k}: </Text>
      {v}
    </Text>
  ) : null

const Term = ({ k, v }: { k: string; v?: string | null }) =>
  v && v.trim() ? (
    <View style={s.termRow} wrap={false}>
      <Text style={s.termKey}>{k}</Text>
      <Text style={s.termVal}>{v}</Text>
    </View>
  ) : null

const pct = (n: number | null | undefined) => (n ? `${String(n).replace('.', ',')}%` : '—')

const OfferDocument = ({
  offer,
  settings,
  logo,
  images,
}: {
  offer: OfferForPdf
  settings: OfferSettingsForPdf
  logo: Buffer | null
  images: (Buffer | null)[]
}) => {
  const co = settings.company ?? {}
  const cl = offer.client ?? {}
  const items = offer.items ?? []
  const vatRate = Number(offer.terms?.vatRate ?? 20)
  const t = offerTotals(items, vatRate)
  const bank = settings.bank ?? {}
  const bankText = [bank.iban && `IBAN: ${bank.iban}`, bank.bic && `BIC: ${bank.bic}`, bank.bankName && `банка: ${bank.bankName}`]
    .filter(Boolean)
    .join('; ')
  const validity = [
    offer.terms?.validityDays ? `${offer.terms.validityDays} дни` : '',
    offer.validUntil ? `до ${bgDate(offer.validUntil)}` : '',
  ]
    .filter(Boolean)
    .join(', ')
  const footer = [co.name, co.website, co.email, co.phone].filter(Boolean).join(' · ')

  return (
    <Document title={`Оферта ${offer.number ?? ''}`} author={co.name ?? 'EcoFlow България'} language="bg">
      <Page size="A4" style={s.page}>
        {/* 1. Горе */}
        <View style={s.header}>
          <View>
            {logo ? <Image src={{ data: logo, format: 'png' }} style={{ height: 16, width: 'auto' }} /> : <Text style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2 }}>ECOFLOW</Text>}
            <Text style={s.tagline}>Официален дистрибутор за България</Text>
          </View>
          <View>
            <Text style={s.title}>ОФЕРТА</Text>
            <Text style={s.meta}>
              № <Text style={s.metaStrong}>{offer.number ?? '—'}</Text>
            </Text>
            <Text style={s.meta}>Дата: {bgDate(offer.date)}</Text>
            {offer.validUntil ? <Text style={s.meta}>Валидна до: {bgDate(offer.validUntil)}</Text> : null}
          </View>
        </View>

        {/* 2. Доставчик / Клиент */}
        <View style={s.parties}>
          <View style={s.party}>
            <Text style={s.partyTitle}>Доставчик</Text>
            {co.name ? <Text style={s.partyName}>{co.name}</Text> : null}
            <Line k="ЕИК" v={co.eik} />
            <Line k="ДДС №" v={co.vatNumber} />
            <Line k="Адрес" v={co.address} />
            <Line k="МОЛ" v={co.mol} />
            <Line k="Телефон" v={co.phone} />
            <Line k="Имейл" v={co.email} />
          </View>
          <View style={s.party}>
            <Text style={s.partyTitle}>Клиент</Text>
            {cl.organization ? <Text style={s.partyName}>{cl.organization}</Text> : null}
            <Line k="ЕИК/БУЛСТАТ" v={cl.eik} />
            <Line k="ДДС №" v={cl.vatNumber} />
            <Line k="Адрес" v={cl.address} />
            <Line k="Лице за контакт" v={cl.contactPerson} />
            <Line k="Имейл" v={cl.email} />
            <Line k="Телефон" v={cl.phone} />
          </View>
        </View>

        {/* 3. */}
        <Text style={s.intro}>Благодарим за запитването. Предлагаме ви следните продукти:</Text>

        {/* 4. Таблицата — горният ред се повтаря на всяка страница, по която минава */}
        <View>
          <View style={s.th} fixed>
            <Text style={s.cNo}>№</Text>
            <Text style={s.cImg}> </Text>
            <Text style={s.cName}>Продукт</Text>
            <Text style={s.cQty}>Кол.</Text>
            <Text style={s.cPrice}>Ед. цена без ДДС</Text>
            <Text style={s.cDisc}>Отст.</Text>
            <Text style={s.cSum}>Сума без ДДС</Text>
          </View>
          {items.map((it, i) => (
            <View key={i} style={s.tr} wrap={false}>
              <Text style={s.cNo}>{i + 1}</Text>
              <View style={s.cImg}>
                {images[i] ? <Image src={{ data: images[i]!, format: 'png' }} style={{ width: 30, height: 30, objectFit: 'contain' }} /> : null}
              </View>
              <View style={s.cName}>
                <Text style={{ fontWeight: 600 }}>{it.title ?? ''}</Text>
                {it.sku || it.ean ? (
                  <Text style={s.sub}>{[it.sku && `SKU ${it.sku}`, it.ean && `EAN ${it.ean}`].filter(Boolean).join(' · ')}</Text>
                ) : null}
              </View>
              <Text style={s.cQty}>{it.quantity ?? 0}</Text>
              <Text style={s.cPrice}>{eur(Number(it.unitPrice) || 0)}</Text>
              <Text style={s.cDisc}>{pct(it.discount)}</Text>
              <Text style={s.cSum}>{eur(lineTotal(it))}</Text>
            </View>
          ))}
        </View>

        {/* 5. Общо */}
        <View style={s.totals} wrap={false}>
          <View style={s.totRow}>
            <Text>Общо без ДДС</Text>
            <Text>{eur(t.subtotal)}</Text>
          </View>
          <View style={s.totRow}>
            <Text>ДДС {String(vatRate).replace('.', ',')}%</Text>
            <Text>{eur(t.vat)}</Text>
          </View>
          <View style={s.totStrong}>
            <Text>Общо с ДДС</Text>
            <Text>{eur(t.total)}</Text>
          </View>
        </View>

        {/* 6. Условия */}
        <View wrap={false}>
          <Text style={s.h2}>Условия</Text>
          <Term k="Плащане" v={paymentText(offer.terms?.payment, offer.terms?.paymentOther)} />
          <Term k="Срок на доставка" v={offer.terms?.deliveryTime} />
          <Term k="Условия на доставка" v={offer.terms?.deliveryTerms} />
          <Term k="Гаранция" v={offer.terms?.warranty} />
          <Term k="Валидност на офертата" v={validity} />
          <Term k="Банкова сметка" v={bankText} />
        </View>

        {/* 7. */}
        {offer.terms?.note ? <Text style={s.note}>{offer.terms.note}</Text> : null}

        {/* 8. */}
        <View style={s.sign} wrap={false}>
          <Text>
            Изготвил: {[offer.preparedBy?.name, offer.preparedBy?.position].filter(Boolean).join(', ') || '—'}
          </Text>
          {co.mol ? <Text>МОЛ: {co.mol}</Text> : null}
        </View>

        {/* 9. Футър на всяка страница */}
        <View style={s.footer} fixed>
          <Text>{footer}</Text>
          <Text render={({ pageNumber, totalPages }) => `Страница ${pageNumber} от ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

/**
 * PDF-ът на офертата като байтове. `offer` е прочетен с `depth: 1`
 * (снимките на редовете — обекти от Медия).
 */
export const renderOfferPdf = async (payload: Payload, offer: OfferForPdf): Promise<Buffer> => {
  registerFonts()
  const mediaDir = path.resolve(process.cwd(), 'media')
  const [settings, header] = await Promise.all([
    payload.findGlobal({ slug: 'offer-settings', depth: 0 }) as Promise<OfferSettingsForPdf>,
    payload.findGlobal({ slug: 'header', depth: 1 }) as Promise<{ logo?: MediaDoc | number | null }>,
  ])
  const logoDoc = header.logo && typeof header.logo === 'object' ? header.logo : null
  // Логото — от оригинала (широко, PNG), не от изрязания вариант.
  const logo = logoDoc?.filename
    ? await readIn(mediaDir, logoDoc.filename)
        .then((b) => sharp(b).resize({ height: 64 }).png().toBuffer())
        .catch(() => null)
    : null
  const images = await Promise.all(
    (offer.items ?? []).map((it) => pngOf(mediaDir, typeof it.image === 'object' ? it.image : null, 96)),
  )
  return renderToBuffer(<OfferDocument offer={offer} settings={settings} logo={logo} images={images} />)
}
