const os = require('os');

const { hideBin } = require('yargs/helpers');
const yargs = require('yargs/yargs');

const detox = require('../internals');

module.exports.command = 'clean-framework-cache';
module.exports.desc = `Alias for 'detox build-framework-cache --clean="all" --build="all"'. ` +
  `Deletes all Detox cached frameworks and XCUITest-runners from ~/Library/Detox, and rebuilds a new one for the ` +
  `current environment. (macOS only)`;

module.exports.handler = async function cleanFrameworkCache() {
  if (os.platform() !== 'darwin') {
    detox.log.info(`The command is supported only on macOS, skipping the execution.`);
    return;
  }

  detox.log.info(`This command is an alias to 'detox build-framework-cache --clean="all" --build="all"'. Executing it now.`);

  const argv = hideBin(process.argv);
  yargs(argv)
  .command(require('./build-framework-cache'))
  .parse(['build-framework-cache', '--clean="all"', '--build="all"']);
};
