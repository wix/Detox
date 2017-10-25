#!/usr/bin/env node

const program = require('commander');
const path = require('path');
const cp = require('child_process');
program
  .option('-r, --runner [runner]', 'Test runner (supports mocha and jest)')
  .option('-o, --runner-config [config]', 'Test runner config file', 'mocha.opts')
  .option('-l, --loglevel [value]', 'info, debug, verbose, silly, wss')
  .option('-c, --configuration [device configuration]', 'Select a device configuration from your defined configurations,'
                                                        + 'if not supplied, and there\'s only one configuration, detox will default to it')
  .option('-r, --reuse', 'Reuse existing installed app (do not delete and re-install) for a faster run.', false)
  .option('-u, --cleanup', 'Shutdown simulator when test is over, useful for CI scripts, to make sure detox exists cleanly with no residue', false)
  .option('-d, --debug-synchronization [value]',
    'When an action/expectation takes a significant amount of time use this option to print device synchronization status. '
    + 'The status will be printed if the action takes more than [value]ms to complete')
  .option('-a, --artifacts-location [path]', 'Artifacts destination path (currently will contain only logs). '
                                             + 'If the destination already exists, it will be removed first')
  .parse(process.argv);

const config = require(path.join(process.cwd(), 'package.json')).detox;
const testFolder = config.specs || 'e2e';

let runner = config.runner || 'mocha';

if (program.runner) {
  runner = program.runner;
}

if (typeof program.debugSynchronization === "boolean") {
  program.debugSynchronization = 3000;
}

switch (runner) {
  case 'mocha':
    runMocha();
    break;
  case 'jest':
    runJest();
    break;
  default:
    throw new Error(`${runner} is not supported in detox cli tools. You can still run your tests with the runner's own cli tool`);
}

function runMocha() {
  const loglevel = program.loglevel ? `--loglevel ${program.loglevel}` : '';
  const configuration = program.configuration ? `--configuration ${program.configuration}` : '';
  const cleanup = program.cleanup ? `--cleanup` : '';
  const reuse = program.reuse ? `--reuse` : '';
  const artifactsLocation = program.artifactsLocation ? `--artifacts-location ${program.artifactsLocation}` : '';

  const debugSynchronization = program.debugSynchronization ? `--debug-synchronization ${program.debugSynchronization}` : '';
  const command = `node_modules/.bin/mocha ${testFolder} --opts ${testFolder}/${program.runnerConfig} ${configuration} ${loglevel} ${cleanup} ${reuse} ${debugSynchronization} ${artifactsLocation}`;

  console.log(command);
  cp.execSync(command, {stdio: 'inherit'});
}

function runJest() {
  const command = `node_modules/.bin/jest ${testFolder} --runInBand`;
  console.log(command);

  cp.execSync(command, {
    stdio: 'inherit',
    env: Object.assign({}, process.env, {
      configuration: program.configuration,
      loglevel: program.loglevel,
      cleanup: program.cleanup,
      reuse: program.reuse,
      debugSynchronization: program.debugSynchronization,
      artifactsLocation: program.artifactsLocation
    })
  });
}
