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

    const {
      pid = process.env.DETOX_START_TIMESTAMP,
    } = (config.timeline || {});

    this._globalId = pid;
    this._trace = this.enabled ? systrace : systraceStub;
  }

  async onRunDescribeStart(suite) {
    await super.onRunDescribeStart(suite);
    this._trace.startSection(suite.name);
  }

  async onRunDescribeFinish(suite) {
    this._trace.endSection(suite.name);
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
    this._deviceId = null;

    if (!this.enabled) {
      return;
    }

    const traceLogPath = await this.api.preparePathForArtifact(`detox_pid_${this._globalId}.trace.json`);
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
