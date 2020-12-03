const path = require('path');
const fs = require('fs');
const log = require('../../src/utils/logger').child({ __filename });

function getPlatformSpecificString(platform) {
  switch (platform) {
    case 'ios': return ':android:';
    case 'android': return ':ios:';
    default: return undefined;
  }
}

function printEnvironmentVariables(envObject) {
  return Object.entries(envObject).reduce((cli, [key, value]) => {
    if (value == null || value === '') {
      return cli;
    }

    return `${cli}${key}=${JSON.stringify(value)} `;
  }, '');
}

function prependNodeModulesBinToPATH(env) {
  const PATH = Object.keys(env).find(key => `${key.toUpperCase()}` === 'PATH');
  if (!PATH) {
    return;
  }

  const nodeBinariesPath = path.dirname(process.argv[1]) + path.delimiter;
  if (!env[PATH].startsWith(nodeBinariesPath)) {
    env[PATH] = nodeBinariesPath + env[PATH];
  }

  return env[PATH];
}

function reportError(...args) {
  log.error(...args);
  exitCode = 1;
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

module.exports = {
  reportError,
  createFile,
  getPlatformSpecificString,
  printEnvironmentVariables,
  prependNodeModulesBinToPATH,
};
