// @ts-nocheck
const realm = require('../realms/root');

const TestRunnerCommand = require('./testCommand/TestRunnerCommand');

module.exports.command = 'test';
module.exports.desc = 'Run your test suite with the test runner specified in package.json';
module.exports.builder = require('./testCommand/builder');
module.exports.middlewares = require('./testCommand/middlewares').default;

module.exports.handler = async function test({ detoxArgs, runnerArgs, specs }) {
  try {
    await realm.setup({ argv: detoxArgs });

    const runnerCommand = new TestRunnerCommand()
      .setDeviceConfig(realm.config.deviceConfig)
      .replicateCLIConfig(realm.config.cliConfig)
      .setRunnerConfig(realm.config.runnerConfig)
      .assignArgv(runnerArgs)
      .setRetries(detoxArgs.retries)
      .setSpecs(specs);

    if (detoxArgs['inspect-brk']) {
      runnerCommand.enableDebugMode();
    }

    await runnerCommand.execute();
  } finally {
    await realm.teardown();
  }
};
