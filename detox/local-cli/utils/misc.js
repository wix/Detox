const path = require('path');
const fs = require('fs');
const log = require('../../src/utils/logger').child({ __filename });

let exitCode;

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

function reportError(...args) {
  log.error(...args);
  exitCode = 1;
}

module.exports = {
  reportError,
  createFolder,
  createFile,
  lastErrorCode: () => exitCode,
  getPlatformSpecificString,
  printEnvironmentVariables,
  prependNodeModulesBinToPATH,
};
