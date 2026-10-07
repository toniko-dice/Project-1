/**
 * Локален пощенски „капан" за проверка на имейлите — САМО за разработка.
 *
 *   npm run mail:catcher        (слуша на 127.0.0.1:1025)
 *
 * В .env:  SMTP_HOST=127.0.0.1  SMTP_PORT=1025  SMTP_SECURE=false  (без потребител)
 *
 * Приема всяко писмо, НЕ го препраща никъде и го записва в `tmp-mail/`:
 * `<време>.eml` (суровото писмо), `.html` и `.txt` (разкодираните части) и
 * списък на приложенията. HTML-ът се отваря в браузъра — така се гледа
 * шаблонът. Вместо Mailpit (отделна програма) или Ethereal (външна услуга
 * с регистрация): само Node, без зависимости, без нищо извън машината.
 *
 * Не е пощенски сървър: без TLS, без вход, без проверки. Не го пускай на
 * сървъра.
 */
import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'

const PORT = Number(process.env.MAIL_CATCHER_PORT || 1025)
const DIR = path.resolve('tmp-mail')
fs.mkdirSync(DIR, { recursive: true })

/* ─────────── разкодиране на MIME (колкото за nodemailer) ─────────── */

const unfold = (h) => h.replace(/\r?\n[ \t]+/g, ' ')

/**
 * Кодираните думи (RFC 2047) се събират по байтове и чак после се
 * разкодират: nodemailer реже дългата тема насред буква на кирилицата.
 */
const decodeWords = (s) =>
  s.replace(/(=\?[^?]+\?[BQbq]\?[^?]*\?=)(\s+(?==\?))?/g, '$1').replace(/(?:=\?([^?]+)\?([BQbq])\?([^?]*)\?=)+/g, (run) => {
    let cs = 'utf-8'
    const bytes = []
    for (const m of run.matchAll(/=\?([^?]+)\?([BQbq])\?([^?]*)\?=/g)) {
      cs = m[1]
      const buf =
        m[2].toUpperCase() === 'B'
          ? Buffer.from(m[3], 'base64')
          : Buffer.from(m[3].replace(/_/g, ' ').replace(/=([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))), 'latin1')
      bytes.push(buf)
    }
    return new TextDecoder(cs).decode(Buffer.concat(bytes))
  })

const parseHeaders = (raw) => {
  const out = {}
  for (const line of unfold(raw).split(/\r?\n/)) {
    const i = line.indexOf(':')
    if (i > 0) out[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim()
  }
  return out
}

const qp = (s) =>
  Buffer.from(
    s.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))),
    'latin1',
  )

const decodeBody = (body, enc) => {
  const e = (enc || '').toLowerCase()
  if (e === 'base64') return Buffer.from(body.replace(/\s+/g, ''), 'base64')
  if (e === 'quoted-printable') return qp(body)
  return Buffer.from(body, 'utf8')
}

/** Обхожда частите; връща { html, text, attachments }. */
const walk = (raw, acc = { html: '', text: '', attachments: [] }) => {
  const sep = raw.search(/\r?\n\r?\n/)
  const head = parseHeaders(raw.slice(0, sep))
  const body = raw.slice(sep).replace(/^\r?\n\r?\n/, '')
  const type = head['content-type'] || 'text/plain'
  const boundary = /boundary="?([^";]+)"?/i.exec(type)?.[1]
  if (/^multipart\//i.test(type) && boundary) {
    for (const part of body.split(`--${boundary}`).slice(1)) {
      if (part.startsWith('--')) break
      walk(part.replace(/^\r?\n/, ''), acc)
    }
    return acc
  }
  const data = decodeBody(body, head['content-transfer-encoding'])
  const name = /filename="?([^";]+)"?/i.exec(head['content-disposition'] || '')?.[1]
  if (name || /attachment/i.test(head['content-disposition'] || '')) {
    acc.attachments.push({ name: decodeWords(name || 'файл'), type, bytes: data.length })
  } else if (/text\/html/i.test(type)) acc.html = data.toString('utf8')
  else if (/text\/plain/i.test(type)) acc.text = data.toString('utf8')
  return acc
}

/* ─────────── SMTP — минимумът, който nodemailer говори ─────────── */

const server = net.createServer((socket) => {
  socket.setEncoding('utf8')
  let buf = ''
  let inData = false
  let data = ''
  let from = ''
  const to = []
  const reply = (s) => socket.write(`${s}\r\n`)
  reply('220 mail-catcher ESMTP')

  socket.on('data', (chunk) => {
    buf += chunk
    let i
    while ((i = buf.indexOf('\r\n')) >= 0) {
      const line = buf.slice(0, i)
      buf = buf.slice(i + 2)
      if (inData) {
        if (line === '.') {
          inData = false
          save(from, [...to], data)
          data = ''
          to.length = 0
          reply('250 OK: уловено')
        } else data += (line.startsWith('..') ? line.slice(1) : line) + '\r\n'
        continue
      }
      const cmd = line.slice(0, 4).toUpperCase()
      if (cmd === 'EHLO') socket.write('250-mail-catcher\r\n250-8BITMIME\r\n250-SMTPUTF8\r\n250 SIZE 52428800\r\n')
      else if (cmd === 'HELO') reply('250 mail-catcher')
      else if (cmd === 'MAIL') (from = line.slice(10).trim()), reply('250 OK')
      else if (cmd === 'RCPT') to.push(line.slice(8).trim()), reply('250 OK')
      else if (cmd === 'DATA') (inData = true), reply('354 Край с <CRLF>.<CRLF>')
      else if (cmd === 'RSET') (to.length = 0), reply('250 OK')
      else if (cmd === 'NOOP') reply('250 OK')
      else if (cmd === 'QUIT') reply('221 Чао'), socket.end()
      else reply('502 Не се поддържа')
    }
  })
  socket.on('error', () => {})
})

const save = (from, to, raw) => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const base = path.join(DIR, stamp)
  fs.writeFileSync(`${base}.eml`, raw)
  const sep = raw.search(/\r?\n\r?\n/)
  const head = parseHeaders(raw.slice(0, sep))
  const parts = walk(raw)
  if (parts.html) fs.writeFileSync(`${base}.html`, parts.html)
  if (parts.text) fs.writeFileSync(`${base}.txt`, parts.text)
  const info = {
    from,
    to,
    subject: decodeWords(head.subject || ''),
    replyTo: decodeWords(head['reply-to'] || ''),
    attachments: parts.attachments,
  }
  fs.writeFileSync(`${base}.json`, JSON.stringify(info, null, 2))
  console.log(`✉ ${info.subject}\n  до: ${to.join(', ')}${info.replyTo ? ` · отговор към: ${info.replyTo}` : ''}${parts.attachments.length ? ` · приложения: ${parts.attachments.map((a) => `${a.name} (${a.bytes} B)`).join(', ')}` : ''}\n  → ${base}.html`)
}

server.listen(PORT, '127.0.0.1', () => console.log(`mail-catcher слуша на 127.0.0.1:${PORT} → ${DIR}`))
