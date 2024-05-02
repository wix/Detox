const os = require('os');
const path = require('path');

const exec = require('child-process-promise').exec;
const fs = require('fs-extra');

const detox = require('../internals');

module.exports.command = 'build-framework-cache';
module.exports.desc = 'Builds or rebuilds a cached Detox framework and/or XCUITest-runner for the current ' +
  'environment in ~/Library/Detox. Supports --build and --clean options to specify what to build or ' +
  'clean. Defaults to building all. (MacOS only)';

module.exports.builder = (yargs) => {
  return yargs
    .option('build', {
      describe: 'Specifies what to build (if any): "all", "detox", "xcuitest", or "none"',
      type: 'string',
      default: 'all',
      choices: ['all', 'detox', 'xcuitest', 'none']
    })
    .option('clean', {
      describe: 'Specifies what to clean before building (if any): "all", "detox", "xcuitest", or "none"',
      type: 'string',
      default: 'all',
      choices: ['all', 'detox', 'xcuitest', 'none']
    });
};

module.exports.handler = async function buildFrameworkCache(argv) {
  if (!isMacOS()) {
    detox.log.info(`The command is supported only on macOS, skipping the execution.`);
    return;
  }

  const frameworkPath = path.join(os.homedir(), '/Library/Detox/ios/framework');
  const xcuitestPath = path.join(os.homedir(), '/Library/Detox/ios/xcuitest-runner');

  await handleCleaning(
    argv.clean,
    frameworkPath,
    'Detox framework',
    xcuitestPath,
    'XCUITest runner'
  );

  await handleBuilding(
    argv.build,
    frameworkPath,
    '../scripts/build_local_framework.ios.sh',
    'Detox framework',
    xcuitestPath,
    '../scripts/build_local_xcuitest.ios.sh',
    'XCUITest runner'
  );
};

function isMacOS() {
  return os.platform() === 'darwin';
}

async function handleCleaning(cleanOption, frameworkPath, frameworkDesc, xcuitestPath, xcuitestDesc) {
  if (cleanOption === 'all' || cleanOption === 'detox') {
    await cleanCache(frameworkPath, frameworkDesc);
  }
  if (cleanOption === 'all' || cleanOption === 'xcuitest') {
    await cleanCache(xcuitestPath, xcuitestDesc);
  }
}

async function cleanCache(targetPath, descriptor) {
  detox.log.info(`Cleaning ${descriptor} cache at ${targetPath}\n`);
  await fs.remove(targetPath);
}

async function handleBuilding(buildOption, frameworkPath, frameworkScript, frameworkDesc, xcuitestPath, xcuitestScript, xcuitestDesc) {
  if (buildOption === 'all' || buildOption === 'detox') {
    await buildCache(frameworkPath, frameworkScript, frameworkDesc);
  }
  if (buildOption === 'all' || buildOption === 'xcuitest') {
    await buildCache(xcuitestPath, xcuitestScript, xcuitestDesc);
  }
}

async function buildCache(targetPath, scriptPath, descriptor) {
  detox.log.info(`Building ${descriptor} at ${targetPath}`);

  try {
    const result = await exec(path.join(__dirname, scriptPath), { capture: ['stdout', 'stderr'] });
    detox.log.info(result.stdout);
  } catch (error) {
    detox.log.error(`Error while building ${descriptor}: ${error.stderr}`);
    throw new Error(`Failed to build ${descriptor}`);
  }
}
