/**
 * Тест на четенето на XML-а на dice.bg (`task-dice-xml-poleta.md`, т. 5.4) —
 * без база: парсерът, цената и зачертаната, наличността, EAN-ите и
 * съпоставянето с продуктите. Примерният файл е във формата на истинския.
 *
 *   npm run test:dice
 */
import assert from 'node:assert/strict'

import { съпостави } from '../src/lib/dice/match'
import { eanКандидати, eanНередност, finalPrice, mapAvailability, parseDiceXml } from '../src/lib/dice/parse'

const ред = (o: Record<string, string>) =>
  `<Product>${Object.entries({ ProductNumber: '', Manufacturer: 'EcoFlow', ...o })
    .map(([k, v]) => (v ? `<${k}>${v}</${k}>` : `<${k}/>`))
    .join('')}</Product>`

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0"><products>
${[
  // цена: намаление
  ред({ Identifier: '78725', Name: 'Намаление', SpecialPrice: '159.00', Price: '179.00', quantity: '3', ean: '4895251667388', stock: 'in stock' }),
  // цена: без намаление
  ред({ Identifier: '1002', Name: 'Без намаление', SpecialPrice: '', Price: '99.90', quantity: '5', ean: '4895251600002', stock: 'in stock' }),
  // цена: SpecialPrice ≥ Price
  ред({ Identifier: '60687', Name: 'Solar Tracker', SpecialPrice: '1699.00', Price: '1533.36', quantity: '1', ean: '4895251600003', stock: 'in stock' }),
  // цена: невалидна
  ред({ Identifier: '1004', Name: 'Без цена', SpecialPrice: '', Price: '', quantity: '1', ean: '4895251600004', stock: 'in stock' }),
  // наличност: in stock, 0 броя
  ред({ Identifier: '1005', Name: 'Нула броя', SpecialPrice: '', Price: '10', quantity: '0', ean: '4895251600005', stock: 'in stock' }),
  // наличност: out of stock
  ред({ Identifier: '1006', Name: 'Изчерпан', SpecialPrice: '', Price: '10', quantity: '2', ean: '4895251600006', stock: 'out of stock' }),
  // наличност: непозната
  ред({ Identifier: '1007', Name: 'Непозната', SpecialPrice: '', Price: '10', quantity: '2', ean: '4895251600007', stock: 'maybe' }),
  // наличност: празна → по броя
  ред({ Identifier: '1008', Name: 'Празна', SpecialPrice: '', Price: '10', quantity: '4', ean: '4895251600008', stock: '' }),
  // съпоставяне: по Identifier, EAN празен
  ред({ Identifier: '72886', Name: 'Drain Pipe', SpecialPrice: '', Price: '20', quantity: '1', ean: '', stock: 'in stock' }),
  // съпоставяне: по Identifier, EAN е код
  ред({ Identifier: '60759', Name: 'Waterproof Bag', SpecialPrice: '', Price: '30', quantity: '1', ean: 'BMR330', stock: 'in stock' }),
  // съпоставяне: два EAN в едно поле — по втория
  ред({ Identifier: '9999', Name: 'Списък EAN', SpecialPrice: '', Price: '40', quantity: '1', ean: '4895251600011, 5895251639866', stock: 'in stock' }),
  // съпоставяне: друг артикул със същия EAN като съвпаднал по Identifier → пропуснат (по-рано във файла)
  ред({ Identifier: '78570', Name: 'DELTA 3 Max Plus (друг)', SpecialPrice: '', Price: '1', quantity: '1', ean: '4895251600012', stock: 'in stock' }),
  ред({ Identifier: '74921', Name: 'DELTA 3 Max Plus', SpecialPrice: '1399', Price: '1533.36', quantity: '2', ean: '4895251600012', stock: 'in stock' }),
  // съпоставяне: наставка → само по Identifier (непознат) → ненамерен
  ред({ Identifier: '5555', Name: '400W нарушена', SpecialPrice: '', Price: '1', quantity: '1', ean: '4895251600013-нарушена', stock: 'in stock' }),
  // съпоставяне: два реда само по EAN към един продукт → грешка за втория
  ред({ Identifier: '7001', Name: 'Конзола', SpecialPrice: '', Price: '5', quantity: '1', ean: '4895251600014', stock: 'in stock' }),
  ред({ Identifier: '7002', Name: 'Конзола 2', SpecialPrice: '', Price: '5', quantity: '1', ean: '4895251600014', stock: 'in stock' }),
  // нередности
  ред({ Identifier: '72549', Name: '14 цифри', SpecialPrice: '', Price: '5', quantity: '1', ean: '48952516643764', stock: 'in stock' }),
  ред({ Identifier: '56916', Name: 'Водеща нула', SpecialPrice: '', Price: '5', quantity: '1', ean: '04897082663089', stock: 'in stock' }),
].join('\n')}
</products></rss>`

const rows = parseDiceXml(XML)
const поКод = (sku: string) => rows.find((r) => r.sku === sku)!
let n = 0
const провери = (име: string, f: () => void) => {
  f()
  n++
  console.log(`✓ ${име}`)
}

провери('редовете и полетата', () => {
  assert.equal(rows.length, 18)
  const r = поКод('78725')
  assert.equal(r.name, 'Намаление')
  assert.equal(r.brand, 'EcoFlow')
  assert.equal(r.regularPrice, 179)
  assert.equal(r.specialPrice, 159)
  assert.equal(r.qty, 3)
  assert.equal(r.availabilityRaw, 'in stock')
})

провери('цена: SpecialPrice < Price → SpecialPrice, зачертана Price', () =>
  assert.deepEqual(finalPrice(поКод('78725')), { ok: true, price: 159, compareAtPrice: 179, warning: null }))
провери('цена: SpecialPrice празна → Price, без зачертана', () =>
  assert.deepEqual(finalPrice(поКод('1002')), { ok: true, price: 99.9, compareAtPrice: null, warning: null }))
провери('цена: SpecialPrice ≥ Price → Price, без зачертана, предупреждение', () => {
  const f = finalPrice(поКод('60687'))
  assert.ok(f.ok && f.price === 1533.36 && f.compareAtPrice === null && f.warning)
})
провери('цена: Price празна → грешка', () => assert.equal(finalPrice(поКод('1004')).ok, false))

провери('наличност: in stock, 0 броя → в наличност', () => assert.equal(mapAvailability(поКод('1005')), 'in-stock'))
провери('наличност: out of stock → изчерпан', () => assert.equal(mapAvailability(поКод('1006')), 'out-of-stock'))
провери('наличност: друга стойност → непозната', () => assert.equal(mapAvailability(поКод('1007')), 'unknown'))
провери('наличност: празна → по броя', () => assert.equal(mapAvailability(поКод('1008')), 'in-stock'))

провери('EAN: интервали, списък, наставка, код', () => {
  assert.deepEqual(eanКандидати('4895251639859, 5895251639866'), ['4895251639859', '5895251639866'])
  assert.deepEqual(eanКандидати('4895251600013-нарушена'), [])
  assert.deepEqual(eanКандидати('4895251600712-1'), [])
  assert.deepEqual(eanКандидати('BMR330'), [])
  assert.deepEqual(eanКандидати('153077'), [])
})
провери('нередности в EAN', () => {
  assert.equal(eanНередност(''), 'няма EAN')
  assert.equal(eanНередност('BMR330'), 'код вместо EAN')
  assert.equal(eanНередност('DELTAProEB-US'), 'код вместо EAN')
  assert.equal(eanНередност('4895251639859, 5895251639866'), 'няколко EAN в едно поле')
  assert.equal(eanНередност('04897082663089'), 'водеща нула')
  assert.match(eanНередност('48952516643764') ?? '', /14 цифри/)
  assert.equal(eanНередност('4895251600013-нарушена'), null)
  assert.equal(eanНередност('4895251667388'), null)
})

const products = [
  { id: 1, title: '110W панел', sku: '78725', ean: '4895251667388' },
  { id: 2, title: 'Drain Pipe', sku: '72886', ean: '' },
  { id: 3, title: 'Waterproof Bag', sku: '60759', ean: '' },
  { id: 4, title: 'RIVER 3 Max Plus (Wireless)', sku: '', ean: '9000000000001', ean2: '5895251639866' },
  { id: 5, title: 'DELTA 3 Max Plus', sku: '74921', ean: '4895251600012' },
  { id: 6, title: '400W панел', sku: '', ean: '4895251600013' },
  { id: 7, title: 'Power Kits Console', sku: '', ean: '4895251600014' },
]
const m = съпостави(rows, products)
const съвпадна = (sku: string) => m.matches.find((x) => x.row.sku === sku)

провери('съпоставяне: по Identifier', () => assert.equal(съвпадна('78725')?.by, 'sku'))
провери('съпоставяне: по Identifier при празен EAN и при код', () => {
  assert.equal(съвпадна('72886')?.product.id, 2)
  assert.equal(съвпадна('60759')?.product.id, 3)
})
провери('съпоставяне: по втория EAN от списъка (ean2 на продукта)', () => {
  assert.equal(съвпадна('9999')?.product.id, 4)
  assert.equal(съвпадна('9999')?.by, 'ean')
})
провери('дубли: друг артикул със същия EAN → пропуснат, не грешка', () => {
  assert.equal(съвпадна('74921')?.product.id, 5)
  assert.equal(съвпадна('78570'), undefined)
  assert.equal(m.skipped.length, 1)
  assert.match(m.skipped[0]!, /78570/)
})
провери('наставка: не се търси по EAN → ненамерен', () => {
  assert.equal(съвпадна('5555'), undefined)
  assert.ok(m.notFound.some((r) => r.sku === '5555'))
})
провери('два реда само по EAN към един продукт → грешка за втория', () => {
  assert.equal(съвпадна('7001')?.product.id, 7)
  assert.equal(съвпадна('7002'), undefined)
  assert.equal(m.errors.length, 1)
  assert.match(m.errors[0]!, /7002/)
})

console.log(`\nВсички ${n} проверки минаха.`)
