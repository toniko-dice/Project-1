# Общи технически правила (зареждат се винаги — кратко)

- **Next.js 16 / Payload 3.88** — не е версията от обучението: при съмнение — `node_modules/next/dist/docs/` (виж `AGENTS.md`).
- **`npm run dev` е Turbopack;** при необяснимо счупен админ — `npm run dev:webpack` преди да търсиш другаде.
- **SQLite — един писач.** Не пиши в базата, докато dev сървърът рендерира или друг процес я държи. Тест с писане — върху копие (`.claude/rules/migracii-i-baza.md`).
- **Скрипт от командния ред не опреснява кеша на сайта** — след него `POST /api/products/revalidate` с `x-revalidate-key` (вносът го прави сам).
- Работа в worktree → копие в главната папка (`C:\CLAUDE\ecoflow-bg`) → commit в worktree → `git merge --ff-only` в main → `git push origin main`. Билд и `tsc` — в главната папка.
- Ако нещо „не отговаря" без грешка — първо: продукт, който сочи себе си при попълване на връзки (`defaultPopulate`).
