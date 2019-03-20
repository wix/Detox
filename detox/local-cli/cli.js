#!/usr/bin/env node
const yargs = require('yargs');

yargs
  .scriptName('detox')
  .parserConfiguration({
    'boolean-negation': false,
    'dot-notation': false,
    'duplicate-arguments-array': false,
  })
  .commandDir('./', {
    exclude: function(path) {
      // This is a test file
      return /\.test\.js$/.test(path);
    }
  })
  .demandCommand()
  .recommendCommands()
  .help()
  .wrap(yargs.terminalWidth() * 0.9).argv;
