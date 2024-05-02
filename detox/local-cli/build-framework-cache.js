const os = require('os');
const path = require('path');

const exec = require('child-process-promise').exec;
const fs = require('fs-extra');

const detox = require('../internals');

module.exports.command = 'build-framework-cache';

module.exports.desc = 'Builds or rebuilds a cached Detox framework and/or XCUITest-runner for the current ' +
  'environment in ~/Library/Detox. Supports flags --xcuitest, --detox, and --clean to specify what to build or ' +
  'clean. By default, builds both the framework and the runner. (MacOS only)';

module.exports.builder = (yargs) => {
  return yargs
    .option('xcuitest', {
      describe: 'Build only the XCUITest runner (default: false). If neither --xcuitest nor --detox is specified, ' +
        'both the framework and the runner will be built.',
      type: 'boolean',
      default: false
    })
    .option('detox', {
      describe: 'Build only the Detox framework (default: false). If neither --xcuitest nor --detox is specified, ' +
        'both the framework and the runner will be built.',
      type: 'boolean',
      default: false
    })
    .option('clean', {
      describe: 'Clean the cache before building (default: false)',
      type: 'boolean',
      default: false
    });
};

module.exports.handler = async function buildFrameworkCache(argv) {
  if (!isMacOS()) {
    detox.log.info(`The command is supported only on macOS, skipping the execution.`);
    return;
  }

  if (argv.detox || (!argv.xcuitest && !argv.detox)) {
    await _buildCache({
      targetPath: path.join(os.homedir(), '/Library/Detox/ios/framework'),
      scriptPath: '../scripts/build_local_framework.ios.sh',
      descriptor: 'Detox framework',
      shouldClean: argv.clean
    });
  }

  if (argv.xcuitest || (!argv.xcuitest && !argv.detox)) {
    await _buildCache({
      targetPath: path.join(os.homedir(), '/Library/Detox/ios/xcuitest-runner'),
      scriptPath: '../scripts/build_local_xcuitest.ios.sh',
      descriptor: 'XCUITest runner',
      shouldClean: argv.clean
    });
  }
};

function isMacOS() {
  return os.platform() === 'darwin';
}


async function _buildCache(options) {
  const { targetPath, scriptPath, descriptor, shouldClean } = options;

  if (shouldClean) {
    detox.log.info(`Cleaning ${descriptor} cache at ${targetPath}`);
    await fs.remove(targetPath);
  }

  detox.log.info(`Building ${descriptor} at ${targetPath}`);
  try {
    const result = await exec(path.join(__dirname, scriptPath), { capture: ['stdout', 'stderr'] });
    detox.log.info(result.stdout);
  } catch (error) {
    detox.log.error(`Error while building ${descriptor} at ${targetPath}: ${error.stderr}`);
    throw new Error(`Failed to build ${descriptor}`);
  }
}
