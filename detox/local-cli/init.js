const fs = require('fs');
const path = require('path');

const log = require('../src/utils/logger').child({ __filename });

const jestTemplates = require('./templates/jest');

let exitCode = 0;

module.exports.command = 'init';
module.exports.desc = 'Scaffold initial E2E test folder structure for Detox';
module.exports.builder = {};

module.exports.handler = async function init() {
  createJestFolderE2E();
  process.exit(exitCode); // eslint-disable-line
};

function createFolder(dir, files) {
  if (fs.existsSync(dir)) {
    return reportError(`Failed to create ${dir} folder, because it already exists at path: ${path.resolve(dir)}`);
  }

  try {
    fs.mkdirSync(dir);
  } catch (err) {
    return reportError({ err }, `Failed to create ${dir} folder due to an error:`);
  }

  for (const entry of Object.entries(files)) {
    const [filename, content] = entry;
    createFile(path.join(dir, filename), content);
  }
}

function createFile(filename, content) {
  if (fs.existsSync(filename)) {
    return reportError(
      `Failed to create ${filename} file, ` +
      `because it already exists at path: ${path.resolve(filename)}`
    );
  }

  try {
    fs.writeFileSync(filename, content);
    log.info(`Created a file at path: ${filename}`);
  } catch (err) {
    reportError({ err }, `Failed to create a file at path: ${filename}`);
  }
}

function createJestFolderE2E() {
  createFolder('e2e', {
    'config.json': jestTemplates.runnerConfig,
    'environment.js': jestTemplates.environment,
    'firstTest.e2e.js': jestTemplates.firstTest,
  });

  createFile('.detoxrc.json', JSON.stringify({
    testRunner: 'jest',
    runnerConfig: 'e2e/config.json',
    ...createDefaultConfigurations(),
  }, null, 2));
}

function createDefaultConfigurations() {
  return {
    apps: {
      ios: {
        type: 'ios.app',
        binaryPath: 'SPECIFY_PATH_TO_YOUR_APP_BINARY',
      },
      android: {
        type: 'android.apk',
        binaryPath: 'SPECIFY_PATH_TO_YOUR_APP_BINARY',
      },
    },
    devices: {
      simulator: {
        type: 'ios.simulator',
        device: {
          type: 'iPhone 11',
        },
      },
      emulator: {
        type: 'android.emulator',
        device: {
          avdName: 'Pixel_3a_API_30_x86',
        },
      },
    },
    configurations: {
      ios: {
        device: 'simulator',
        app: 'ios',
      },
      android: {
        device: 'emulator',
        app: 'android',
      },
    },
  };
}

function reportError(...args) {
  log.error(...args);
  exitCode = 1;
}
