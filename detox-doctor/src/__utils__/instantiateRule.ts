import { ProjectImpl } from '../core';
import type { Rule, RuleConstructor } from '../types';
import { instantiateMaybeClass } from '../utils/instantiateMaybeClass';
import { cloneFixtureDir } from './cloneFixtureDir';
import { MockLogger } from './MockLogger';

export type InstantiateRule$Options = {
  bareMode?: boolean;
  cwd: string | undefined;
};

export async function instantiateRule<T extends Rule>(
  RuleClass: RuleConstructor<T>,
  options: InstantiateRule$Options,
) {
  const rootDir = await cloneFixtureDir(options.cwd);
  const logger = new MockLogger();
  const project = new ProjectImpl({ rootDir });
  const manifest = await project.getManifest();
  const rule = instantiateMaybeClass(RuleClass, {
    context: { bare: options.bareMode ?? false },
    logger,
    project,
    manifest,
  }) as T;
  return { rootDir, logger, project, manifest, rule };
}
