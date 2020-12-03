const fs = require('fs');
const path = require('path');
const mochaTemplates = require('./templates/mocha');
const jestTemplates = require('./templates/jest');
const {reportError, createFile} = require('./utils/misc');
const {experimentalAndroidInit} = require('./androidExperimental/init-experimental');

let exitCode = 0;

module.exports.command = 'init';
module.exports.desc = 'Scaffold initial E2E test folder structure for a specified test runner';
module.exports.builder = {
  runner: {
    alias: 'r',
    demandOption: true,
    describe: 'test runner name (supported values: mocha, jest)',
    group: 'Configuration:',
  },
  androidDir: {
    alias: 'aDir',
    demandOption: false,
    describe: "The location of the project's build.gradle (defaults to <project>/android)",
    group: 'Configuration:',
  },
  allowExperimental: {
    demandOption: false,
    boolean: true,
    describe: "Allow experimental auto configuration for Android (this is flag)",
    group: 'Configuration:',
  }
};

module.exports.handler = async function init(argv) {
  const {runner, allowExperimental, androidDir = 'android'} = argv;
  if (allowExperimental) {
    experimentalAndroidInit(androidDir);
  }

  switch (runner) {
    case 'mocha':
      createMochaFolderE2E();
      break;
    case 'jest':
      createJestFolderE2E();
      break;
    default:
      throw new Error([
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

function createMochaFolderE2E() {
  createFolder('e2e', {
    '.mocharc.json': mochaTemplates.runnerConfig,
    'init.js': mochaTemplates.initjs,
    'firstTest.spec.js': mochaTemplates.firstTest
  });

  createFile('.detoxrc.json', JSON.stringify({
    testRunner: 'mocha',
    runnerConfig: 'e2e/.mocharc.json',
    configurations: createDefaultConfigurations(),
  }, null, 2))
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
    configurations: createDefaultConfigurations(),
  }, null, 2))
}

function createDefaultConfigurations() {
  return {
    ios: {
      type: 'ios.simulator',
      binaryPath: 'SPECIFY_PATH_TO_YOUR_APP_BINARY',
      device: {
        type: 'iPhone 11',
      },
    },
    android: {
      type: 'android.emulator',
      binaryPath: 'SPECIFY_PATH_TO_YOUR_APP_BINARY',
      device: {
        avdName: 'Pixel_2_API_29',
      },
    },
  };
}
