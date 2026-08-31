import * as migration_20260831_092613_initial from './20260831_092613_initial';

export const migrations = [
  {
    up: migration_20260831_092613_initial.up,
    down: migration_20260831_092613_initial.down,
    name: '20260831_092613_initial'
  },
];
