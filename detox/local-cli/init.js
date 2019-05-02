const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const mochaTemplates = require('./templates/mocha');
const jestTemplates = require('./templates/jest');
const log = require('../src/utils/logger').child({ __filename });

const PREFIX = 'detox-init';

module.exports.command = 'init';
module.exports.desc = 'Scaffold initial E2E test folder structure for a specified test runner';
module.exports.builder = {
  runner: {
    alias: 'r',
    demandOption: true,
    describe: 'test runner name (supported values: mocha, jest)',
    group: 'Configuration:',
  }
};

module.exports.handler = async function init(argv) {
  const {runner} = argv;

  switch (runner) {
    case 'mocha':
      createMochaFolderE2E();
      patchTestRunnerFieldInPackageJSON('mocha');
      break;
    case 'jest':
      createJestFolderE2E();
      patchTestRunnerFieldInPackageJSON('jest');
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
};

function createFolder(dir, files) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);

    for (const entry of Object.entries(files)) {
      const [filename, content] = entry;
      createFile(path.join(dir, filename), content);
    }
  } else {
    log.error(PREFIX, `./e2e folder already exists at path: ${path.resolve(dir)}`);
  }
}

function createFile(filename, content) {
  try {
    fs.writeFileSync(filename, content);
    log.info(PREFIX, `A file was created in: ${filename}`);
  } catch (e) {
    log.error(PREFIX, `Failed to create file in: ${filename}`);
    log.error(PREFIX, e);
  }
}

function createMochaFolderE2E() {
  createFolder('e2e', {
    'mocha.opts': mochaTemplates.runnerConfig,
    'init.js': mochaTemplates.initjs,
    'firstTest.spec.js': mochaTemplates.firstTest
  });
}

function createJestFolderE2E() {
  createFolder('e2e', {
    'config.json': jestTemplates.runnerConfig,
    'init.js': jestTemplates.initjs,
    'firstTest.spec.js': jestTemplates.firstTest
  });
}

function parsePackageJson(filepath) {
  try {
    return require(filepath);
  } catch (err) {
    log.error(PREFIX, `Failed to parse ./package.json due to the error:\n${err.message}`);
  }
}

function patchPackageJson(packageJson, runnerName) {
  _.set(packageJson, ['detox', 'test-runner'], runnerName);

  log.info(PREFIX, 'Patched ./package.json with commands:');
  log.info(PREFIX, `_.set(packageJson, ['detox', 'test-runner'], "${runnerName}")`);
}

function savePackageJson(filepath, json) {
  try {
    fs.writeFileSync(filepath, JSON.stringify(json, null, 2) + '\n');
  } catch (err) {
    log.error(PREFIX, `Failed to write changes into ./package.json due to the error:\n${err.message}`);
  }
}

function patchTestRunnerFieldInPackageJSON(runnerName) {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = parsePackageJson(packageJsonPath);

  if (packageJson) {
    patchPackageJson(packageJson, runnerName);
    savePackageJson(packageJsonPath, packageJson);
  }
}
