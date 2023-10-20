import {
  RuleFactoryImpl,
  RuleRegistryImpl,
  DetoxDoctor,
  LoggerImpl,
  ProjectImpl,
  ReportersManager,
  RuleRunner,
} from './core';

import { DefaultReporter, JSONReporter } from './reporters';
import * as rules from './rules';
import type { DetoxDoctorOptions } from './types';
import { ConsoleUI, JSONUI } from './ui';

export default async function compositionRoot(options: DetoxDoctorOptions) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const doctorVersion = require('../package.json').version;
  const rootDir = options.cwd || process.cwd();
  const logger = new LoggerImpl({ name: 'detox-doctor' });
  const project = new ProjectImpl({ rootDir });
  const manifest = await project.getManifest();
  const deps = { logger, project, manifest, options };
  const actionFactory = new RuleFactoryImpl(deps);
  const actionRegistry = new RuleRegistryImpl({
    actionFactory,
    rules,
  });

  const UIClass = options.format === 'json' ? JSONUI : ConsoleUI;
  const ui = new UIClass({ actionRegistry, doctorVersion, logger, options });
  const reportersManager = new ReportersManager({ ...deps, actionRegistry });
  reportersManager.register(options.format === 'json' ? JSONReporter : DefaultReporter);

  const ruleRunner = new RuleRunner({
    actionRegistry,
    fix: options.fix,
    project,
    reportersManager,
    ui,
  });

  const detoxDoctor = new DetoxDoctor({
    ruleRunner,
    options,
    ui,
  });

  return {
    rootDir,
    logger,
    project,
    manifest,
    actionFactory,
    actionRegistry,
    ui,
    reportersManager,
    ruleRunner,
    detoxDoctor,
  };
}
