const detox = require('../internals');

const TestRunnerCommand = require('./testCommand/TestRunnerCommand');

module.exports.command = 'test';
module.exports.desc = 'Run your test suites with the test runner specified in the project\'s Detox config';
module.exports.builder = require('./testCommand/builder');
module.exports.middlewares = require('./testCommand/middlewares').default;

module.exports.handler = async function test({ detoxArgs, runnerArgs }) {
  try {
    const opts = {
      argv: detoxArgs,
      testRunnerArgv: runnerArgs,
      workerId: null,
    };

    if (!detoxArgs['inspect-brk']) {
      await detox.init(opts);
    }

    const config = await detox.resolveConfig(opts);
    const runnerCommand = new TestRunnerCommand()
      .setDeviceConfig(config.device)
      .replicateCLIConfig(config.cli)
      .setRunnerConfig(config.testRunner);

    await runnerCommand.execute();
  } finally {
    await detox.cleanup();
  }
};
