const detox = require('../internals');

const AppStartCommand = require('./startCommand/AppStartCommand');

module.exports.command = 'start';
module.exports.desc = 'Run app "start" scripts inside the selected configuration';
module.exports.builder = {
  C: {
    alias: 'config-path',
    describe: 'Specify Detox config file path. If not supplied, Detox searches for .detoxrc[.js] or "detox" section in package.json',
  },
  c: {
    alias: ['configuration'],
    describe:
      'Select a local configuration from your defined configurations to extract the app "start" scripts from. If not supplied, and there\'s only one configuration, Detox will default to it',
  },
  f: {
    alias: 'force',
    describe: 'Ignore errors from the "start" scripts and proceed',
    boolean: true,
  }
};

module.exports.handler = async function start(argv) {
  const { commands } = await detox.resolveConfig({ argv });
  const startCommands = commands.map(s => s.start).filter(Boolean)
    .map(cmd => new AppStartCommand({
      cmd,
      passthrough: argv['--'],
      forceSpawn: argv.force,
    }));

  if (startCommands.length) {
    try {
      await Promise.all(startCommands.map(c => c.execute()));
    } catch (e) {
      await Promise.allSettled(startCommands.map(c => c.stop()));
      throw e;
    }
  } else {
    detox.log.warn('No "start" commands were found in the app configs.');
  }
};
