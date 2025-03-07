const os = require('os');
const path = require('path');

const fs = require('fs-extra');

const detox = require('../../internals');
const { spawnAndLog } = require('../../src/utils/childProcess');
const { getFrameworkDirPath, getXCUITestRunnerDirPath } = require('../../src/utils/environment');

const frameworkBuildScript = '../../scripts/build_local_framework.ios.sh';
const xcuitestBuildScript = '../../scripts/build_local_xcuitest.ios.sh';

function shouldSkipExecution() {
  if (os.platform() !== 'darwin') {
    detox.log.info('The command is supported only on macOS, skipping the execution.');
    return true;
  }

  return false;
}

async function execBuildScript(targetPath, scriptPath, descriptor) {
  detox.log.info(`Building ${descriptor} cache at ${targetPath}..`);

  const scriptFullPath = path.join(__dirname, scriptPath);

  try {
    await spawnAndLog(scriptFullPath, [], { stdio: 'inherit' });
  } catch (error) {
    detox.log.error(`Error while building ${descriptor}:\n${error}`);
    throw error;
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
    await execBuildScript(getFrameworkDirPath, frameworkBuildScript, 'Detox framework');
  }

  if (xcuitest || shouldBuildBoth) {
    await execBuildScript(getXCUITestRunnerDirPath, xcuitestBuildScript, 'XCUITest runner');
  }
}

async function clean(framework, xcuitest) {
  if (shouldSkipExecution()) {
    return;
  }

  const shouldCleanBoth = !framework && !xcuitest;

  if (framework || shouldCleanBoth) {
    await removeTarget(getFrameworkDirPath, 'Detox framework');
  }

  if (xcuitest || shouldCleanBoth) {
    await removeTarget(getXCUITestRunnerDirPath, 'XCUITest runner');
  }
}

module.exports = {
  build,
  clean
};
