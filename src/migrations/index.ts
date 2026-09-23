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
import * as migration_20260902_110340_media_content_sizes from './20260902_110340_media_content_sizes';
import * as migration_20260902_154058_backup_protected from './20260902_154058_backup_protected';
import * as migration_20260907_122748_tabbed_showcase_layout from './20260907_122748_tabbed_showcase_layout';
import * as migration_20260908_141956_home_page_fields from './20260908_141956_home_page_fields';
import * as migration_20260908_142134_hero_slides from './20260908_142134_hero_slides';
import * as migration_20260909_131953_utility_bar_toggle from './20260909_131953_utility_bar_toggle';
import * as migration_20260917_143201_menu_panel_auto from './20260917_143201_menu_panel_auto';
import * as migration_20260921_064425_menu_card_product from './20260921_064425_menu_card_product';
import * as migration_20260921_074512_feature_sub_tabs_intro from './20260921_074512_feature_sub_tabs_intro';
import * as migration_20260923_075913_media_full_size from './20260923_075913_media_full_size';
import * as migration_20260923_133550_comparison_intro from './20260923_133550_comparison_intro';

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
    name: '20260901_142626_product_drafts',
  },
  {
    up: migration_20260902_110340_media_content_sizes.up,
    down: migration_20260902_110340_media_content_sizes.down,
    name: '20260902_110340_media_content_sizes',
  },
  {
    up: migration_20260902_154058_backup_protected.up,
    down: migration_20260902_154058_backup_protected.down,
    name: '20260902_154058_backup_protected',
  },
  {
    up: migration_20260907_122748_tabbed_showcase_layout.up,
    down: migration_20260907_122748_tabbed_showcase_layout.down,
    name: '20260907_122748_tabbed_showcase_layout',
  },
  {
    up: migration_20260908_141956_home_page_fields.up,
    down: migration_20260908_141956_home_page_fields.down,
    name: '20260908_141956_home_page_fields',
  },
  {
    up: migration_20260908_142134_hero_slides.up,
    down: migration_20260908_142134_hero_slides.down,
    name: '20260908_142134_hero_slides',
  },
  {
    up: migration_20260909_131953_utility_bar_toggle.up,
    down: migration_20260909_131953_utility_bar_toggle.down,
    name: '20260909_131953_utility_bar_toggle',
  },
  {
    up: migration_20260917_143201_menu_panel_auto.up,
    down: migration_20260917_143201_menu_panel_auto.down,
    name: '20260917_143201_menu_panel_auto',
  },
  {
    up: migration_20260921_064425_menu_card_product.up,
    down: migration_20260921_064425_menu_card_product.down,
    name: '20260921_064425_menu_card_product',
  },
  {
    up: migration_20260921_074512_feature_sub_tabs_intro.up,
    down: migration_20260921_074512_feature_sub_tabs_intro.down,
    name: '20260921_074512_feature_sub_tabs_intro',
  },
  {
    up: migration_20260923_075913_media_full_size.up,
    down: migration_20260923_075913_media_full_size.down,
    name: '20260923_075913_media_full_size',
  },
  {
    up: migration_20260923_133550_comparison_intro.up,
    down: migration_20260923_133550_comparison_intro.down,
    name: '20260923_133550_comparison_intro'
  },
];
