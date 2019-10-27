const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const mochaTemplates = require('./templates/mocha');
const jestTemplates = require('./templates/jest');
const log = require('../src/utils/logger').child({ __filename });

let exitCode = 0;

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
      patchDetoxConfigInPackageJSON({
        runner: 'mocha',
      });
      break;
    case 'jest':
      createJestFolderE2E();
      patchDetoxConfigInPackageJSON({
        runner: 'jest',
      });
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

function createFile(filename, content) {
  try {
    fs.writeFileSync(filename, content);
    log.info(`Created a file at path: ${filename}`);
  } catch (err) {
    reportError({ err }, `Failed to create a file at path: ${filename}`);
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
    reportError(`Failed to parse package.json due to an error:\n${err.message}`);
  }
}

function loggedSet(obj, path, value) {
  _.set(obj, path, value);

  const pathString = path.map(segment => `[${JSON.stringify(segment)}]`).join('');
  log.info(`  json${pathString} = ${JSON.stringify(value)};`);
}

function savePackageJson(filepath, json) {
  try {
    fs.writeFileSync(filepath, JSON.stringify(json, null, 2) + '\n');
  } catch (err) {
    reportError(`Failed to write changes back into package.json due to an error:\n${err.message}`);
  }
}

function patchDetoxConfigInPackageJSON({ runner }) {
  const packageJsonPath = path.join(process.cwd(), 'package.json');

  if (fs.existsSync(packageJsonPath)) {
    log.info(`Patching package.json at path: ${packageJsonPath}`);

    const packageJson = parsePackageJson(packageJsonPath);
    if (packageJson) {
      loggedSet(packageJson, ['detox', 'test-runner'], runner);
      savePackageJson(packageJsonPath, packageJson);
    }
  } else {
    reportError(`Failed to find package.json at path: ${packageJsonPath}`);
  }
}

function reportError(...args) {
  log.error(...args);
  exitCode = 1;
}
