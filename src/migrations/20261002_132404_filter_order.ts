import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'
import { randomBytes } from 'crypto'

/**
 * Глобалът „Подредба на филтрите" и първоначалният ред от
 * `task-filtri-podredba.md`. Нови таблици — нищо не се пресъздава.
 *
 * Попълва се само ако е празен. Атрибут, който го няма в базата, се
 * прескача (той ще излезе преди „Съвместимост" по правилото).
 */
const РЕД: ({ builtin: string; label: string } | { attribute: string })[] = [
  { builtin: 'nalichnost', label: 'Наличност' },
  { builtin: 'kategoriya', label: 'Категория' },
  { attribute: 'vid' },
  { attribute: 'konektor' },
  { attribute: 'moshtnost' },
  { attribute: 'kapacitet-mah' },
  { attribute: 'kapacitet-wh' },
  { attribute: 'broy-portove' },
  { attribute: 'duljina' },
  { builtin: 'model', label: 'Модел' },
  { builtin: 'savmestimost', label: 'Съвместимост' },
  { builtin: 'cena', label: 'Цена' },
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`filter_order_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`type\` text DEFAULT 'attribute',
  	\`builtin\` text,
  	\`attribute_id\` integer,
  	\`label\` text,
  	FOREIGN KEY (\`attribute_id\`) REFERENCES \`attributes\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`filter_order\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`filter_order_items_order_idx\` ON \`filter_order_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`filter_order_items_parent_id_idx\` ON \`filter_order_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`filter_order_items_attribute_idx\` ON \`filter_order_items\` (\`attribute_id\`);`)
  await db.run(sql`CREATE TABLE \`filter_order\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)

  /* ── първоначалният ред ── */
  const има = await db.get<{ n: number }>(sql`SELECT count(*) AS n FROM \`filter_order_items\``)
  if (!има?.n) {
    const сега = new Date().toISOString()
    await db.run(sql`INSERT INTO \`filter_order\` (\`id\`, \`updated_at\`, \`created_at\`) VALUES (1, ${сега}, ${сега})`)
    let място = 1
    for (const ред of РЕД) {
      const id = randomBytes(12).toString('hex')
      if ('builtin' in ред) {
        await db.run(sql`INSERT INTO \`filter_order_items\` (\`_order\`, \`_parent_id\`, \`id\`, \`type\`, \`builtin\`, \`label\`)
          VALUES (${място}, 1, ${id}, 'builtin', ${ред.builtin}, ${ред.label})`)
      } else {
        const a = await db.get<{ id: number; name: string; unit: string | null }>(
          sql`SELECT \`id\`, \`name\`, \`unit\` FROM \`attributes\` WHERE \`slug\` = ${ред.attribute}`,
        )
        if (!a) continue
        const label = a.unit ? `${a.name} (${a.unit})` : a.name
        await db.run(sql`INSERT INTO \`filter_order_items\` (\`_order\`, \`_parent_id\`, \`id\`, \`type\`, \`attribute_id\`, \`label\`)
          VALUES (${място}, 1, ${id}, 'attribute', ${a.id}, ${label})`)
      }
      място += 1
    }
  }
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`DROP TABLE \`filter_order_items\`;`)
  await db.run(sql`DROP TABLE \`filter_order\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}
