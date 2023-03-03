#!/usr/bin/env node
const fs = require('fs');

const _ = require('lodash');
const yargs = require('yargs');

const logger = require('../internals').log.child({ cat: 'cli' });
const DetoxError = require('../src/errors/DetoxError');

const { isErrorAlreadyLogged } = require('./utils/cliErrorHandling');

yargs
  .scriptName('detox')
  .parserConfiguration({
    'boolean-negation': true,
    'camel-case-expansion': false,
    'dot-notation': false,
    'duplicate-arguments-array': false,
    'populate--': true,
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
      if (!isErrorAlreadyLogged(err)) {
        logger.error(DetoxError.format(err));
        process.stderr.write('\n');
      }

      // @ts-ignore
      _.attempt(() => fs.unlinkSync(logger.file));
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }

    if (msg) {
      logger.error(msg + '\n');
      program.showHelp();
    }
  })
  .parse();
