// @ts-nocheck
const cp = require('child_process');
const fs = require('fs');

const detox = require('../internals');

module.exports.command = 'build';
module.exports.desc = "Runs the user-provided build command, as defined in the 'build' property of the specified configuration.";
module.exports.builder = {
  C: {
    alias: 'config-path',
    group: 'Configuration:',
    describe: 'Specify Detox config file path. If not supplied, detox searches for .detoxrc[.js] or "detox" section in package.json',
  },
  c: {
    alias: 'configuration',
    group: 'Configuration:',
    describe:
      "Select a device configuration from your defined configurations, if not supplied, and there's only one configuration, detox will default to it",
  },
  i: {
    alias: 'if-missing',
    group: 'Configuration:',
    boolean: true,
    describe:
      'Execute the build command only if the app binary is missing.',
  },
  s: {
    alias: 'silent',
    group: 'Configuration:',
    boolean: true,
    describe:
      'Do not fail with error if an app config has no build command.',
  },
};

function checkWhichAppsExist(appsConfig) {
  const result = { '*': true };

  for (const appName of Object.keys(appsConfig)) {
    result[appName] = true;

    /* istanbul ignore next */
    const app = appsConfig[appName] || {};
    if (app.binaryPath && !fs.existsSync(app.binaryPath)) {
      result[appName] = result['*'] = false;
    }

    if (app.testBinaryPath && !fs.existsSync(app.testBinaryPath)) {
      result[appName] = result['*'] = false;
    }
  }

  return result;
}

module.exports.handler = async function build(argv) {
  const { apps, commands, errorComposer } = await detox.resolveConfig({ argv });
  const appsExist = checkWhichAppsExist(apps);

  let seenBuildCommands = false;

  for (const { appName, build } of commands) {
    const app = apps[appName] || {};

    if (build) {
      seenBuildCommands = true;

      if (argv['if-missing'] && appsExist[appName || '*']) {
        detox.log.info(appName ? `Skipping build for "${appName}" app...` : 'Skipping build...');
        continue;
      }

      try {
        if (appName && commands.length > 1) {
          detox.log.info(`Building "${appName}" app...`);
        }

        detox.log.info(build);
        cp.execSync(build, { stdio: 'inherit' });
      } catch (e) {
        detox.log.warn("\n\nImportant: 'detox build' is a convenience shortcut for calling your own build command, as provided in the config file.\nFailures in this build command are not the responsibility of Detox. You are responsible for maintaining this command.\n");
        throw e;
      }
    }

    if (app.binaryPath && !fs.existsSync(app.binaryPath)) {
      detox.log.warn('After running the build command, Detox could not find your app at the given binary path:\n\t' + app.binaryPath + "\nMake sure it is correct, otherwise you'll get an error on an attempt to install your app.\n");
    }
  }

  if (!seenBuildCommands && !argv.silent) {
    throw errorComposer.missingBuildScript(Object.values(apps)[0]);
  }
};
