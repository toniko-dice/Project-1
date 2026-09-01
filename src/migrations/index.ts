import * as migration_20260831_092613_initial from './20260831_092613_initial';
import * as migration_20260831_132415_bgn_default from './20260831_132415_bgn_default';
import * as migration_20260831_133313_add_orderable from './20260831_133313_add_orderable';
import * as migration_20260831_133437_drop_order from './20260831_133437_drop_order';
import * as migration_20260831_142059_backups from './20260831_142059_backups';
import * as migration_20260831_154352_product_sections from './20260831_154352_product_sections';
import * as migration_20260901_133644_product_seo_fields from './20260901_133644_product_seo_fields';
import * as migration_20260901_140625_product_highlights from './20260901_140625_product_highlights';
import * as migration_20260901_142503_product_meta from './20260901_142503_product_meta';
import * as migration_20260901_142626_product_drafts from './20260901_142626_product_drafts';

export const migrations = [
  {
    up: migration_20260831_092613_initial.up,
    down: migration_20260831_092613_initial.down,
    name: '20260831_092613_initial',
  },
  {
    up: migration_20260831_132415_bgn_default.up,
    down: migration_20260831_132415_bgn_default.down,
    name: '20260831_132415_bgn_default',
  },
  {
    up: migration_20260831_133313_add_orderable.up,
    down: migration_20260831_133313_add_orderable.down,
    name: '20260831_133313_add_orderable',
  },
  {
    up: migration_20260831_133437_drop_order.up,
    down: migration_20260831_133437_drop_order.down,
    name: '20260831_133437_drop_order',
  },
  {
    up: migration_20260831_142059_backups.up,
    down: migration_20260831_142059_backups.down,
    name: '20260831_142059_backups',
  },
  {
    up: migration_20260831_154352_product_sections.up,
    down: migration_20260831_154352_product_sections.down,
    name: '20260831_154352_product_sections',
  },
  {
    up: migration_20260901_133644_product_seo_fields.up,
    down: migration_20260901_133644_product_seo_fields.down,
    name: '20260901_133644_product_seo_fields',
  },
  {
    up: migration_20260901_140625_product_highlights.up,
    down: migration_20260901_140625_product_highlights.down,
    name: '20260901_140625_product_highlights',
  },
  {
    up: migration_20260901_142503_product_meta.up,
    down: migration_20260901_142503_product_meta.down,
    name: '20260901_142503_product_meta',
  },
  {
    up: migration_20260901_142626_product_drafts.up,
    down: migration_20260901_142626_product_drafts.down,
    name: '20260901_142626_product_drafts'
  },
];
