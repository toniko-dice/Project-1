/**
 * `npm run build:local` — билд за ПРОВЕРКА на локалната машина, с адрес
 * localhost. Пуска `npm run build` (с `prebuild`) и казва на пазача в
 * `next.config.ts`, че localhost е нарочно. НИКОГА за качване на сървъра:
 * такъв билд пише localhost в sitemap, canonical и JSON-LD.
 */
import { spawnSync } from 'child_process'

const r = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, ALLOW_LOCAL_SITE_URL: '1' },
})
process.exit(r.status ?? 1)
