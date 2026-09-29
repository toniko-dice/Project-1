import { randomBytes } from 'crypto'
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/*
  Секциите на панелите — отново редове „продукт + полета под него".

  Първа стъпка: таблицата с редовете и попълването ѝ. Втората
  (`menu_panel_drop_products`) маха списъка `products` от предишната
  промяна. Две отделни, защото нова таблица до изтрита кара генератора да
  пита „преименувана ли е" (CLAUDE.md, т. 10).

  Всеки продукт от `products` на секцията става ред В СЪЩИЯ РЕД, с име,
  подзаглавие и снимка от продукта и празен етикет. Така менюто изглежда
  точно както преди: полетата съвпадат с продукта.

  Чист SQL: старият списък вече не е в конфигурацията, а таблицата с
  редовете е проста — идентификаторът на реда е 24 шестнайсетични знака,
  какъвто прави и Payload.
*/

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`menu_panels_sections_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`product_id\` integer,
  	\`title\` text,
  	\`label\` text,
  	\`spec_line\` text,
  	\`image_id\` integer,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`menu_panels_sections\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_cards_order_idx\` ON \`menu_panels_sections_cards\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_cards_parent_id_idx\` ON \`menu_panels_sections_cards\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_cards_product_idx\` ON \`menu_panels_sections_cards\` (\`product_id\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_cards_image_idx\` ON \`menu_panels_sections_cards\` (\`image_id\`);`)

  /* ─────────── попълване ─────────── */

  const секции = (await db.all(
    sql`SELECT id, _parent_id FROM menu_panels_sections ORDER BY _parent_id, _order`,
  )) as { id: string; _parent_id: number }[]

  // Пътят на връзката е по ИНДЕКС на секцията в панела: sections.0.products.
  const индекс = new Map<string, string>()
  const брояч = new Map<number, number>()
  for (const с of секции) {
    const i = брояч.get(с._parent_id) ?? 0
    брояч.set(с._parent_id, i + 1)
    индекс.set(`${с._parent_id}:sections.${i}.products`, с.id)
  }

  const връзки = (await db.all(
    sql`SELECT r.parent_id, r.path, r.products_id, p.title, p.tagline, p.image_id
        FROM menu_panels_rels r JOIN products p ON p.id = r.products_id
        WHERE r.path LIKE 'sections.%.products'
        ORDER BY r.parent_id, r.path, r."order"`,
  )) as {
    parent_id: number
    path: string
    products_id: number
    title: string | null
    tagline: string | null
    image_id: number | null
  }[]

  const ред = new Map<string, number>()
  let вмъкнати = 0
  for (const в of връзки) {
    const секция = индекс.get(`${в.parent_id}:${в.path}`)
    if (!секция) continue
    const n = (ред.get(секция) ?? 0) + 1
    ред.set(секция, n)
    await db.run(
      sql`INSERT INTO menu_panels_sections_cards (_order, _parent_id, id, product_id, title, label, spec_line, image_id)
          VALUES (${n}, ${секция}, ${randomBytes(12).toString('hex')}, ${в.products_id}, ${в.title}, NULL, ${в.tagline}, ${в.image_id})`,
    )
    вмъкнати += 1
  }

  payload.logger.info(`Редове в секциите на панелите: ${вмъкнати} (от ${връзки.length} връзки)`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`menu_panels_sections_cards\`;`)
}
