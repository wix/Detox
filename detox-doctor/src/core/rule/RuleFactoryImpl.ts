import type { DetoxDoctorOptions, Rule, RuleConstructor } from '../../types';
import { instantiateMaybeClass } from '../../utils';
import type { LoggerImpl } from '../logger';
import type { PackageManifestImpl, ProjectImpl } from '../project';

export type RuleFactoryImplDependencies = {
  logger: LoggerImpl;
  project: ProjectImpl;
  manifest: PackageManifestImpl | null;
  options: DetoxDoctorOptions;
};

export interface RuleFactory {
  createRule(Rule: RuleConstructor): Rule;
}

export class RuleFactoryImpl implements RuleFactory {
  constructor(protected readonly deps: RuleFactoryImplDependencies) {}

  createRule(RuleClass: RuleConstructor): Rule {
    return instantiateMaybeClass(RuleClass, {
      context: {
        bare: this.deps.options.bare,
      },
      logger: this.deps.logger.child(RuleClass.name),
      project: this.deps.project,
      manifest: this.deps.manifest,
    }) as Rule;
  }
}
