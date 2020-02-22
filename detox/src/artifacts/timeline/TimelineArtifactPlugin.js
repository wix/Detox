const _noop = require('lodash/noop');
const fs = require('fs-extra');
const ArtifactPlugin = require('../templates/plugin/ArtifactPlugin');
const FileArtifact = require('../templates/artifact/FileArtifact');
const Trace = require('./Trace');

const traceStub = {
  startProcess: (stubArgs) => _noop,
  startThread: _noop,
  beginEvent: _noop,
  finishEvent: _noop,
  traces: _noop,
};

class TimelineArtifactPlugin extends ArtifactPlugin {
  constructor(config) {
    super(config);

    const {
      pid = process.env.DETOX_START_TIMESTAMP,
      processName = 'detox',
    } = (config.timeline || {});

    this._pid = pid;
    this._deviceId = null;

    this._trace = this.enabled ? new Trace() : traceStub;
    this._trace.startProcess({id: this._pid, name: processName});
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
    this._deviceId = null;

    if (!this.enabled) {
      return;
    }

    const traceLogPath = await this.api.preparePathForArtifact(`detox_pid_${this._pid}.trace.json`);
    const prefix = await this._logFileExists(traceLogPath) ? ',' : '[';

    const fileArtifact = new FileArtifact({temporaryData: this._trace.traces({prefix})});
    await fileArtifact.save(traceLogPath, {append: true});
  }

  async _logFileExists(traceLogPath) {
    return fs.access(traceLogPath).then(() => true).catch(() => false);
  }

  /** @param {string} config */
  static parseConfig(config) {
    return {
      enabled: config === 'all',
    };
  }
}

module.exports = TimelineArtifactPlugin;
