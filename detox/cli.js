#!/usr/bin/env node

const yargs = require('yargs');
yargs
  .scriptName('detox')
  .env('DETOX')
  .commandDir('local-cli', {
    exclude: function(path) {
      // This is a test file
      if (/\.test\.js$/.test(path)) {
        return true;
      }
      return false;
    }
  })
  .demandCommand()
  .recommendCommands()
  .help()
  .wrap(yargs.terminalWidth() * 0.9).argv;
