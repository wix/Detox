#!/usr/bin/env node
const yargs = require('yargs');
const logger = require('../src/utils/logger').child({ __filename });

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
  .wrap(yargs.terminalWidth() * 0.9)
  .fail(function(msg, err, program) {
    if (msg || !err) {
      program.showHelp();
    } else {
      const lines = err.toString().split("\n");
      for (const line of lines) {
        logger.error(line);
      }
    }
  })
  .parse();
