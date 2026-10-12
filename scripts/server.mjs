/**
 * Командите към сървъра (`task-kachvane-server.md`, т. 9–10). Главната база
 * е на СЪРВЪРА — локалната е само за тест на нов код.
 *
 *   npm run deploy                          — обновяване: scripts/deploy.sh на сървъра
 *   npm run db:kachi-na-sarvara             — локалната база + media/ + quote-files/ → сървъра
 *                                             (само с ALLOW_DB_UPLOAD=true в .env НА СЪРВЪРА)
 *   npm run db:svali-ot-sarvara             — базата и файловете на сървъра → локално
 *   npm run import:product:server <slug>    — внос на продукт на сървъра (с архив)
 *   npm run import:page:server <slug>       — внос на страница на сървъра (с архив)
 *   npm run faq:dobavi:server <файл>        — въпросите от файла на сървъра (с архив)
 *   npm run na-sarvara <npm скрипт> [арг.]  — който и да е npm скрипт на сървъра (с архив)
 *
 * Връзката — SSH с ключа на собственика (на Windows — `ssh.exe` на системата,
 * за да ползва агента с отключения ключ). Сървърът и папката — от
 * `ECOFLOW_SERVER` / `ECOFLOW_DIR`, иначе по подразбиране долу.
 *
 * Съдържанието за вноса отива в `/srv/ecoflow-bg/content-server/` (извън
 * git) и вносът там се пуска с `CONTENT_ROOT=content-server` — така
 * `git pull` при обновяване никога не се спъва в променени файлове.
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs'
import path from 'node:path'
import { createInterface } from 'node:readline/promises'

const SERVER = process.env.ECOFLOW_SERVER || 'ecoflow@91.212.13.155'
const DIR = process.env.ECOFLOW_DIR || '/srv/ecoflow-bg'
const ROOT = path.resolve(import.meta.dirname, '..')
const win = process.platform === 'win32'
const sysBin = (name) => {
  const p = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', ...(name === 'tar' ? [] : ['OpenSSH']), `${name}.exe`)
  return win && existsSync(p) ? p : name
}
const SSH = process.env.SSH_BIN || sysBin('ssh')
const SCP = process.env.SCP_BIN || sysBin('scp')
const TAR = process.env.TAR_BIN || sysBin('tar')

const [, , команда, ...арг] = process.argv
const stamp = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const стоп = (msg) => {
  console.error(`\n✖ ${msg}`)
  process.exit(1)
}
const q = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`

/** Команда на сървъра; изходът — на живо. Връща кода. */
const наСървъра = (cmd, { quiet = false } = {}) =>
  spawnSync(SSH, ['-o', 'BatchMode=yes', SERVER, cmd], { stdio: quiet ? 'pipe' : 'inherit', encoding: 'utf8' })

const питай = async (въпрос) => {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const отговор = (await rl.question(`${въпрос} (да/не): `)).trim().toLowerCase()
  rl.close()
  return отговор === 'да' || отговор === 'yes' || отговор === 'y'
}

/** Локални папки/файлове → сървъра (tar през ssh), в `целева` (относително от DIR). */
const качи = (пътища, целева) =>
  new Promise((resolve, reject) => {
    const tar = spawn(TAR, ['-c', '-f', '-', ...пътища], { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] })
    const ssh = spawn(SSH, ['-o', 'BatchMode=yes', SERVER, `mkdir -p ${q(`${DIR}/${целева}`)} && tar -x -f - -C ${q(`${DIR}/${целева}`)}`], {
      stdio: ['pipe', 'inherit', 'inherit'],
    })
    tar.stdout.pipe(ssh.stdin)
    ssh.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`качването спря (код ${code})`))))
    tar.on('error', reject)
  })

/** Папки от сървъра → локално, в `целева`. */
const свали = (пътища, целева) =>
  new Promise((resolve, reject) => {
    mkdirSync(целева, { recursive: true })
    const ssh = spawn(SSH, ['-o', 'BatchMode=yes', SERVER, `cd ${q(DIR)} && tar -c -f - ${пътища.map(q).join(' ')}`], {
      stdio: ['ignore', 'pipe', 'inherit'],
    })
    const tar = spawn(TAR, ['-x', '-f', '-', '-C', целева], { stdio: ['pipe', 'inherit', 'inherit'] })
    ssh.stdout.pipe(tar.stdin)
    tar.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`свалянето спря (код ${code})`))))
    ssh.on('error', reject)
  })

/** Консистентно копие на локалната база (`VACUUM INTO`, и докато dev сървърът работи). */
const копиеНаБазата = async (към) => {
  const { DatabaseSync } = await import('node:sqlite')
  rmSync(към, { force: true })
  const db = new DatabaseSync(path.join(ROOT, 'ecoflow.db'))
  db.exec(`VACUUM INTO '${към.replace(/'/g, "''")}'`)
  db.close()
}

/** Архив на сървъра с етикет, после командата, после опресняване. */
const сАрхив = (етикет, cmd) =>
  наСървъра(`cd ${q(DIR)} && npx payload run src/backup-now.ts -- ${q(етикет)} && ${cmd}`)

const опресни = () =>
  наСървъра(`cd ${q(DIR)} && curl -s -o /dev/null -w 'опресняване: %{http_code}\\n' -X POST -H "x-revalidate-key: $(grep -E '^PAYLOAD_SECRET=' .env | cut -d= -f2-)" http://127.0.0.1:3000/api/products/revalidate`)

const КОМАНДИ = {
  /*
    Откачено от SSH сесията (`setsid nohup`): прекъсната връзка не убива
    билда по средата. Тук само се следи логът (`deploy-log/<време>.log` на
    сървъра); ако връзката падне, обновяването продължава — логът и кодът
    на изхода (`.exit`) остават там. `flock` — два deploy-а наведнъж не
    тръгват. `NODE_OPTIONS` — таван на JS паметта на билда.
  */
  async deploy() {
    const лог = `deploy-log/${new Date().toISOString().replace(/[:.]/g, '-')}.log`
    /*
      `cd` — отделна команда: в `cd … && setsid … &` знакът `&` пуска във
      фона ЦЯЛАТА верига и чакането остава в домашната папка — не намира
      лога и виси вечно (12 октомври 2026). Чака се процесът (`kill -0`),
      не само файлът `.exit`: убит билд (памет) не би го написал.
    */
    const r = наСървъра(
      `cd ${q(DIR)} || exit 1; mkdir -p deploy-log; ` +
        `setsid nohup bash -c 'exec 9>deploy-log/.lock; flock -n 9 || { echo "Друг deploy още върви."; echo 75 > ${лог}.exit; exit 75; }; ` +
        `NODE_OPTIONS=--max-old-space-size=4096 bash scripts/deploy.sh; echo $? > ${лог}.exit' > ${лог} 2>&1 < /dev/null & P=$!; ` +
        `echo "лог на сървъра: ${DIR}/${лог}"; tail -n +1 -f ${лог} & T=$!; ` +
        `while kill -0 $P 2>/dev/null; do sleep 2; done; sleep 1; kill $T; ` +
        `[ -f ${лог}.exit ] || { echo "Обновяването спря без код на изхода (убит процес?)."; exit 1; }; exit "$(cat ${лог}.exit)"`,
    )
    if (r.status !== 0) стоп('Обновяването спря — старата версия продължава да работи. Виж изхода горе.')
  },

  async 'db-kachi'() {
    const флаг = наСървъра(`grep -qx 'ALLOW_DB_UPLOAD=true' ${q(`${DIR}/.env`)}`, { quiet: true })
    if (флаг.status !== 0) {
      стоп('Главната база е на сървъра — редакциите там ще се загубят. Ако наистина трябва, сложи ALLOW_DB_UPLOAD=true ръчно.')
    }
    if (!(await питай('Сигурни ли сте? Базата на сървъра ще бъде заменена'))) стоп('Отказано.')
    const tmp = path.join(ROOT, 'tmp-kachvane.db')
    console.log('→ копие на локалната база')
    await копиеНаБазата(tmp)
    const t = stamp()
    console.log('→ архив на сървърната база и спиране на сайта')
    let r = наСървъра(
      `cd ${q(DIR)} && mkdir -p backups && { [ ! -f ecoflow.db ] || sqlite3 ecoflow.db ".backup backups/predi-kachvane-${t}.db"; } && sudo /usr/bin/systemctl stop ecoflow`,
    )
    if (r.status !== 0) стоп('Архивът на сървъра не мина — нищо не е сменено.')
    try {
      console.log('→ качване на базата')
      if (spawnSync(SCP, ['-o', 'BatchMode=yes', tmp, `${SERVER}:${DIR}/ecoflow.db.upload`], { stdio: 'inherit' }).status !== 0) {
        throw new Error('scp на базата не мина')
      }
      console.log('→ качване на media/ и quote-files/')
      await качи(['media', ...(existsSync(path.join(ROOT, 'quote-files')) ? ['quote-files'] : [])], `upload-${t}`)
      r = наСървъра(
        [
          `cd ${q(DIR)}`,
          `rm -f ecoflow.db-journal ecoflow.db-wal ecoflow.db-shm`,
          `mv ecoflow.db.upload ecoflow.db && chmod 600 ecoflow.db`,
          `{ [ ! -d media ] || mv media media.predi-${t}; } && mv upload-${t}/media media && chmod 750 media`,
          `{ [ ! -d upload-${t}/quote-files ] || { { [ ! -d quote-files ] || mv quote-files quote-files.predi-${t}; } && mv upload-${t}/quote-files quote-files && chmod 700 quote-files; }; }`,
          `rmdir upload-${t} 2>/dev/null || true`,
        ].join(' && '),
      )
      if (r.status !== 0) throw new Error('замяната на сървъра не мина')
    } finally {
      rmSync(tmp, { force: true })
      наСървъра('sudo /usr/bin/systemctl start ecoflow')
    }
    console.log(`\n✓ Качено. Старите — backups/predi-kachvane-${t}.db и media.predi-${t}/ на сървъра.`)
    console.log('  Махнете ALLOW_DB_UPLOAD=true от .env на сървъра.')
  },

  async 'db-svali'() {
    if (!(await питай('Локалната база, media/ и quote-files/ ще бъдат заменени с тези от сървъра. Продължаваме?'))) стоп('Отказано.')
    const t = stamp()
    const tmpDir = path.join(ROOT, `tmp-svali-${t}`)
    mkdirSync(path.join(ROOT, 'backups'), { recursive: true })
    console.log('→ архив на локалната база')
    await копиеНаБазата(path.join(ROOT, 'backups', `lokalna-predi-svalyane-${t}.db`))
    console.log('→ копие на сървърната база и файловете')
    const r = наСървъра(`cd ${q(DIR)} && sqlite3 ecoflow.db ".backup /tmp/ecoflow-svali-${t}.db"`)
    if (r.status !== 0) стоп('Копието на сървъра не мина — нищо не е сменено.')
    mkdirSync(tmpDir, { recursive: true })
    if (spawnSync(SCP, ['-o', 'BatchMode=yes', `${SERVER}:/tmp/ecoflow-svali-${t}.db`, path.join(tmpDir, 'ecoflow.db')], { stdio: 'inherit' }).status !== 0) {
      стоп('scp не мина — нищо не е сменено.')
    }
    наСървъра(`rm -f /tmp/ecoflow-svali-${t}.db`)
    await свали(['media', 'quote-files'], tmpDir)
    console.log('→ замяна')
    try {
      // На Windows отворена база не се преименува — значи dev сървърът работи.
      renameSync(path.join(ROOT, 'ecoflow.db'), path.join(ROOT, 'backups', `ecoflow-predi-svalyane-${t}.db`))
    } catch {
      стоп(`Локалната база е заета — спрете npm run dev и пуснете пак. Свалените файлове са в ${tmpDir}.`)
    }
    for (const f of ['ecoflow.db-journal', 'ecoflow.db-wal', 'ecoflow.db-shm']) rmSync(path.join(ROOT, f), { force: true })
    renameSync(path.join(tmpDir, 'ecoflow.db'), path.join(ROOT, 'ecoflow.db'))
    for (const d of ['media', 'quote-files']) {
      if (!existsSync(path.join(tmpDir, d))) continue
      if (existsSync(path.join(ROOT, d))) renameSync(path.join(ROOT, d), path.join(ROOT, `${d}.predi-svalyane-${t}`))
      renameSync(path.join(tmpDir, d), path.join(ROOT, d))
    }
    rmSync(tmpDir, { recursive: true, force: true })
    console.log(`\n✓ Свалено. Старата локална база — backups/ecoflow-predi-svalyane-${t}.db; старите папки — media.predi-svalyane-${t}/ и т.н.`)
  },

  async 'import-product'() {
    const slug = арг.find((a) => !a.startsWith('-'))
    if (!slug || !existsSync(path.join(ROOT, 'content', slug, 'sadarzhanie.json'))) стоп('Няма content/<slug>/sadarzhanie.json.')
    const пътища = [`content/${slug}`, ...(existsSync(path.join(ROOT, 'content', 'snimki')) ? ['content/snimki'] : [])]
    console.log(`→ качване: ${пътища.join(', ')}`)
    await качи(пътища, 'content-server-upload')
    наСървъра(`cd ${q(DIR)} && mkdir -p content-server && cp -r content-server-upload/content/. content-server/ && rm -rf content-server-upload`)
    // `import:all -- --only` прави архив сам (import:product — не).
    const r = наСървъра(`cd ${q(DIR)} && CONTENT_ROOT=content-server npm run import:all -- --only ${q(slug)} ${арг.filter((a) => a.startsWith('-')).map(q).join(' ')}`)
    if (r.status !== 0) стоп('Вносът на сървъра не мина.')
    опресни()
  },

  async 'import-page'() {
    const slug = арг.find((a) => !a.startsWith('-'))
    if (!slug || !existsSync(path.join(ROOT, 'content', 'stranici', slug, 'sadarzhanie.json'))) стоп('Няма content/stranici/<slug>/sadarzhanie.json.')
    const пътища = [`content/stranici/${slug}`, ...(existsSync(path.join(ROOT, 'content', 'snimki')) ? ['content/snimki'] : [])]
    console.log(`→ качване: ${пътища.join(', ')}`)
    await качи(пътища, 'content-server-upload')
    наСървъра(`cd ${q(DIR)} && mkdir -p content-server && cp -r content-server-upload/content/. content-server/ && rm -rf content-server-upload`)
    // import:page прави архив сам преди записа.
    const r = наСървъра(`cd ${q(DIR)} && CONTENT_ROOT=content-server npm run import:page -- ${q(slug)} ${арг.filter((a) => a.startsWith('-')).map(q).join(' ')}`)
    if (r.status !== 0) стоп('Вносът на сървъра не мина.')
    опресни()
  },

  async 'faq-dobavi'() {
    const файл = арг.find((a) => !a.startsWith('-'))
    if (!файл || !existsSync(path.resolve(ROOT, файл))) стоп('Няма такъв файл.')
    const rel = path.relative(ROOT, path.resolve(ROOT, файл)).split(path.sep).join('/')
    if (rel.startsWith('..')) стоп('Файлът трябва да е в проекта.')
    await качи([rel], 'content-server-upload')
    const име = `faq-${stamp()}.json`
    наСървъра(`cd ${q(DIR)} && mkdir -p content-server && cp ${q(`content-server-upload/${rel}`)} ${q(`content-server/${име}`)} && rm -rf content-server-upload`)
    // faq:dobavi прави архив сам; обновява и content-server/<slug>/sadarzhanie.json.
    const r = наСървъра(`cd ${q(DIR)} && CONTENT_ROOT=content-server npm run faq:dobavi -- ${q(`content-server/${име}`)}`)
    if (r.status !== 0) стоп('Вносът на сървъра не мина.')
    опресни()
  },

  async 'na-sarvara'() {
    const [скрипт, ...рест] = арг
    if (!скрипт) стоп('Кой npm скрипт? Напр.: npm run na-sarvara wave-2:bateriya')
    const r = сАрхив(`Преди „npm run ${скрипт}" на сървъра`, `CONTENT_ROOT=content-server npm run ${q(скрипт)} -- ${рест.map(q).join(' ')}`)
    if (r.status !== 0) стоп(`„${скрипт}" на сървъра не мина.`)
    опресни()
  },
}

const f = КОМАНДИ[команда]
if (!f) стоп(`Непозната команда „${команда}". Възможни: ${Object.keys(КОМАНДИ).join(', ')}`)
await f()
