// @ts-nocheck
const realm = require('../realms/primary');

const TestRunnerCommand = require('./testCommand/TestRunnerCommand');

module.exports.command = 'test';
module.exports.desc = 'Run your test suite with the test runner specified in package.json';
module.exports.builder = require('./testCommand/builder');
module.exports.middlewares = require('./testCommand/middlewares').default;

module.exports.handler = async function test({ detoxArgs, runnerArgs }) {
  try {
    await realm.setup({ argv: detoxArgs, testRunnerArgv: runnerArgs });

    const runnerCommand = new TestRunnerCommand()
      .setRunnerConfig(realm.config.runnerConfig)
      .setDeviceConfig(realm.config.deviceConfig)
      .replicateCLIConfig(realm.config.cliConfig);

    await runnerCommand.execute();
  } finally {
    await realm.teardown();
  }
};
