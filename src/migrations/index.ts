import * as migration_20260831_092613_initial from './20260831_092613_initial';
import * as migration_20260831_132415_bgn_default from './20260831_132415_bgn_default';
import * as migration_20260831_133313_add_orderable from './20260831_133313_add_orderable';
import * as migration_20260831_133437_drop_order from './20260831_133437_drop_order';
import * as migration_20260831_142059_backups from './20260831_142059_backups';

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
    name: '20260831_142059_backups'
  },
];
