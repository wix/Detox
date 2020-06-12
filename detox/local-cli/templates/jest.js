const firstTestContent = require('./firstTestContent');

const runnerConfig = `{
    "testEnvironment": "./environment",
    "testRunner": "jest-circus/runner",
    "testTimeout": 120000,
    "testRegex": "\\\\.e2e\\\\.js$",
    "reporters": ["detox/runners/jest/streamlineReporter"],
    "verbose": true
}
`;

const environmentJsContent = `const {
  DetoxCircusEnvironment,
  SpecReporter,
  WorkerAssignReporter,
} = require('detox/runners/jest-circus');

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  constructor(config) {
    super(config);

    // Can be safely removed, if you are content with the default value (=300000ms)
    this.initTimeout = 300000;

    // This takes care of generating status logs on a per-spec basis. By default, Jest only reports at file-level.
    // This is strictly optional.
    this.registerListeners({
      SpecReporter,
      WorkerAssignReporter,
    });
  }
}

module.exports = CustomDetoxEnvironment;
`;

exports.environment = environmentJsContent;
exports.firstTest = firstTestContent;
exports.runnerConfig = runnerConfig;
