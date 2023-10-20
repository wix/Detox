/* eslint-disable unicorn/prefer-top-level-await, unicorn/no-process-exit */
import chalk from 'chalk';
import yargs from 'yargs';

import compose from './compositionRoot';

type DetoxDoctorArgv = {
  fix?: boolean;
  format: 'json' | 'plain';
  bare: boolean;
  listRules: boolean;
  _: string[];
};

yargs
  .usage('Usage: detox-doctor [options] [rule ...]')
  .option('f', {
    alias: 'format',
    describe: 'Choose output format',
    default: 'plain',
    choices: ['plain', 'json'],
  })
  .option('y', {
    alias: 'fix',
    choices: [true, false] as any,
    describe: 'Enable automatic fixing of issues',
  })
  .option('bare', {
    describe: 'Disable rules that require a full project setup',
    default: false,
    type: 'boolean',
  })
  .option('list-rules', {
    describe: 'Display a list of available rules',
    type: 'boolean',
  })
  .example('detox-doctor', 'Run the Detox Doctor utility')
  .example('detox-doctor -y', 'Enable automatic fixing of issues')
  .example('detox-doctor --list-rules', 'Display a list of available rules')
  .example('detox-doctor <...rule-ids>', 'Run the selected rules')
  .help()
  .strict();

async function main(argv: DetoxDoctorArgv) {
  const cwd = process.cwd();
  const { _: selectedRuleIds, ...options } = argv;
  const { detoxDoctor } = await compose({
    ...options,

    fix: options.fix,
    cwd,
    selectedRuleIds,
  });

  if (argv.listRules) {
    return detoxDoctor.listRules();
  }

  const success = await detoxDoctor.run();
  if (!success) {
    return process.exit(1);
  }
}

main(yargs.argv as unknown as DetoxDoctorArgv).catch((error) => {
  console.error(chalk.red(error.message));
  return process.exit(1);
});
