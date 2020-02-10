const fs = require('fs-extra');
const ArtifactPlugin = require('../templates/plugin/ArtifactPlugin');
const FileArtifact = require('../templates/artifact/FileArtifact');
const Trace = require('./Trace');

class TracingPlugin extends ArtifactPlugin {
  constructor(config) {
    super(config);

    const {
      pid = process.env.DETOX_START_TIMESTAMP,
      processName = 'detox',
    } = config;

    this._pid = pid;
    this._trace = new Trace().startProcess({id: this._pid, name: processName});
    this._deviceId = null;
  }

  async _logFileExists(traceLogPath) {
    return fs.access(traceLogPath).then(() => true).catch(() => false);
  }

  async onBootDevice(event) {
    super.onBootDevice(event);
    const {deviceId, type} = event;

    this._deviceId = deviceId;

    this._trace.startThread({id: deviceId, name: type});
  }

  async onSuiteStart(suite) {
    super.onSuiteStart(suite);

    this._trace.beginEvent(suite.name, {deviceId: this._deviceId});
  }

  async onSuiteEnd(suite) {
    super.onSuiteEnd(suite);

    this._trace.finishEvent(suite.name);
  }

  async onTestStart(testSummary) {
    super.onTestStart(testSummary);

    this._trace.beginEvent(testSummary.title);
  }

  async onTestDone(testSummary) {
    super.onTestDone(testSummary);

    this._trace.finishEvent(testSummary.title, {status: testSummary.status});
  }

  async onBeforeCleanup() {
    const traceLogPath = await this.api.preparePathForArtifact(`detox_pid_${this._pid}.trace.json`);
    const prefix = await this._logFileExists(traceLogPath) ? ',' : '[';

    this._deviceId = null;

    await new FileArtifact({temporaryData: this._trace.traces({prefix})})
      .save(traceLogPath, {append: true});
  }
}

module.exports = TracingPlugin;
