const _noop = require('lodash/noop');
const fs = require('fs-extra');
const ArtifactPlugin = require('../templates/plugin/ArtifactPlugin');
const FileArtifact = require('../templates/artifact/FileArtifact');
const { systrace } = require('../../systrace');

const systraceStub = {
  startSection: _noop,
  endSection: _noop,
};

class TimelineArtifactPlugin extends ArtifactPlugin {
  constructor(config) {
    super(config);

    this._trace = this.enabled ? systrace : systraceStub;
  }

  async onBootDevice(event) {
    this._deviceName = event.deviceId;
    return super.onBootDevice(event);
  }

  async onRunDescribeStart(suite) {
    if (suite.name === 'ROOT_DESCRIBE_BLOCK') {
      this._trace.startSection(this._deviceName);
    }
    await super.onRunDescribeStart(suite);
  }

  async onRunDescribeFinish(suite) {
    if (suite.name === 'ROOT_DESCRIBE_BLOCK' && this._deviceName) {
      this._trace.endSection(this._deviceName);
    }
    await super.onRunDescribeFinish(suite);
  }

  async onTestStart(testSummary) {
    await super.onTestStart(testSummary);
    this._trace.startSection(testSummary.title);
  }

  async onTestDone(testSummary) {
    this._trace.endSection(testSummary.title, {status: testSummary.status});
    await super.onTestDone(testSummary);
  }

  async onBeforeCleanup() {
    this._deviceName = null;

    if (!this.enabled) {
      return;
    }

    const traceLogPath = await this.api.preparePathForArtifact(`detox.trace.json`);
    const append = await this._logFileExists(traceLogPath);

    const fileArtifact = new FileArtifact({ temporaryData: this._trace.toArtifactExport(append) });
    await fileArtifact.save(traceLogPath, { append });
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
