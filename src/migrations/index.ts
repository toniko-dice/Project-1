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
import * as migration_20260924_102822_tree_and_urls from './20260924_102822_tree_and_urls';
import * as migration_20260924_132054_product_ean2 from './20260924_132054_product_ean2';
import * as migration_20260924_170000_home_page_urls from './20260924_170000_home_page_urls';
import * as migration_20260925_103626_box_groups from './20260925_103626_box_groups';
import * as migration_20260928_081820_product_search from './20260928_081820_product_search';
import * as migration_20260928_092612_strip_from_checkbox from './20260928_092612_strip_from_checkbox';
import * as migration_20260929_132138_menu_panel_products from './20260929_132138_menu_panel_products';
import * as migration_20260929_132202_menu_panel_drop_modes from './20260929_132202_menu_panel_drop_modes';
import * as migration_20260929_145634_menu_panel_cards from './20260929_145634_menu_panel_cards';
import * as migration_20260929_145651_menu_panel_drop_products from './20260929_145651_menu_panel_drop_products';
import * as migration_20261001_110503_product_categories from './20261001_110503_product_categories';
import * as migration_20261002_122009_attributes_filters from './20261002_122009_attributes_filters';
import * as migration_20261002_132404_filter_order from './20261002_132404_filter_order';
import * as migration_20261002_144428_filter_open from './20261002_144428_filter_open';
import * as migration_20261005_152225_media_original_name from './20261005_152225_media_original_name';
import * as migration_20261006_090159_seo_category_text_home_h1 from './20261006_090159_seo_category_text_home_h1';
import * as migration_20261006_200019_guide_blocks from './20261006_200019_guide_blocks';
import * as migration_20261007_083826_karti_trimmed from './20261007_083826_karti_trimmed';
import * as migration_20261007_090942_carousel_arrangement from './20261007_090942_carousel_arrangement';
import * as migration_20261007_094656_wide_banner_overlay from './20261007_094656_wide_banner_overlay';
import * as migration_20261007_104241_quote_requests from './20261007_104241_quote_requests';
import * as migration_20261007_112559_quote_edit_versions from './20261007_112559_quote_edit_versions';
import * as migration_20261007_122953_offers from './20261007_122953_offers';
import * as migration_20261007_125539_text_table_blocks from './20261007_125539_text_table_blocks';

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
    name: '20260923_133550_comparison_intro',
  },
  {
    up: migration_20260924_102822_tree_and_urls.up,
    down: migration_20260924_102822_tree_and_urls.down,
    name: '20260924_102822_tree_and_urls',
  },
  {
    up: migration_20260924_132054_product_ean2.up,
    down: migration_20260924_132054_product_ean2.down,
    name: '20260924_132054_product_ean2',
  },
  {
    up: migration_20260924_170000_home_page_urls.up,
    down: migration_20260924_170000_home_page_urls.down,
    name: '20260924_170000_home_page_urls',
  },
  {
    up: migration_20260925_103626_box_groups.up,
    down: migration_20260925_103626_box_groups.down,
    name: '20260925_103626_box_groups',
  },
  {
    up: migration_20260928_081820_product_search.up,
    down: migration_20260928_081820_product_search.down,
    name: '20260928_081820_product_search',
  },
  {
    up: migration_20260928_092612_strip_from_checkbox.up,
    down: migration_20260928_092612_strip_from_checkbox.down,
    name: '20260928_092612_strip_from_checkbox',
  },
  {
    up: migration_20260929_132138_menu_panel_products.up,
    down: migration_20260929_132138_menu_panel_products.down,
    name: '20260929_132138_menu_panel_products',
  },
  {
    up: migration_20260929_132202_menu_panel_drop_modes.up,
    down: migration_20260929_132202_menu_panel_drop_modes.down,
    name: '20260929_132202_menu_panel_drop_modes',
  },
  {
    up: migration_20260929_145634_menu_panel_cards.up,
    down: migration_20260929_145634_menu_panel_cards.down,
    name: '20260929_145634_menu_panel_cards',
  },
  {
    up: migration_20260929_145651_menu_panel_drop_products.up,
    down: migration_20260929_145651_menu_panel_drop_products.down,
    name: '20260929_145651_menu_panel_drop_products',
  },
  {
    up: migration_20261001_110503_product_categories.up,
    down: migration_20261001_110503_product_categories.down,
    name: '20261001_110503_product_categories',
  },
  {
    up: migration_20261002_122009_attributes_filters.up,
    down: migration_20261002_122009_attributes_filters.down,
    name: '20261002_122009_attributes_filters',
  },
  {
    up: migration_20261002_132404_filter_order.up,
    down: migration_20261002_132404_filter_order.down,
    name: '20261002_132404_filter_order',
  },
  {
    up: migration_20261002_144428_filter_open.up,
    down: migration_20261002_144428_filter_open.down,
    name: '20261002_144428_filter_open',
  },
  {
    up: migration_20261005_152225_media_original_name.up,
    down: migration_20261005_152225_media_original_name.down,
    name: '20261005_152225_media_original_name',
  },
  {
    up: migration_20261006_090159_seo_category_text_home_h1.up,
    down: migration_20261006_090159_seo_category_text_home_h1.down,
    name: '20261006_090159_seo_category_text_home_h1',
  },
  {
    up: migration_20261006_200019_guide_blocks.up,
    down: migration_20261006_200019_guide_blocks.down,
    name: '20261006_200019_guide_blocks',
  },
  {
    up: migration_20261007_083826_karti_trimmed.up,
    down: migration_20261007_083826_karti_trimmed.down,
    name: '20261007_083826_karti_trimmed',
  },
  {
    up: migration_20261007_090942_carousel_arrangement.up,
    down: migration_20261007_090942_carousel_arrangement.down,
    name: '20261007_090942_carousel_arrangement',
  },
  {
    up: migration_20261007_094656_wide_banner_overlay.up,
    down: migration_20261007_094656_wide_banner_overlay.down,
    name: '20261007_094656_wide_banner_overlay',
  },
  {
    up: migration_20261007_104241_quote_requests.up,
    down: migration_20261007_104241_quote_requests.down,
    name: '20261007_104241_quote_requests',
  },
  {
    up: migration_20261007_112559_quote_edit_versions.up,
    down: migration_20261007_112559_quote_edit_versions.down,
    name: '20261007_112559_quote_edit_versions',
  },
  {
    up: migration_20261007_122953_offers.up,
    down: migration_20261007_122953_offers.down,
    name: '20261007_122953_offers',
  },
  {
    up: migration_20261007_125539_text_table_blocks.up,
    down: migration_20261007_125539_text_table_blocks.down,
    name: '20261007_125539_text_table_blocks'
  },
];
