#!/usr/bin/env node

const yargs = require('yargs');
yargs
  .scriptName('detox')
  .commandDir('local-cli')
  .demandCommand()
  .recommendCommands()
  .help()
  .wrap(yargs.terminalWidth() * 0.9)
  .argv