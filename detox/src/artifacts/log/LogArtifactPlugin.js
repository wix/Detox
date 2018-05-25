const argparse = require('../../utils/argparse');
const StartupAndTestRecorderPlugin = require('../templates/StartupAndTestRecorderPlugin');

/***
 * @abstract
 */
class LogArtifactPlugin extends StartupAndTestRecorderPlugin {
  constructor(config) {
    super(config);

    const recordLogs = argparse.getArgValue('record-logs');

    this.enabled = recordLogs && recordLogs !== 'none';
    this.keepOnlyFailedTestsArtifacts = recordLogs === 'failing';
  }

  async preparePathForStartupArtifact() {
    return this.api.preparePathForArtifact('startup.log');
  }

  async preparePathForTestArtifact(testSummary) {
    return this.api.preparePathForArtifact('test.log', testSummary);
  }
}

module.exports = LogArtifactPlugin;