/**
 * Последна резерва при загубен достъп: нова парола на потребител, направо в
 * базата, от сървъра (`task-zaklyuchen-dostap.md`, т. 4).
 *
 *   npm run admin:nova-parola <имейл>            — генерира парола и я изписва
 *   npm run admin:nova-parola <имейл> <парола>   — задава дадената
 *
 * Отключва и акаунта (броячът на неуспешни опити се нулира). Преди това
 * опитайте „Забравена парола?" на `/vhod` — тя праща имейл.
 */
import config from '@payload-config'
import { randomBytes } from 'crypto'
import { getPayload } from 'payload'

const args = process.argv.slice(2).filter((a) => !a.endsWith('.ts') && a !== 'run' && !a.startsWith('-'))
const [email, given] = args
if (!email || !email.includes('@')) {
  console.error('\n✗ Липсва имейл.\n  Пример: npm run admin:nova-parola anton@dice.bg\n')
  process.exit(1)
}
if (given !== undefined && given.length < 8) {
  console.error('\n✗ Паролата е под 8 знака.\n')
  process.exit(1)
}

const payload = await getPayload({ config })
const r = await payload.find({ collection: 'users', where: { email: { equals: email.toLowerCase() } }, limit: 1, depth: 0, overrideAccess: true })
const user = r.docs[0]
if (!user) {
  console.error(`\n✗ Няма потребител ${email}.\n`)
  process.exit(1)
}
const password = given ?? randomBytes(9).toString('base64url')
await payload.update({
  collection: 'users',
  id: user.id,
  data: { password, loginAttempts: 0, lockUntil: null } as never,
  overrideAccess: true,
  depth: 0,
})
console.log(`\n✓ Новата парола на ${user.email}${given ? ' е зададена.' : `: ${password}`}\n  Сменете я от „Акаунт" в админа след вход.\n`)
process.exit(0)
