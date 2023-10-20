import type { DependencyCategory, ActionResultStatus } from './types';

export const SUCCESS: ActionResultStatus = 'success';
export const FAILURE: ActionResultStatus = 'failure';
export const SKIPPED: ActionResultStatus = 'skipped';

export const ALL_CATEGORIES: DependencyCategory[] = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];
export const DEPENDENCY: DependencyCategory = 'dependencies';
export const DEV_DEPENDENCY: DependencyCategory = 'devDependencies';
export const DEPENDENCY_AND_DEV_DEPENDENCY: DependencyCategory[] = [DEPENDENCY, DEV_DEPENDENCY];
export const PEER_DEPENDENCY: DependencyCategory = 'peerDependencies';
export const OPTIONAL_DEPENDENCY: DependencyCategory = 'optionalDependencies';
