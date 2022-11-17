const { promisify } = require('util');

const glob = promisify(require('glob'));

const { log } = require('../internals');
const { DetoxLogger, DetoxLogFinalizer } = require('../src/logger');

module.exports.command = 'repair-logs';
module.exports.desc = 'Repairs temporary JSONL files into a plain text log and Chrome Trace event log';

module.exports.handler = async function repairLogs() {
  process.env.FORCE_COLOR = '0';

  const finalizer = new DetoxLogFinalizer({
    logger: log,
    session: {
      detoxConfig: {
        logger: {
          level: 'trace',
          overrideConsole: false,
          options: DetoxLogger.defaultOptions({ level: 'trace' }),
        },
      },
    },
  });

  const jsonlFiles = await glob('*.detox.jsonl');
  await finalizer.mergeLogs(jsonlFiles, process.cwd());

  log.debug({ data: jsonlFiles }, 'Merged log files');
};
