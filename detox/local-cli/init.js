const fs = require('fs');
const path = require('path');
const util = require('util');

const detox = require('../internals');

const jestTemplates = require('./templates/jest');

let exitCode = 0;

module.exports.command = 'init';
module.exports.desc = 'Creates template files to get you started with Detox';
module.exports.builder = {};

module.exports.handler = async function init() {
  createDetoxConfig();
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
    detox.log.info(`Created a file at path: ${filename}`);
  } catch (err) {
    reportError({ err }, `Failed to create a file at path: ${filename}`);
  }
}

function createJestFolderE2E() {
  createFolder('e2e', {
    'jest.config.js': jestTemplates.runnerConfig,
    'starter.test.js': jestTemplates.starter,
  });
}

function createDetoxConfig() {
  createFile('.detoxrc.js',
    '/** @type {Detox.DetoxConfig} */\n' +
    'module.exports = ' +
    util.inspect(createDefaultConfigurations(), { compact: false, depth: Infinity }) +
    ';\n'
  );
}

/** @returns {Detox.DetoxConfig} */
function createDefaultConfigurations() {
  return {
    testRunner: {
      args: {
        $0: 'jest',
        config: 'e2e/jest.config.js',
      },
      jest: {
        setupTimeout: 120000,
      },
    },
    apps: {
      'ios.debug': {
        type: 'ios.app',
        binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/YOUR_APP.app',
        build: 'xcodebuild -workspace ios/YOUR_APP.xcworkspace -scheme YOUR_APP -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
      },
      'ios.release': {
        type: 'ios.app',
        binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/YOUR_APP.app',
        build: 'xcodebuild -workspace ios/YOUR_APP.xcworkspace -scheme YOUR_APP -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
      },
      'android.debug': {
        type: 'android.apk',
        binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
        build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
        reversePorts: [8081],
      },
      'android.release': {
        type: 'android.apk',
        binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
        build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
      },
    },
    devices: {
      simulator: {
        type: 'ios.simulator',
        device: {
          type: 'iPhone 15',
        },
      },
      attached: {
        type: 'android.attached',
        device: {
          adbName: '.*',
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
      'ios.sim.debug': {
        device: 'simulator',
        app: 'ios.debug',
      },
      'ios.sim.release': {
        device: 'simulator',
        app: 'ios.release',
      },
      'android.att.debug': {
        device: 'attached',
        app: 'android.debug',
      },
      'android.att.release': {
        device: 'attached',
        app: 'android.release',
      },
      'android.emu.debug': {
        device: 'emulator',
        app: 'android.debug',
      },
      'android.emu.release': {
        device: 'emulator',
        app: 'android.release',
      },
    },
  };
}

function reportError(...args) {
  detox.log.error(...args);
  exitCode = 1;
}
