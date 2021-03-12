#!/usr/bin/env node
global.DETOX_CLI = true;
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
    if (err) {
      const lines = err.toString().split("\n");
      for (const line of lines) {
        logger.error(line);
      }
      console.error('');
      process.exit(1);
    }

    if (msg) {
      logger.error(msg + '\n');
      program.showHelp();
    }
  })
  .parse();
