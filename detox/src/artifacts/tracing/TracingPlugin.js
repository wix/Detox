const fs = require('fs-extra');
const ArtifactPlugin = require('../templates/plugin/ArtifactPlugin');
const FileArtifact = require('../templates/artifact/FileArtifact');
const Trace = require('./Trace');

class TracingPlugin extends ArtifactPlugin {
  constructor(config) {
    super(config);

    this.pid = process.env.DETOX_START_TIMESTAMP;

    this.trace = new Trace().startProcess({id: this.pid, name: 'detox'});
  }

  async logFileExists(traceLogPath) {
    try {
      await fs.access(traceLogPath);

      return  true;
    } catch (e) {
      return false;
    }
  }

  async onBootDevice(event) {
    super.onBootDevice(event);

    this.trace.startThread({id: event.deviceId, name: event.type});
  }

  async onSuiteStart(suite) {
    super.onSuiteStart(suite);

    this.trace.beginEvent(suite.name, {deviceId: this.threadId});
  }

  async onSuiteEnd(suite) {
    super.onSuiteEnd(suite);

    this.trace.finishEvent(suite.name);
  }

  async onTestStart(testSummary) {
    super.onTestStart(testSummary);

    this.trace.beginEvent(testSummary.title);
  }

  async onTestDone(testSummary) {
    super.onTestDone(testSummary);

    this.trace.finishEvent(testSummary.title, {status: testSummary.status});
  }

  async onBeforeCleanup() {
    const traceLogPath = await this.api.preparePathForArtifact(`detox_pid_${this.pid}.trace.json`);
    const prefix = await this.logFileExists(traceLogPath) ? ',' : '[';

    await new FileArtifact({temporaryData: this.trace.traces({prefix})}).save(traceLogPath, {append: true});
  }
}

module.exports = TracingPlugin;
