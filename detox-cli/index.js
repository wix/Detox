#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const exec = require('child_process');
const execSync = require('child_process').execSync;
//const chalk = require('chalk');
//const prompt = require('prompt');
//const semver = require('semver');
/**
 * Used arguments:
 *   -v --version - to print current version of react-native-cli and react-native dependency
 *   if you are in a RN app folder
 * init - to create a new project and npm install it
 *   --verbose - to print logs while init
 *   --version <alternative react-native package> - override default (https://registry.npmjs.org/react-native@latest),
 *      package to install, examples:
 *     - "0.22.0-rc1" - A new app will be created using a specific version of React Native from npm repo
 *     - "https://registry.npmjs.org/react-native/-/react-native-0.20.0.tgz" - a .tgz archive from any npm repo
 *     - "/Users/home/react-native/react-native-0.22.0.tgz" - for package prepared with `npm pack`, useful for e2e tests
 */

const options = require('minimist')(process.argv.slice(2));

const CLI_MODULE_PATH = () => {
  return path.resolve(process.cwd(), 'node_modules', 'detox', 'cli.js');
};

const DETOX_PACKAGE_JSON_PATH = () => {
  return path.resolve(process.cwd(), 'node_modules', 'detox', 'package.json');
};

if (options._.length === 0) {
  printVersionsAndExit(DETOX_PACKAGE_JSON_PATH());
} else {
  var cli;
  var cliPath = CLI_MODULE_PATH();
  if (fs.existsSync(cliPath)) {
    cli = require(cliPath);
    //exec.execSync(`node ${cliPath}`);

  }

  var commands = options._;
  if (cli) {
    //cli.run();
  }
  process.exit();
}

function printVersionsAndExit(reactNativePackageJsonPath) {
  console.log('detox-cli: ' + require('./package.json').version);
  try {
    console.log('detox: ' + require(reactNativePackageJsonPath).version);
  } catch (e) {
    console.log('detox: n/a - detox is not installed in this project');
  }
}

