#!/usr/bin/env node

const program = require('commander');
const path = require('path');
const cp = require('child_process');
program
  .option('-r, --runner [runner]', 'Test runner (currently supports mocha)', 'mocha')
  .option('-o, --runner-config [config]', 'Test runner config file', 'mocha.opts')
  .option('-l, --loglevel [value]', 'info, debug, verbose, silly, wss')
  .option('-c, --configuration [device configuration]', 'Select a device configuration from your defined configurations,'
                                                        + 'if not supplied, and there\'s only one configuration, detox will default to it')
  .option('-r, --reuse', 'Reuse existing installed app (do not delete and re-install) for a faster run.', false)
  .option('-u, --cleanup', 'shutdown simulator when test is over, useful for CI scripts, to make sure detox exists cleanly with no residue', false)
  .option('-d, --debug-slow-invocations [value]', '', 3000)
  .parse(process.argv);

const config = require(path.join(process.cwd(), 'package.json')).detox;
const testFolder = config.specs || 'e2e';

const loglevel = program.loglevel ? `--loglevel ${program.loglevel}` : '';
const configuration = program.configuration ? `--configuration ${program.configuration}` : '';
const cleanup = program.cleanup ? `--cleanup` : '';
const reuse = program.reuse ? `--reuse` : '';
const debugSlowInvocations = program.debugSlowInvocations ? `--debug-slow-invocations ${program.debugSlowInvocations}` : '';

let command;
switch (program.runner) {
  case 'mocha':
    command = `node_modules/.bin/${program.runner} ${testFolder} --opts ${testFolder}/${program.runnerConfig} ${configuration} ${loglevel} ${cleanup} ${reuse} ${debugSlowInvocations}`;
    break;
  default:
    throw new Error(`${program.runner} is not supported in detox cli tools. You can still run your tests with the runner's own cli tool`);
}

console.log(command);
cp.execSync(command, {stdio: 'inherit'});
