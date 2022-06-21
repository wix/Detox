const detox = require('../src');

const TestRunnerCommand = require('./testCommand/TestRunnerCommand');

module.exports.command = 'test';
module.exports.desc = 'Run your test suite with the test runner specified in package.json';
module.exports.builder = require('./testCommand/builder');
module.exports.middlewares = require('./testCommand/middlewares').default;

module.exports.handler = async function test({ detoxArgs, runnerArgs }) {
  try {
    await detox.init({
      argv: detoxArgs,
      testRunnerArgv: runnerArgs,
    });

    const runnerCommand = new TestRunnerCommand()
      .setRunnerConfig(detox.config.runnerConfig)
      .setDeviceConfig(detox.config.deviceConfig)
      .replicateCLIConfig(detox.config.cliConfig);

    await runnerCommand.execute();
  } finally {
    await detox.cleanup();
  }
};
