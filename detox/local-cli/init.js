const fs = require('fs');
const path = require('path');

const DetoxRuntimeError = require('../src/errors/DetoxRuntimeError');
const log = require('../src/utils/logger').child({ __filename });

const jestTemplates = require('./templates/jest');
const mochaTemplates = require('./templates/mocha');

let exitCode = 0;

module.exports.command = 'init';
module.exports.desc = 'Scaffold initial E2E test folder structure for a specified test runner';
module.exports.builder = {
  runner: {
    alias: 'r',
    demandOption: true,
    describe: 'test runner name (supported values: mocha, jest)',
    group: 'Configuration:',
    default: 'jest',
  }
};

module.exports.handler = async function init(argv) {
  const { runner } = argv;

  switch (runner) {
    case 'mocha':
      createMochaFolderE2E();
      break;
    case 'jest':
      createJestFolderE2E();
      break;
    default:
      throw new DetoxRuntimeError([
        `Convenience scaffolding for \`${runner}\` test runner is not supported currently.\n`,
        'Supported runners at the moment are: `mocha` and `jest`:',
        '* detox init -r mocha',
        '* detox init -r jest\n',
        `If it is not a typo, and you plan to work with \`${runner}\` runner, then you have to create test setup files manually.`,
        'HINT: Try running one of the commands above, look what it does, and take similar steps for your use case.',
      ].join('\n'));
  }

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

function createMochaFolderE2E() {
  createFolder('e2e', {
    '.mocharc.json': mochaTemplates.runnerConfig,
    'init.js': mochaTemplates.initjs,
    'firstTest.spec.js': mochaTemplates.firstTest
  });

  createFile('.detoxrc.json', JSON.stringify({
    testRunner: 'mocha',
    runnerConfig: 'e2e/.mocharc.json',
    ...createDefaultConfigurations(),
  }, null, 2));
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
    skipLegacyWorkersInjection: true,
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
