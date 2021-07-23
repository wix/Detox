const cp = require('child_process');
const fs = require('fs');

const _ = require('lodash');

const { composeDetoxConfig } = require('../src/configuration');
const log = require('../src/utils/logger').child({ __filename });

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

module.exports.handler = async function build(argv) {
  const { errorComposer, appsConfig } = await composeDetoxConfig({ argv });
  const apps = _.entries(appsConfig);

  for (const [appName, app] of apps) {
    const buildScript = app.build;

    if (argv['if-missing'] && app.binaryPath && fs.existsSync(app.binaryPath)) {
      log.info(`Skipping build for "${appName}" app...`);
      continue;
    }

    if (buildScript) {
      try {
        if (apps.length > 1) {
          log.info(`Building "${appName}" app...`);
        }

        log.info(buildScript);
        cp.execSync(buildScript, { stdio: 'inherit' });
      } catch (e) {
        log.warn("\n\nImportant: 'detox build' is a convenience shortcut for calling your own build command, as provided in the config file.\nFailures in this build command are not the responsibility of Detox. You are responsible for maintaining this command.\n");
        throw e;
      }
    } else if (!argv.silent) {
      throw errorComposer.missingBuildScript(app);
    }

    if (app.binaryPath && !fs.existsSync(app.binaryPath)) {
      log.warn('\nImportant: after running the build command, Detox could not find your app at the given binary path:\n\t' + app.binaryPath + "\nMake sure it is correct, otherwise you'll get an error on an attempt to install your app.\n");
    }
  }
};
