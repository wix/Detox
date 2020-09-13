const path = require('path');

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
}

module.exports = {
  getPlatformSpecificString,
  printEnvironmentVariables,
  prependNodeModulesBinToPATH,
};
