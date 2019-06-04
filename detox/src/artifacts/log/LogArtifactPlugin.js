const argparse = require('../../utils/argparse');
const StartupAndTestRecorderPlugin = require('../templates/plugin/StartupAndTestRecorderPlugin');
const getTimeStampString = require('../utils/getTimeStampString');

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
    const deviceId = this.context.deviceId;
    const timestamp = getTimeStampString();

    return this.api.preparePathForArtifact(`${deviceId} ${timestamp}.startup.log`);
  }

  async preparePathForTestArtifact(testSummary) {
    return this.api.preparePathForArtifact('process.log', testSummary);
  }
}

module.exports = LogArtifactPlugin;
