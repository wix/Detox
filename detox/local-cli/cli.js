#!/usr/bin/env node
const yargs = require('yargs');
yargs
  .scriptName('detox')
  .env('DETOX')
  .pkgConf('detox')
  .config('config', 'configuration either as JSON or as Javascript file', function(configPath) {
    return require(configPath);
  })
  .commandDir('./', {
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
