import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/*
  Панелите в менюто без режими — първа стъпка: само добавя и попълва.

  Секцията получава списък `products` (hasMany) и отметка „Аксесоари по
  съвместимост". Списъкът се попълва с това, което сайтът показва в
  момента, в същия ред — иначе при махането на режима менюто би опустяло.
  Втората миграция (`menu_panel_drop_modes`) маха старите полета.

  Двете са отделни, защото таблица, която едновременно губи и печели
  колони, кара генератора да пита интерактивно (CLAUDE.md, т. 10).

  Старите стойности (`mode`, категорията на панела, картите) се четат с
  ЧИСТ SQL: конфигурацията вече не ги описва и `payload.find` не ги вижда.
  Новите се записват през `payload.update` — така редовете на масива и
  връзките са точно във вида, който Payload очаква.

  Какво става с всеки панел:
  - автоматичен (с категория, режим не „ръчен") → секция с ВСИЧКИ
    публикувани продукти на разклонението, по реда на сайта
    (разклонението, в него `_order`, после най-новите), плюс секция
    „Аксесоари по съвместимост", ако има съвместими. Сайтът показваше
    първите 7 и 6 — списъкът е пълен, за да не изчезне нищо;
  - ръчен → всяка секция пази заглавието и „Виж всички"; продуктите са
    картите с продукт, в същия ред (голямата първа). Карта без продукт се
    връзва с продукт само при ТОЧНО същото име (без „EcoFlow"); иначе
    отпада и се изписва — без продукт в списъка няма какво да се покаже.
*/

type Ред = Record<string, unknown>

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`menu_panels_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`products_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`menu_panels\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`products_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`menu_panels_rels_order_idx\` ON \`menu_panels_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_rels_parent_idx\` ON \`menu_panels_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_rels_path_idx\` ON \`menu_panels_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_rels_products_id_idx\` ON \`menu_panels_rels\` (\`products_id\`);`)
  await db.run(sql`ALTER TABLE \`menu_panels_sections\` ADD \`accessories\` integer;`)

  /* ─────────── данните ─────────── */

  const all = async (q: ReturnType<typeof sql>) => (await db.all(q)) as Ред[]

  const категории = await all(sql`SELECT id, parent_id, title FROM categories ORDER BY _order`)
  const заглавиеНа = new Map(категории.map((c) => [Number(c.id), String(c.title)]))

  /** Категорията и всичко под нея, в ширина — като `categoryBranchIds`. */
  const разклонение = (root: number): number[] => {
    const ids = [root]
    for (let i = 0; i < ids.length; i += 1) {
      for (const c of категории) if (Number(c.parent_id) === ids[i]) ids.push(Number(c.id))
    }
    return ids
  }

  const публикувани = await all(
    sql`SELECT id, category_id, title FROM products WHERE _status = 'published' ORDER BY _order, created_at DESC`,
  )
  const всички = await all(sql`SELECT id, title FROM products`)
  const съвместимост = await all(
    sql`SELECT parent_id, categories_id FROM products_rels WHERE path = 'compatibleWith' AND categories_id IS NOT NULL`,
  )
  const аксесоариПоРед = await all(
    sql`SELECT id FROM products WHERE _status = 'published' ORDER BY _order, title`,
  )

  const име = (t: unknown) =>
    String(t ?? '')
      .replace(/^ecoflow\s+/i, '')
      .trim()
      .toLowerCase()
  /** Продукт по ТОЧНО име (без „EcoFlow") — само ако е единствен. */
  const поИме = (t: unknown): number | null => {
    const търсено = име(t)
    if (!търсено) return null
    const намерени = всички.filter((p) => име(p.title) === търсено)
    return намерени.length === 1 ? Number(намерени[0]!.id) : null
  }

  const панели = await all(sql`SELECT id, title, mode, category_id FROM menu_panels ORDER BY _order`)
  const отпаднали: string[] = []
  let попълнени = 0

  for (const панел of панели) {
    const id = Number(панел.id)
    const категория = панел.category_id == null ? null : Number(панел.category_id)
    const автоматичен = панел.mode !== 'manual' && категория !== null

    let sections: Ред[]

    if (автоматичен) {
      const клон = разклонение(категория)
      const вКлона = new Set(клон)
      const продукти = клон.flatMap((cid) =>
        публикувани.filter((p) => Number(p.category_id) === cid).map((p) => Number(p.id)),
      )
      const съвместими = new Set(
        съвместимост
          .filter((r) => вКлона.has(Number(r.categories_id)))
          .map((r) => Number(r.parent_id)),
      )
      const аксесоари = аксесоариПоРед
        .map((p) => Number(p.id))
        .filter((pid) => съвместими.has(pid))

      sections = [
        {
          heading: заглавиеНа.get(категория) ?? String(панел.title ?? ''),
          viewAllLabel: 'Виж всички',
          viewAllCategory: категория,
          products: продукти,
          showViewAllTile: true,
        },
      ]
      if (аксесоари.length) {
        sections.push({
          heading: 'Аксесоари',
          viewAllLabel: 'Виж всички',
          viewAllCategory: категория,
          products: аксесоари,
          accessories: true,
          showViewAllTile: false,
        })
      }
    } else {
      const секции = await all(
        sql`SELECT id, heading, view_all_label, view_all_url, view_all_category_id, show_view_all_tile, view_all_tile_url, featured_product_id, featured_title FROM menu_panels_sections WHERE _parent_id = ${id} ORDER BY _order`,
      )
      sections = []
      for (const с of секции) {
        const карти = await all(
          sql`SELECT product_id, title FROM menu_panels_sections_cards WHERE _parent_id = ${String(с.id)} ORDER BY _order`,
        )
        const продукти: number[] = []
        for (const к of [
          { product_id: с.featured_product_id, title: с.featured_title },
          ...карти,
        ]) {
          if (к.product_id == null && !к.title) continue // празна голяма карта
          const pid = к.product_id != null ? Number(к.product_id) : поИме(к.title)
          if (pid === null) {
            отпаднали.push(`„${панел.title}" › „${с.heading}": ${к.title}`)
            continue
          }
          if (!продукти.includes(pid)) продукти.push(pid)
        }
        sections.push({
          id: с.id,
          heading: с.heading,
          viewAllLabel: с.view_all_label,
          viewAllUrl: с.view_all_url,
          viewAllCategory: с.view_all_category_id == null ? null : Number(с.view_all_category_id),
          products: продукти,
          showViewAllTile: Boolean(с.show_view_all_tile),
          viewAllTileUrl: с.view_all_tile_url,
        })
      }
    }

    попълнени += sections.filter((s) => (s.products as number[]).length).length

    await payload.update({
      collection: 'menu-panels',
      id,
      data: {
        // Заглавието вече е задължително; празно беше „името на категорията".
        title: String(панел.title ?? '').trim() || (категория ? заглавиеНа.get(категория) : '') || String(id),
        sections,
      } as never,
      depth: 0,
      req,
    })
  }

  payload.logger.info(
    `Панели: ${панели.length}, попълнени секции: ${попълнени}, отпаднали карти без продукт: ${отпаднали.length}`,
  )
  for (const ред of отпаднали) payload.logger.info(`  отпадна: ${ред}`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`menu_panels_rels\`;`)
  await db.run(sql`ALTER TABLE \`menu_panels_sections\` DROP COLUMN \`accessories\`;`)
}
