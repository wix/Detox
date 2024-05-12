const os = require('os');
const path = require('path');

const exec = require('child-process-promise').exec;
const fs = require('fs-extra');
const _ = require('lodash');

const detox = require('../../internals');

const frameworkBuildScript = '../../scripts/build_local_framework.ios.sh';
const xcuitestBuildScript = '../../scripts/build_local_xcuitest.ios.sh';

const getFrameworkPath = _.once(() => path.join(os.homedir(), '/Library/Detox/ios/framework'));
const getXcuitestPath = _.once(() => path.join(os.homedir(), '/Library/Detox/ios/xcuitest-runner'));

function shouldSkipExecution() {
  if (os.platform() !== 'darwin') {
    detox.log.info('The command is supported only on macOS, skipping the execution.');
    return true;
  }

  return false;
}

async function execBuildScript(targetPath, scriptPath, descriptor) {
  detox.log.info(`Building ${descriptor} cache at ${targetPath}..`);

  try {
    const result = await exec(path.join(__dirname, scriptPath), { capture: ['stdout', 'stderr'] });
    detox.log.info(result.stdout);
  } catch (error) {
    detox.log.error(`Error while building ${descriptor}: ${error.stderr}`);
    throw new Error(`Failed to build ${descriptor}`);
  }
}

async function removeTarget(targetPath, descriptor) {
  detox.log.info(`Cleaning ${descriptor} cache at ${targetPath}..`);
  await fs.remove(targetPath);
  detox.log.info(`Done\n`);
}

async function build(framework, xcuitest) {
  if (shouldSkipExecution()) {
    return;
  }

  const shouldBuildBoth = !framework && !xcuitest;

  if (framework || shouldBuildBoth) {
    await execBuildScript(getFrameworkPath(), frameworkBuildScript, 'Detox framework');
  }

  if (xcuitest || shouldBuildBoth) {
    await execBuildScript(getXcuitestPath(), xcuitestBuildScript, 'XCUITest runner');
  }
}

async function clean(framework, xcuitest) {
  if (shouldSkipExecution()) {
    return;
  }

  const shouldCleanBoth = !framework && !xcuitest;

  if (framework || shouldCleanBoth) {
    await removeTarget(getFrameworkPath(), 'Detox framework');
  }

  if (xcuitest || shouldCleanBoth) {
    await removeTarget(getXcuitestPath(), 'XCUITest runner');
  }
}

module.exports = {
  build,
  clean
};
