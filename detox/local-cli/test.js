const detox = require('../internals');

const TestRunnerCommand = require('./testCommand/TestRunnerCommand');

module.exports.command = 'test';
module.exports.desc = 'Run your test suite with the test runner specified in package.json';
module.exports.builder = require('./testCommand/builder');
module.exports.middlewares = require('./testCommand/middlewares').default;

module.exports.handler = async function test({ detoxArgs, runnerArgs }) {
  try {
    const opts = {
      argv: detoxArgs,
      testRunnerArgv: runnerArgs,
      workerId: null,
    };

    const config = await detox.resolveConfig(opts);
    if (!config.testRunner.inspectBrk) {
      await detox.init(opts);
    }

    const runnerCommand = new TestRunnerCommand()
      .setDeviceConfig(detox.config.device)
      .replicateCLIConfig(detox.config.cli)
      .setRunnerConfig(detox.config.testRunner);

    await runnerCommand.execute();
  } finally {
    await detox.cleanup();
  }
};
